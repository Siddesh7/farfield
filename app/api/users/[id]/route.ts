import { User } from "@/models/user";
import connectDB from "@/lib/db/connect";
import {
  ApiResponseBuilder,
  withErrorHandling,
  RequestValidator,
  API_MESSAGES,
} from "@/lib";
import { PublicUserResponse } from "@/lib/types/user";
import mongoose from "mongoose";

// GET /api/users/[id] - Get user by database ID
async function getUserByIdHandler(
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
    return ApiResponseBuilder.error(API_MESSAGES.INVALID_USER_ID, 400);
  }

  const user = await User.findById(id);

  if (!user) {
    return ApiResponseBuilder.notFound(API_MESSAGES.USER_NOT_FOUND);
  }

  // Return public user data (excludes sensitive wallet details)
  const publicUser = (user as any).toPublicJSON();

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

export const GET = withErrorHandling(getUserByIdHandler);
