import { Product } from "@/models/product";
import { createRoute } from "@/lib";
import { ApiResponseBuilder, RequestValidator, API_MESSAGES } from "@/lib";
import { AuthenticatedUser } from "@/lib/auth/privy-auth";

// Use this ONCE per route file
const route = createRoute();

// GET /api/products - Browse all products (Public)
async function getProductsHandler(request: Request) {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "10");
  const category = url.searchParams.get("category");
  const sortBy = url.searchParams.get("sortBy") || "createdAt";
  const sortOrder = url.searchParams.get("sortOrder") || "desc";

  // Validate pagination
  if (page < 1 || limit < 1 || limit > 100) {
    return ApiResponseBuilder.error("Invalid pagination parameters", 400);
  }

  // Build query
  const query: any = { publishedAt: { $exists: true } };
  if (category && category !== "All") {
    query.category = category;
  }

  // Build sort
  const sort: any = {};
  sort[sortBy] = sortOrder === "asc" ? 1 : -1;

  try {
    const skip = (page - 1) * limit;
    const [products, total] = await Promise.all([
      Product.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate(
          "creator",
          "farcaster.displayName farcaster.username farcaster.pfp"
        )
        .lean(),
      Product.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    return ApiResponseBuilder.paginated(
      products,
      page,
      limit,
      total,
      "Products retrieved successfully"
    );
  } catch (error) {
    console.error("Error fetching products:", error);
    return ApiResponseBuilder.error("Failed to fetch products", 500);
  }
}

// POST /api/products - Create new product (Protected)
async function createProductHandler(
  request: Request,
  authenticatedUser: AuthenticatedUser
) {
  const privyId = authenticatedUser.privyId;

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
    .required(body.hasExternalLinks, "hasExternalLinks");

  if (!validator.isValid()) {
    return validator.getErrorResponse()!;
  }

  // Validate images
  if (body.images && Array.isArray(body.images)) {
    validator.array(body.images, "images", 1, 10);
  } else {
    return ApiResponseBuilder.error("At least one image is required", 400);
  }

  // Validate based on hasExternalLinks
  if (body.hasExternalLinks) {
    if (
      !body.externalLinks ||
      !Array.isArray(body.externalLinks) ||
      body.externalLinks.length === 0
    ) {
      return ApiResponseBuilder.error(
        "External links are required when hasExternalLinks is true",
        400
      );
    }
  } else {
    if (
      !body.digitalFiles ||
      !Array.isArray(body.digitalFiles) ||
      body.digitalFiles.length === 0
    ) {
      return ApiResponseBuilder.error(
        "Digital files are required when hasExternalLinks is false",
        400
      );
    }
  }

  if (!validator.isValid()) {
    return validator.getErrorResponse()!;
  }

  try {
    // Get user to get FID
    const { User } = await import("@/models/user");
    const user = await (User as any).findByPrivyId(privyId);

    if (!user) {
      return ApiResponseBuilder.notFound(API_MESSAGES.USER_NOT_FOUND);
    }

    // Create product
    const productData = {
      ...body,
      creatorFid: user.farcasterFid,
      totalSold: 0,
      totalRatings: 0,
      ratingsScore: 0,
      ratingsBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };

    const product = new Product(productData);
    await product.save();

    // Check if auto-publish is requested
    const url = new URL(request.url);
    const autoPublish = url.searchParams.get("publish") === "true";

    if (autoPublish) {
      product.publishedAt = new Date();
      await product.save();
    }

    return ApiResponseBuilder.success(
      product,
      "Product created successfully",
      201
    );
  } catch (error) {
    console.error("Error creating product:", error);
    return ApiResponseBuilder.error("Failed to create product", 500);
  }
}

// Automatic middleware wrapping - no withAPI() needed!
export const GET = route.public(getProductsHandler);
export const POST = route.protected(createProductHandler);
