import { Product } from "@/models/product";
import { User } from "@/models/user";
import connectDB from "@/lib/db/connect";
import { ApiResponseBuilder, withErrorHandling, RequestValidator } from "@/lib";
import { withAuth, AuthenticatedUser } from "@/lib/auth/privy-auth";
import { NotificationService } from "@/lib/services/notification-service";
import mongoose from "mongoose";

// GET /api/products/[id]/comments - Get product comments (Public)
async function getProductCommentsHandler(
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

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "10");

  // Validate pagination
  const paginationValidator = new RequestValidator();
  paginationValidator.number(page, "page", 1).number(limit, "limit", 1, 100);

  if (!paginationValidator.isValid()) {
    return paginationValidator.getErrorResponse()!;
  }

  // Get comments with pagination
  const comments = product.comments || [];
  const total = comments.length;
  const skip = (page - 1) * limit;

  // Sort comments by creation date (newest first) and paginate
  const paginatedComments = comments
    .sort(
      (a: any, b: any) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(skip, skip + limit);

  // Batch fetch user info for all unique commentorFids
  const uniqueFids = [...new Set(paginatedComments.map((c: any) => c.commentorFid))];
  const users = await User.find({ farcasterFid: { $in: uniqueFids } });
  
  // Create a map for quick user lookup
  const userMap = users.reduce((acc: any, user: any) => {
    acc[user.farcasterFid] = user.toPublicJSON();
    return acc;
  }, {});

  // Enrich comments with user data
  const enrichedComments = paginatedComments.map((comment: any) => ({
    _id: comment._id,
    comment: comment.comment,
    createdAt: comment.createdAt,
    commentor: userMap[comment.commentorFid] || null,
  }));

  return ApiResponseBuilder.paginated(
    enrichedComments,
    page,
    limit,
    total,
    "Product comments retrieved successfully"
  );
}

// POST /api/products/[id]/comments - Add product comment (Protected)
async function addProductCommentHandler(
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

  // Validate comment content
  validator
    .required(body.comment, "comment")
    .string(body.comment, "comment", 1, 1000);

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

  // Add comment using the model method
  await product.addComment(user.farcasterFid, body.comment);

  // 🚀 NEW: Trigger notification for comment
  try {
    await NotificationService.handleCommentEvent({
      productId: product._id.toString(),
      productName: product.name,
      commenterFid: user.farcasterFid,
      creatorFid: product.creatorFid,
      comment: body.comment,
    });
  } catch (notificationError) {
    console.error("Error creating comment notification:", notificationError);
    // Don't fail the comment if notification fails
  }

  // Get the newly added comment
  const rawComment = product.comments[product.comments.length - 1];
  const newComment = {
    _id: rawComment._id,
    commentorFid: rawComment.commentorFid,
    comment: rawComment.comment,
    createdAt: rawComment.createdAt,
  };

  return ApiResponseBuilder.success(
    newComment,
    "Comment added successfully",
    201
  );
}

// Export handlers
export const GET = withErrorHandling(getProductCommentsHandler);
export const POST = withErrorHandling(withAuth(addProductCommentHandler));
