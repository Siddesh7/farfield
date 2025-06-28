import { User } from "@/models/user";
import connectDB from "@/lib/db/connect";
import {
  ApiResponseBuilder,
  withErrorHandling,
  RequestValidator,
  API_MESSAGES,
} from "@/lib";
import { UserResponse, UserUpdateRequest } from "@/lib/types/user";
import { verifyPrivyToken } from "@/lib/auth/privy-auth";

// GET /api/users/me - Get current authenticated user's profile
async function getMeHandler(request: Request) {
  await connectDB();

  // Verify Privy access token and get authenticated user
  const authenticatedUser = await verifyPrivyToken(request as any);
  const privyId = authenticatedUser.privyId;

  const user = await (User as any).findByPrivyId(privyId);

  if (!user) {
    return ApiResponseBuilder.notFound(API_MESSAGES.USER_NOT_FOUND);
  }

  // Convert to public response (removes sensitive data)
  const userResponse: UserResponse = user.toPublicJSON();

  return ApiResponseBuilder.success(
    userResponse,
    "Profile retrieved successfully"
  );
}

// PUT /api/users/me - Update current user's profile
async function updateMeHandler(request: Request) {
  await connectDB();

  // Verify Privy access token and get authenticated user
  const authenticatedUser = await verifyPrivyToken(request as any);
  const privyId = authenticatedUser.privyId;

  const validator = await RequestValidator.fromRequest(request);
  if (!validator.isValid()) {
    return validator.getErrorResponse()!;
  }

  const body = validator.body;

  // Validate farcaster updates if provided
  if (body.farcaster) {
    if (body.farcaster.displayName !== undefined) {
      validator.string(
        body.farcaster.displayName,
        "farcaster.displayName",
        1,
        100
      );
    }
    if (body.farcaster.bio !== undefined) {
      validator.string(body.farcaster.bio, "farcaster.bio", 0, 500);
    }
    if (body.farcaster.pfp !== undefined) {
      validator.string(body.farcaster.pfp, "farcaster.pfp", 1, 500);
    }
  }

  if (!validator.isValid()) {
    return validator.getErrorResponse()!;
  }

  const user = await (User as any).findByPrivyId(privyId);

  if (!user) {
    return ApiResponseBuilder.notFound(API_MESSAGES.USER_NOT_FOUND);
  }

  // Update farcaster profile if provided
  if (body.farcaster) {
    if (body.farcaster.displayName !== undefined) {
      user.farcaster.displayName = body.farcaster.displayName;
    }
    if (body.farcaster.bio !== undefined) {
      user.farcaster.bio = body.farcaster.bio;
    }
    if (body.farcaster.pfp !== undefined) {
      user.farcaster.pfp = body.farcaster.pfp;
    }
  }

  await user.save();

  const userResponse: UserResponse = user.toPublicJSON();

  return ApiResponseBuilder.success(
    userResponse,
    API_MESSAGES.USER_UPDATED_SUCCESS
  );
}

// DELETE /api/users/me - Delete current user's account
async function deleteMeHandler(request: Request) {
  await connectDB();

  // Verify Privy access token and get authenticated user
  const authenticatedUser = await verifyPrivyToken(request as any);
  const privyId = authenticatedUser.privyId;

  const user = await (User as any).findByPrivyId(privyId);

  if (!user) {
    return ApiResponseBuilder.notFound(API_MESSAGES.USER_NOT_FOUND);
  }

  await User.findByIdAndDelete(user._id);

  return ApiResponseBuilder.success(
    { deleted: true },
    API_MESSAGES.USER_DELETED_SUCCESS
  );
}

// Wrap handlers with both error handling and authentication
async function authenticatedGetHandler(request: Request) {
  try {
    return await getMeHandler(request);
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes("token") ||
        error.message.includes("Authentication"))
    ) {
      return ApiResponseBuilder.unauthorized(error.message);
    }
    throw error;
  }
}

async function authenticatedPutHandler(request: Request) {
  try {
    return await updateMeHandler(request);
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes("token") ||
        error.message.includes("Authentication"))
    ) {
      return ApiResponseBuilder.unauthorized(error.message);
    }
    throw error;
  }
}

async function authenticatedDeleteHandler(request: Request) {
  try {
    return await deleteMeHandler(request);
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes("token") ||
        error.message.includes("Authentication"))
    ) {
      return ApiResponseBuilder.unauthorized(error.message);
    }
    throw error;
  }
}

export const GET = withErrorHandling(authenticatedGetHandler);
export const PUT = withErrorHandling(authenticatedPutHandler);
export const DELETE = withErrorHandling(authenticatedDeleteHandler);
