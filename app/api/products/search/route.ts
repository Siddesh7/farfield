import { Product } from "@/models/product";
import connectDB from "@/lib/db/connect";
import { ApiResponseBuilder, withErrorHandling, RequestValidator } from "@/lib";

// GET /api/products/search - Advanced product search (Public)
async function searchProductsHandler(request: Request) {
  await connectDB();

  const url = new URL(request.url);
  const query = {
    q: url.searchParams.get("q") || "",
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
    minRating: url.searchParams.get("min_rating")
      ? parseFloat(url.searchParams.get("min_rating")!)
      : undefined,
    sortBy: url.searchParams.get("sort") || "relevance",
    sortOrder: url.searchParams.get("order") || "desc",
    tags: url.searchParams.get("tags")?.split(",") || undefined,
    creatorFid: url.searchParams.get("creator_fid")
      ? parseInt(url.searchParams.get("creator_fid")!)
      : undefined,
    hasPreview:
      url.searchParams.get("has_preview") === "true" ? true : undefined,
    hasExternalLinks:
      url.searchParams.get("has_external_links") === "true"
        ? true
        : url.searchParams.get("has_external_links") === "false"
        ? false
        : undefined,
  };

  const validator = new RequestValidator();

  // Validate search query
  if (!query.q.trim()) {
    return ApiResponseBuilder.error("Search query is required", 400);
  }

  validator.string(query.q, "q", 1, 200);

  // Validate pagination parameters
  validator.number(query.page, "page", 1).number(query.limit, "limit", 1, 100);

  // Validate price range
  if (query.priceMin !== undefined) {
    validator.number(query.priceMin, "price_min", 0);
  }
  if (query.priceMax !== undefined) {
    validator.number(query.priceMax, "price_max", 0);
  }

  // Validate rating
  if (query.minRating !== undefined) {
    validator.number(query.minRating, "min_rating", 0, 5);
  }

  // Validate sort parameters
  const validSortFields = [
    "relevance",
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
    $text: { $search: query.q }, // Text search
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

  if (query.minRating !== undefined) {
    filter.ratingsScore = { $gte: query.minRating };
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

  if (query.hasExternalLinks !== undefined) {
    filter.hasExternalLinks = query.hasExternalLinks;
  }

  // Calculate pagination
  const skip = (query.page - 1) * query.limit;

  // Build sort object
  const sort: any = {};

  if (query.sortBy === "relevance") {
    // Sort by text search score (MongoDB text search relevance)
    sort.score = { $meta: "textScore" };
  } else {
    sort[query.sortBy] = query.sortOrder === "asc" ? 1 : -1;
  }

  // Execute query with pagination
  let productQuery = Product.find(filter);

  // Add text score for relevance sorting
  if (query.sortBy === "relevance") {
    productQuery = productQuery.select({ score: { $meta: "textScore" } });
  }

  const [products, total] = await Promise.all([
    productQuery.sort(sort).skip(skip).limit(query.limit).exec(),
    Product.countDocuments(filter),
  ]);

  // Transform to public product data (remove sensitive fields like buyer list)
  const publicProducts = products.map((product: any) => {
    const productObj = product.toObject();
    // Remove buyer information from public search results
    delete productObj.buyer;
    // Remove text search score from response (internal use only)
    delete productObj.score;
    return productObj;
  });

  return ApiResponseBuilder.paginated(
    publicProducts,
    query.page,
    query.limit,
    total,
    `Found ${total} products matching "${query.q}"`
  );
}

export const GET = withErrorHandling(searchProductsHandler);
