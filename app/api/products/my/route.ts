import { Product } from "@/models/product";
import { User } from "@/models/user";
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
      },
    ])
  );

  // Attach creator info to each product
  const productsWithCreator = creatorProducts.map((product: any) => {
    const creator = userMap.get(product.creatorFid) || null;
    // Remove comments from product
    const { comments, ...rest } = product;
    return {
      ...rest,
      creator,
    };
  });

  return ApiResponseBuilder.paginated(
    productsWithCreator,
    query.page,
    query.limit,
    total,
    "Creator products retrieved successfully"
  );
}

export const GET = withErrorHandling(withAuth(getMyProductsHandler));
