import { Product } from "@/models/product";
import { User } from "@/models/user";
import { Purchase } from "@/models/purchase";
import connectDB from "@/lib/db/connect";
import {
  ApiResponseBuilder,
  withErrorHandling,
  RequestValidator,
  API_MESSAGES,
} from "@/lib";
import { Product as ProductType } from "@/lib/types/product";
import { withAuth, AuthenticatedUser } from "@/lib/auth/privy-auth";

// GET /api/products - Browse all products with pagination and filtering
async function getProductsHandler(request: Request) {
  await connectDB();

  const url = new URL(request.url);
  const query = {
    page: parseInt(url.searchParams.get("page") || "1"),
    limit: parseInt(url.searchParams.get("limit") || "10"),
    category: url.searchParams.get("category") || undefined,
    isFree: url.searchParams.get("is_free") === "true" ? true : undefined,
    priceMin: url.searchParams.get("price_min")
      ? parseFloat(url.searchParams.get("price_min")!)
      : undefined,
    priceMax: url.searchParams.get("price_max")
      ? parseFloat(url.searchParams.get("price_max")!)
      : undefined,
    sortBy: url.searchParams.get("sort") || "createdAt",
    sortOrder: url.searchParams.get("order") || "desc",
    tags: url.searchParams.get("tags")?.split(",") || undefined,
    creatorFid: url.searchParams.get("creator_fid")
      ? parseInt(url.searchParams.get("creator_fid")!)
      : undefined,
    hasPreview:
      url.searchParams.get("has_preview") === "true" ? true : undefined,
    q: url.searchParams.get("q") || undefined,
  };

  const validator = new RequestValidator();

  // Validate pagination parameters
  validator.number(query.page, "page", 1).number(query.limit, "limit", 1, 100);

  // Validate price range
  if (query.priceMin !== undefined) {
    validator.number(query.priceMin, "price_min", 0);
  }
  if (query.priceMax !== undefined) {
    validator.number(query.priceMax, "price_max", 0);
  }

  // Validate sort parameters
  const validSortFields = [
    "createdAt",
    "updatedAt",
    "price",
    "ratingsScore",
    "totalSold",
    "name",
  ];
  const validSortOrders = ["asc", "desc"];

  if (!validSortFields.includes(query.sortBy)) {
    return ApiResponseBuilder.error(
      `sort must be one of: ${validSortFields.join(", ")}`,
      400
    );
  }

  if (!validSortOrders.includes(query.sortOrder)) {
    return ApiResponseBuilder.error(
      `order must be one of: ${validSortOrders.join(", ")}`,
      400
    );
  }

  if (!validator.isValid()) {
    return validator.getErrorResponse()!;
  }

  // Build filter object
  const filter: any = {
    publishedAt: { $ne: null }, // Only show published products
  };

  if (query.category) {
    filter.category = query.category;
  }

  if (query.isFree !== undefined) {
    filter.isFree = query.isFree;
  }

  if (query.priceMin !== undefined || query.priceMax !== undefined) {
    filter.price = {};
    if (query.priceMin !== undefined) {
      filter.price.$gte = query.priceMin;
    }
    if (query.priceMax !== undefined) {
      filter.price.$lte = query.priceMax;
    }
  }

  if (query.tags && query.tags.length > 0) {
    filter.tags = { $in: query.tags };
  }

  if (query.creatorFid) {
    filter.creatorFid = query.creatorFid;
  }

  if (query.hasPreview !== undefined) {
    filter.previewAvailable = query.hasPreview;
  }

  // Text search
  if (query.q) {
    filter.$text = { $search: query.q };
  }

  // Calculate pagination
  const skip = (query.page - 1) * query.limit;

  // Build sort object
  const sort: any = {};
  sort[query.sortBy] = query.sortOrder === "asc" ? 1 : -1;

  // Execute query with pagination
  const [products, total] = await Promise.all([
    Product.find(filter).sort(sort).skip(skip).limit(query.limit).exec(),
    Product.countDocuments(filter),
  ]);

  // Transform to public product data (remove sensitive fields like buyer list)
  const publicProducts = products.map((product: any) => {
    const productObj = product.toObject();
    // Remove buyer information from public listing
    delete productObj.buyer;
    return productObj;
  });

  // Batch fetch creator info for all products
  const uniqueFids = [...new Set(publicProducts.map((p: any) => p.creatorFid))];
  const users = await User.find({ farcasterFid: { $in: uniqueFids } });
  const userMap = new Map(
    users.map((u) => [
      u.farcasterFid,
      {
        fid: u.farcasterFid,
        name: u.farcaster.displayName,
        username: u.farcaster.username,
        pfp: u.farcaster.pfp || null,
        isVerified: u.isVerified,
      },
    ])
  );

  // Attach creator info to each product
  const productsWithCreator = publicProducts.map((product: any) => {
    const creator = userMap.get(product.creatorFid) || null;
    return {
      ...product,
      creator,
    };
  });

  // Collect all commentorFids for preview comments across all products
  const allPreviewComments = productsWithCreator.flatMap((product: any) => {
    const comments = product.comments || [];
    return comments
      .sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 3)
      .map((c: any) => ({ ...c, productId: product._id }));
  });
  const allCommentorFids = [
    ...new Set(allPreviewComments.map((c: any) => c.commentorFid)),
  ];
  const allCommentUsers = await User.find({
    farcasterFid: { $in: allCommentorFids },
  });
  const allCommentUserMap = new Map(
    allCommentUsers.map((u) => [
      u.farcasterFid,
      {
        fid: u.farcasterFid,
        name: u.farcaster.displayName,
        username: u.farcaster.username,
        pfp: u.farcaster.pfp || null,
        isVerified: u.isVerified,
      },
    ])
  );

  // Batch fetch recent buyers for all products
  const productIds = productsWithCreator.map((p: any) => p._id.toString());
  const allCompletedPurchases = await Purchase.find({
    "items.productId": { $in: productIds },
    status: "completed",
    blockchainVerified: true,
  }).sort({ completedAt: -1 });

  // Group purchases by product and get latest 3 buyers per product
  const buyersByProduct = new Map();
  allCompletedPurchases.forEach((purchase) => {
    purchase.items.forEach((item: any) => {
      if (productIds.includes(item.productId)) {
        if (!buyersByProduct.has(item.productId)) {
          buyersByProduct.set(item.productId, []);
        }
        const existingBuyers = buyersByProduct.get(item.productId);
        // Avoid duplicate buyers for the same product
        if (
          !existingBuyers.find((b: any) => b.buyerFid === purchase.buyerFid)
        ) {
          existingBuyers.push({
            buyerFid: purchase.buyerFid,
            completedAt: purchase.completedAt,
          });
        }
      }
    });
  });

  // Limit to 3 buyers per product and fetch user info
  const allBuyerFids = new Set();
  buyersByProduct.forEach((buyers, productId) => {
    const latestBuyers = buyers.slice(0, 3);
    buyersByProduct.set(productId, latestBuyers);
    latestBuyers.forEach((buyer: any) => allBuyerFids.add(buyer.buyerFid));
  });

  const allBuyerUsers = await User.find({
    farcasterFid: { $in: Array.from(allBuyerFids) },
  });
  const allBuyerUserMap = new Map(
    allBuyerUsers.map((u) => [
      u.farcasterFid,
      {
        fid: u.farcasterFid,
        name: u.farcaster.displayName,
        username: u.farcaster.username,
        pfp: u.farcaster.pfp || null,
        isVerified: u.isVerified,
      },
    ])
  );

  // Attach commentsPreview and buyers to each product
  const productsWithCommentsAndBuyers = productsWithCreator.map(
    (product: any) => {
      const productComments = product.comments || [];
      const latestComments = productComments
        .sort(
          (a: any, b: any) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 3);
      const commentsPreview = latestComments.map((comment: any) => ({
        _id: comment._id,
        commentorFid: comment.commentorFid,
        comment: comment.comment,
        createdAt: comment.createdAt,
        commentor: allCommentUserMap.get(comment.commentorFid) || null,
      }));

      // Get buyers for this product
      const productBuyers = buyersByProduct.get(product._id.toString()) || [];
      const buyers = productBuyers
        .map((buyer: any) => {
          const buyerInfo = allBuyerUserMap.get(buyer.buyerFid);
          return buyerInfo
            ? {
                fid: buyerInfo.fid,
                username: buyerInfo.username,
                pfp: buyerInfo.pfp,
                name: buyerInfo.name,
              }
            : null;
        })
        .filter(Boolean);

      // Remove creatorFid, comments, and buyer from product
      const { creatorFid, comments, buyer, ...rest } = product;
      return {
        ...rest,
        commentsPreview,
        buyers,
      };
    }
  );

  return ApiResponseBuilder.paginated(
    productsWithCommentsAndBuyers,
    query.page,
    query.limit,
    total,
    "Products retrieved successfully"
  );
}

