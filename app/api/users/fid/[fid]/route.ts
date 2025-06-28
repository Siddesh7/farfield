import { User } from "@/models/user";
import connectDB from "@/lib/db/connect";
import {
  ApiResponseBuilder,
  withErrorHandling,
  RequestValidator,
  API_MESSAGES,
} from "@/lib";
import { PublicUserResponse } from "@/lib/types/user";

// GET /api/users/fid/[fid] - Get user by Farcaster FID
async function getUserByFidHandler(
  request: Request,
  { params }: { params: Promise<{ fid: string }> }
) {
  await connectDB();

  const { fid } = await params;

  const validator = new RequestValidator();
  validator.required(fid, "fid").string(fid, "fid", 1);

  if (!validator.isValid()) {
    return validator.getErrorResponse()!;
  }

  const farcasterFid = parseInt(fid);
  if (isNaN(farcasterFid) || farcasterFid < 1) {
    return ApiResponseBuilder.error("Invalid Farcaster FID", 400);
  }

  const user = await (User as any).findByFarcasterFid(farcasterFid);

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

export const GET = withErrorHandling(getUserByFidHandler);
