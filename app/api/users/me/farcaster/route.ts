import { User } from "@/models/user";
import connectDB from "@/lib/db/connect";
import {
  ApiResponseBuilder,
  withErrorHandling,
  RequestValidator,
  API_MESSAGES,
} from "@/lib";
import { UserResponse, FarcasterUpdateRequest } from "@/lib/types/user";

// PUT /api/users/me/farcaster - Update Farcaster profile
async function updateFarcasterHandler(request: Request) {
  await connectDB();

  const privyId = request.headers.get("x-privy-id");

  if (!privyId) {
    return ApiResponseBuilder.unauthorized(API_MESSAGES.TOKEN_REQUIRED);
  }

  const validator = await RequestValidator.fromRequest(request);
  if (!validator.isValid()) {
    return validator.getErrorResponse()!;
  }

  const body: FarcasterUpdateRequest = validator.body;

  // Validate update fields
  if (body.displayName !== undefined) {
    validator.string(body.displayName, "displayName", 1, 100);
  }

  if (body.bio !== undefined) {
    validator.string(body.bio, "bio", 0, 500);
  }

  if (body.pfp !== undefined) {
    validator.string(body.pfp, "pfp", 1, 500);
  }

  // Ensure at least one field is being updated
  if (
    body.displayName === undefined &&
    body.bio === undefined &&
    body.pfp === undefined
  ) {
    return ApiResponseBuilder.error(
      "At least one field must be provided: displayName, bio, or pfp",
      400
    );
  }

  if (!validator.isValid()) {
    return validator.getErrorResponse()!;
  }

  const user = await (User as any).findByPrivyId(privyId);

  if (!user) {
    return ApiResponseBuilder.notFound(API_MESSAGES.USER_NOT_FOUND);
  }

  // Update Farcaster profile fields
  if (body.displayName !== undefined) {
    user.farcaster.displayName = body.displayName;
  }

  if (body.bio !== undefined) {
    user.farcaster.bio = body.bio;
  }

  if (body.pfp !== undefined) {
    user.farcaster.pfp = body.pfp;
  }

  await user.save();

  const userResponse: UserResponse = user.toPublicJSON();

  return ApiResponseBuilder.success(
    userResponse,
    API_MESSAGES.FARCASTER_UPDATED_SUCCESS
  );
}

export const PUT = withErrorHandling(updateFarcasterHandler);
