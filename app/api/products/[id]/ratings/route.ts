import { Product } from "@/models/product";
import { User } from "@/models/user";
import { Purchase } from "@/models/purchase";
import connectDB from "@/lib/db/connect";
import { ApiResponseBuilder, withErrorHandling, RequestValidator } from "@/lib";
import { withAuth, AuthenticatedUser } from "@/lib/auth/privy-auth";
import mongoose from "mongoose";

// GET /api/products/[id]/ratings - Get product rating statistics (Public)
async function getProductRatingsHandler(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();

  const { id } = await params;

  const validator = new RequestValidator();
  validator.required(id, "id").string(id, "id", 1);

  if (!validator.isValid()) {
    return validator.getErrorResponse()!;
  }

  // Validate MongoDB ObjectId format
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return ApiResponseBuilder.error("Invalid product ID format", 400);
  }

  const product = await Product.findById(id);

  if (!product) {
    return ApiResponseBuilder.notFound("Product not found");
  }

  // Check if product is published
  if (!product.publishedAt) {
    return ApiResponseBuilder.notFound("Product not found");
  }

  // Prepare rating statistics
  const ratingStats = {
    averageRating: product.ratingsScore,
    totalRatings: product.totalRatings,
    ratingsBreakdown: product.ratingsBreakdown,
    // Calculate percentages for each rating
    ratingsPercentages: {
      1:
        product.totalRatings > 0
          ? Math.round(
              (product.ratingsBreakdown[1] / product.totalRatings) * 100
            )
          : 0,
      2:
        product.totalRatings > 0
          ? Math.round(
              (product.ratingsBreakdown[2] / product.totalRatings) * 100
            )
          : 0,
      3:
        product.totalRatings > 0
          ? Math.round(
              (product.ratingsBreakdown[3] / product.totalRatings) * 100
            )
          : 0,
      4:
        product.totalRatings > 0
          ? Math.round(
              (product.ratingsBreakdown[4] / product.totalRatings) * 100
            )
          : 0,
      5:
        product.totalRatings > 0
          ? Math.round(
              (product.ratingsBreakdown[5] / product.totalRatings) * 100
            )
          : 0,
    },
  };

  return ApiResponseBuilder.success(
    ratingStats,
    "Product rating statistics retrieved successfully"
  );
}

// POST /api/products/[id]/ratings - Add or update product rating (Protected)
async function addProductRatingHandler(
  request: Request,
  authenticatedUser: AuthenticatedUser
) {
  await connectDB();

  const url = new URL(request.url);
  const id = url.pathname.split("/")[3]; // Extract product ID from path

  const validator = await RequestValidator.fromRequest(request);
  if (!validator.isValid()) {
    return validator.getErrorResponse()!;
  }

  const body = validator.body;

  // Validate product ID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return ApiResponseBuilder.error("Invalid product ID format", 400);
  }

  // Validate rating value
  validator.required(body.rating, "rating").number(body.rating, "rating", 1, 5);

  if (!validator.isValid()) {
    return validator.getErrorResponse()!;
  }

  // Get product
  const product = await Product.findById(id);
  if (!product) {
    return ApiResponseBuilder.notFound("Product not found");
  }

  // Check if product is published
  if (!product.publishedAt) {
    return ApiResponseBuilder.notFound("Product not found");
  }

  // Get authenticated user
  const user = await (User as any).findByPrivyId(authenticatedUser.privyId);
  if (!user) {
    return ApiResponseBuilder.unauthorized("User not found");
  }

  // Check if user is trying to rate their own product
  if (product.creatorFid === user.farcasterFid) {
    return ApiResponseBuilder.forbidden("You cannot rate your own product");
  }

  // Check if user has purchased the product (only buyers can rate)
  if (!product.isFree) {
    const hasPurchased = await Purchase.findOne({
      buyerFid: user.farcasterFid,
      "items.productId": id,
      status: "completed",
      blockchainVerified: true,
    });

    if (!hasPurchased) {
      return ApiResponseBuilder.forbidden(
        "You must purchase the product before rating it"
      );
    }
  }

  // Note: This is a simplified rating system. In a real application, you'd want to:
  // 1. Track individual user ratings to prevent duplicate ratings
  // 2. Allow users to update their existing ratings
  // 3. Store ratings in a separate collection for better querying
  // For now, we'll just add the rating using the existing model method

  try {
    await product.addRating(body.rating);

    const updatedStats = {
      averageRating: product.ratingsScore,
      totalRatings: product.totalRatings,
      ratingsBreakdown: product.ratingsBreakdown,
      userRating: body.rating,
    };

    return ApiResponseBuilder.success(
      updatedStats,
      "Rating added successfully",
      201
    );
  } catch (error: any) {
    return ApiResponseBuilder.error(error.message, 400);
  }
}

// Export handlers
export const GET = withErrorHandling(getProductRatingsHandler);

async function protectedRatingHandler(
  request: Request,
  authenticatedUser: AuthenticatedUser
) {
  return addProductRatingHandler(request, authenticatedUser);
}

export const POST = withErrorHandling(withAuth(protectedRatingHandler));
