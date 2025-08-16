import { Product } from "@/models/product";
import { User } from "@/models/user";
import { Purchase } from "@/models/purchase";
import connectDB from "@/lib/db/connect";
import { ApiResponseBuilder, withErrorHandling, RequestValidator } from "@/lib";
import { withAuth, AuthenticatedUser } from "@/lib/auth/privy-auth";

// GET /api/products/my - Get creator's products (Protected)
async function getMyProductsHandler(
  request: Request,
  authenticatedUser: AuthenticatedUser
) {
  await connectDB();

  const url = new URL(request.url);
  const query = {
    page: parseInt(url.searchParams.get("page") || "1"),
    limit: parseInt(url.searchParams.get("limit") || "10"),
    status: url.searchParams.get("status") || "all", // all, published, draft
    sortBy: url.searchParams.get("sort") || "createdAt",
    sortOrder: url.searchParams.get("order") || "desc",
  };

  const validator = new RequestValidator();

  // Validate pagination parameters
  validator.number(query.page, "page", 1).number(query.limit, "limit", 1, 100);

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
  const validStatuses = ["all", "published", "draft"];

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

  if (!validStatuses.includes(query.status)) {
    return ApiResponseBuilder.error(
      `status must be one of: ${validStatuses.join(", ")}`,
      400
    );
  }

  if (!validator.isValid()) {
    return validator.getErrorResponse()!;
  }

  // Get creator FID from authenticated user
  const user = await (User as any).findByPrivyId(authenticatedUser.privyId);
  if (!user) {
    return ApiResponseBuilder.unauthorized("User not found");
  }

  // Build filter object
  const filter: any = {
    creatorFid: user.farcasterFid,
  };

  // Filter by status
  if (query.status === "published") {
    filter.publishedAt = { $ne: null };
  } else if (query.status === "draft") {
    filter.publishedAt = null;
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

  // Return full product data for creator (including buyer information)
  const creatorProducts = products.map((product: any) => product.toObject());

  // Batch fetch creator info (should be the same user, but future-proof for multiple creators)
  const uniqueFids = [
    ...new Set(creatorProducts.map((p: any) => p.creatorFid)),
  ];
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

  // Batch fetch recent buyers for all products (creator can see their own buyers)
  const productIds = creatorProducts.map((p: any) => p._id.toString());
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

  // Attach creator info and buyers to each product
  const productsWithCreatorAndBuyers = creatorProducts.map((product: any) => {
    const creator = userMap.get(product.creatorFid) || null;

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

    // Remove comments from product (keep buyer info for creator)
    const { comments, ...rest } = product;
    return {
      ...rest,
      creator,
      buyers,
    };
  });

  return ApiResponseBuilder.paginated(
    productsWithCreatorAndBuyers,
    query.page,
    query.limit,
    total,
    "Creator products retrieved successfully"
  );
}

export const GET = withErrorHandling(withAuth(getMyProductsHandler));
