import { User } from "@/models/user";
import connectDB from "@/lib/db/connect";
import {
  ApiResponseBuilder,
  withErrorHandling,
  RequestValidator,
  API_MESSAGES,
} from "@/lib";
import { PublicUserResponse } from "@/lib/types/user";

// GET /api/users/privy/[privyId] - Get user by Privy ID
async function getUserByPrivyIdHandler(
  request: Request,
  { params }: { params: Promise<{ privyId: string }> }
) {
  await connectDB();

  const { privyId } = await params;

  const validator = new RequestValidator();
  validator.required(privyId, "privyId").string(privyId, "privyId", 1, 100);

  if (!validator.isValid()) {
    return validator.getErrorResponse()!;
  }

  const user = await (User as any).findByPrivyId(privyId);

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

export const GET = withErrorHandling(getUserByPrivyIdHandler);
