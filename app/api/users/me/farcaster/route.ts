import { User } from "@/models/user";
import { createRoute } from "@/lib";
import { ApiResponseBuilder, RequestValidator, API_MESSAGES } from "@/lib";
import { AuthenticatedUser } from "@/lib/auth/privy-auth";

// Use this ONCE per route file
const route = createRoute();

// PUT /api/users/me/farcaster - Update Farcaster profile
async function updateFarcasterHandler(
  request: Request,
  authenticatedUser: AuthenticatedUser
) {
  const privyId = authenticatedUser.privyId;

  const validator = await RequestValidator.fromRequest(request);
  if (!validator.isValid()) {
    return validator.getErrorResponse()!;
  }

  const body = validator.body;

  // Validate farcaster updates
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

  // Update farcaster profile
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

  const userResponse = user.toPublicJSON();

  return ApiResponseBuilder.success(
    userResponse,
    API_MESSAGES.FARCASTER_UPDATED_SUCCESS
  );
}

// Automatic middleware wrapping - no withAPI() needed!
export const PUT = route.protected(updateFarcasterHandler);
