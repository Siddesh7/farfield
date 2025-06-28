import { User } from "@/models/user";
import connectDB from "@/lib/db/connect";
import {
  ApiResponseBuilder,
  withErrorHandling,
  RequestValidator,
  API_MESSAGES,
} from "@/lib";
import { PublicUserResponse } from "@/lib/types/user";

// GET /api/users/username/[username] - Get user by Farcaster username
async function getUserByUsernameHandler(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  await connectDB();

  const { username } = await params;

  const validator = new RequestValidator();
  validator.required(username, "username").string(username, "username", 1, 50);

  if (!validator.isValid()) {
    return validator.getErrorResponse()!;
  }

  const user = await (User as any).findByUsername(username);

  if (!user) {
    return ApiResponseBuilder.notFound(API_MESSAGES.USER_NOT_FOUND);
  }

  // Return public user data (excludes sensitive wallet details)
  const publicUser = user.toPublicJSON();

  // Find primary wallet or use first wallet for public display
  const primaryWallet =
    publicUser.wallets.find((w: any) => w.isPrimary) || publicUser.wallets[0];

  const userResponse: PublicUserResponse = {
    ...publicUser,
    wallets: primaryWallet
      ? [
          {
            address: primaryWallet.address,
            chainType: primaryWallet.chainType,
          },
        ]
      : [],
  };

  return ApiResponseBuilder.success(
    userResponse,
    "User retrieved successfully"
  );
}

export const GET = withErrorHandling(getUserByUsernameHandler);
