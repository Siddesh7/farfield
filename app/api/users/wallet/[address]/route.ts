import { User } from "@/models/user";
import connectDB from "@/lib/db/connect";
import {
  ApiResponseBuilder,
  withErrorHandling,
  RequestValidator,
  API_MESSAGES,
} from "@/lib";
import { PublicUserResponse } from "@/lib/types/user";
import { isAddress } from "viem";

// GET /api/users/wallet/[address] - Get user by wallet address
async function getUserByWalletHandler(
  request: Request,
  { params }: { params: Promise<{ address: string }> }
) {
  await connectDB();

  const { address } = await params;

  const validator = new RequestValidator();
  validator.required(address, "address").string(address, "address", 1, 100);

  if (!validator.isValid()) {
    return validator.getErrorResponse()!;
  }

  // Validate wallet address using viem
  if (!isAddress(address)) {
    return ApiResponseBuilder.error(API_MESSAGES.INVALID_WALLET_ADDRESS, 400);
  }

  const user = await (User as any).findByWalletAddress(address);

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

export const GET = withErrorHandling(getUserByWalletHandler);
