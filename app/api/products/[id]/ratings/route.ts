import { Product } from "@/models/product";
import { User } from "@/models/user";
import { Purchase } from "@/models/purchase";
import connectDB from "@/lib/db/connect";
import { ApiResponseBuilder, withErrorHandling, RequestValidator } from "@/lib";
import { withAuth, AuthenticatedUser } from "@/lib/auth/privy-auth";
import { NotificationService } from "@/lib/services/notification-service";
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

  try {
    await product.addRating(body.rating);

    // 🚀 NEW: Trigger notification for rating
    try {
      await NotificationService.handleRatingEvent({
        productId: product._id.toString(),
        productName: product.name,
        raterFid: user.farcasterFid,
        creatorFid: product.creatorFid,
        rating: body.rating,
      });
    } catch (notificationError) {
      console.error("Error creating rating notification:", notificationError);
      // Don't fail the rating if notification fails
    }

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
export const POST = withErrorHandling(withAuth(addProductRatingHandler));