// POST /api/products - Create new product (Protected - Authenticated users only)
async function createProductHandler(
  request: Request,
  authenticatedUser: AuthenticatedUser
) {
  await connectDB();

  // Parse query param for publish
  const url = new URL(request.url);
  const publishParam = url.searchParams.get("publish");
  const shouldPublish = publishParam === "true";

  const validator = await RequestValidator.fromRequest(request);
  if (!validator.isValid()) {
    return validator.getErrorResponse()!;
  }

  const body = validator.body;

  // Validate required fields
  validator
    .required(body.name, "name")
    .string(body.name, "name", 1, 200)
    .required(body.description, "description")
    .string(body.description, "description", 1, 5000)
    .required(body.price, "price")
    .number(body.price, "price", 0)
    .required(body.category, "category")
    .string(body.category, "category", 1, 100)
    .required(body.hasExternalLinks, "hasExternalLinks")
    .required(body.images, "images")
    .array(body.images, "images", 1);

  // Validate images array
  if (body.images && Array.isArray(body.images)) {
    body.images.forEach((image: string, index: number) => {
      validator.string(image, `images[${index}]`, 1, 500);
    });
  }

  // Validate digital files or external links
  if (body.hasExternalLinks) {
    validator
      .required(body.externalLinks, "externalLinks")
      .array(body.externalLinks, "externalLinks", 1);

    if (body.externalLinks && Array.isArray(body.externalLinks)) {
      body.externalLinks.forEach((link: any, index: number) => {
        validator
          .required(link.name, `externalLinks[${index}].name`)
          .string(link.name, `externalLinks[${index}].name`, 1, 100)
          .required(link.url, `externalLinks[${index}].url`)
          .string(link.url, `externalLinks[${index}].url`, 1, 500)
          .required(link.type, `externalLinks[${index}].type`)
          .enum(link.type, `externalLinks[${index}].type`, [
            "figma",
            "notion",
            "behance",
            "github",
            "other",
          ]);
      });
    }
    // Validate previewLinks if present
    if (body.previewLinks && Array.isArray(body.previewLinks)) {
      body.previewLinks.forEach((link: any, index: number) => {
        validator
          .required(link.name, `previewLinks[${index}].name`)
          .string(link.name, `previewLinks[${index}].name`, 1, 100)
          .required(link.url, `previewLinks[${index}].url`)
          .string(link.url, `previewLinks[${index}].url`, 1, 500)
          .required(link.type, `previewLinks[${index}].type`)
          .enum(link.type, `previewLinks[${index}].type`, [
            "figma",
            "notion",
            "behance",
            "github",
            "other",
          ]);
      });
    }
  } else {
    validator
      .required(body.digitalFiles, "digitalFiles")
      .array(body.digitalFiles, "digitalFiles", 1);

    if (body.digitalFiles && Array.isArray(body.digitalFiles)) {
      body.digitalFiles.forEach((file: any, index: number) => {
        validator
          .required(file.fileName, `digitalFiles[${index}].fileName`)
          .string(file.fileName, `digitalFiles[${index}].fileName`, 1, 255)
          .required(file.fileUrl, `digitalFiles[${index}].fileUrl`)
          .string(file.fileUrl, `digitalFiles[${index}].fileUrl`, 1, 500)
          .required(file.fileSize, `digitalFiles[${index}].fileSize`)
          .number(file.fileSize, `digitalFiles[${index}].fileSize`, 1);
      });
    }
    // Validate previewFiles if present
    if (body.previewFiles && Array.isArray(body.previewFiles)) {
      body.previewFiles.forEach((file: any, index: number) => {
        validator
          .required(file.fileName, `previewFiles[${index}].fileName`)
          .string(file.fileName, `previewFiles[${index}].fileName`, 1, 255)
          .required(file.fileUrl, `previewFiles[${index}].fileUrl`)
          .string(file.fileUrl, `previewFiles[${index}].fileUrl`, 1, 500)
          .required(file.fileSize, `previewFiles[${index}].fileSize`)
          .number(file.fileSize, `previewFiles[${index}].fileSize`, 1);
      });
    }
  }

  // Optional field validation
  if (body.tags) {
    validator.array(body.tags, "tags", 0, 10);
    if (Array.isArray(body.tags)) {
      body.tags.forEach((tag: string, index: number) => {
        validator.string(tag, `tags[${index}]`, 1, 50);
      });
    }
  }

  if (body.fileFormat) {
    validator.array(body.fileFormat, "fileFormat");
  }

  if (body.discountPercentage !== undefined) {
    validator.number(body.discountPercentage, "discountPercentage", 0, 100);
  }

  if (!validator.isValid()) {
    return validator.getErrorResponse()!;
  }

  // Get creator FID from authenticated user
  const creatorUser = await (User as any).findByPrivyId(
    authenticatedUser.privyId
  );
  if (!creatorUser) {
    return ApiResponseBuilder.unauthorized("User not found");
  }

  // Create product
  const hasPreviewFiles =
    Array.isArray(body.previewFiles) && body.previewFiles.length > 0;
  const hasPreviewLinks =
    Array.isArray(body.previewLinks) && body.previewLinks.length > 0;

  const productData: any = {
    ...body,
    creatorFid: creatorUser.farcasterFid,
    isFree: body.price === 0,
    totalSold: 0,
    ratingsScore: 0,
    totalRatings: 0,
    ratingsBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    comments: [],
    buyer: [],
  };

  if (hasPreviewFiles || hasPreviewLinks) {
    productData.previewAvailable = true;
    if (hasPreviewFiles) productData.previewFiles = body.previewFiles;
    if (hasPreviewLinks) productData.previewLinks = body.previewLinks;
  }

  const product = new Product(productData);
  await product.save();

  // If publish=true, validate completeness and set publishedAt
  if (shouldPublish) {
    const validationErrors: string[] = [];
    if (!product.name || product.name.trim().length === 0) {
      validationErrors.push("Product name is required");
    }
    if (!product.description || product.description.trim().length === 0) {
      validationErrors.push("Product description is required");
    }
    if (!product.images || product.images.length === 0) {
      validationErrors.push("At least one product image is required");
    }
    if (!product.category || product.category.trim().length === 0) {
      validationErrors.push("Product category is required");
    }
    if (product.hasExternalLinks) {
      if (!product.externalLinks || product.externalLinks.length === 0) {
        validationErrors.push(
          "External links are required when hasExternalLinks is true"
        );
      }
    } else {
      if (!product.digitalFiles || product.digitalFiles.length === 0) {
        validationErrors.push(
          "Digital files are required when hasExternalLinks is false"
        );
      }
    }
    if (validationErrors.length > 0) {
      return ApiResponseBuilder.error(
        `Cannot publish incomplete product: ${validationErrors.join(", ")}`,
        400
      );
    }
    // Set publishedAt and save
    product.publishedAt = new Date();
    await product.save();
  }

  // Transform product data to include creator info (similar to GET endpoint)
  const productObj = product.toObject();
  
  // Add creator info
  const creatorInfo = {
    fid: creatorUser.farcasterFid,
    name: creatorUser.farcaster.displayName,
    username: creatorUser.farcaster.username,
    pfp: creatorUser.farcaster.pfp || null,
    isVerified: creatorUser.isVerified,
  };
  
  // Remove creatorFid and add creator object
  const { creatorFid, buyer, ...productWithoutSensitiveData } = productObj;
  const responseData = {
    ...productWithoutSensitiveData,
    creator: creatorInfo,
  };

  return ApiResponseBuilder.success(
    responseData,
    shouldPublish
      ? "Product created and published successfully"
      : "Product created successfully",
    201
  );
}

export const GET = withErrorHandling(getProductsHandler);
export const POST = withErrorHandling(withAuth(createProductHandler));