import { Product } from "@/models/product";
import { User } from "@/models/user";
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

  return ApiResponseBuilder.paginated(
    publicProducts,
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
  const productData = {
    ...body,
    creatorFid: creatorUser.farcasterFid,
    isFree: body.price === 0,
    totalSold: 0,
    ratingsScore: 0,
    totalRatings: 0,
    ratingsBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    comments: [],
    buyer: [],
    previewAvailable: false,
  };

  const product = new Product(productData);
  await product.save();

  return ApiResponseBuilder.success(
    product.toObject(),
    "Product created successfully",
    201
  );
}

export const GET = withErrorHandling(getProductsHandler);
export const POST = withErrorHandling(withAuth(createProductHandler));
