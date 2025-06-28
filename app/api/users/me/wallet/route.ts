import { User } from "@/models/user";
import connectDB from "@/lib/db/connect";
import {
  ApiResponseBuilder,
  withErrorHandling,
  RequestValidator,
  API_MESSAGES,
} from "@/lib";
import {
  UserResponse,
  WalletAddRequest,
  WalletRemoveRequest,
} from "@/lib/types/user";
import { isAddress } from "viem";
import { withAuth, AuthenticatedUser } from "@/lib/auth/privy-auth";

// POST /api/users/me/wallet - Add a new wallet
async function addWalletHandler(
  request: Request,
  authenticatedUser: AuthenticatedUser
) {
  await connectDB();

  const privyId = authenticatedUser.privyId;

  const validator = await RequestValidator.fromRequest(request);
  if (!validator.isValid()) {
    return validator.getErrorResponse()!;
  }

  const body: WalletAddRequest = validator.body;

  // Validate required wallet fields (only address is required)
  validator
    .required(body.address, "address")
    .string(body.address, "address", 1, 100);

  // Optional field validation
  if (body.chainType) {
    validator.string(body.chainType, "chainType", 1, 50);
  }
  if (body.walletClientType) {
    validator.string(body.walletClientType, "walletClientType", 1, 50);
  }
  if (body.connectorType) {
    validator.string(body.connectorType, "connectorType", 1, 50);
  }

  if (!validator.isValid()) {
    return validator.getErrorResponse()!;
  }

  // Validate wallet address using viem
  if (!isAddress(body.address)) {
    return ApiResponseBuilder.error(API_MESSAGES.INVALID_WALLET_ADDRESS, 400);
  }

  const user = await (User as any).findByPrivyId(privyId);

  if (!user) {
    return ApiResponseBuilder.notFound(API_MESSAGES.USER_NOT_FOUND);
  }

  // Check if user already has this wallet address
  const existingWallet = user.wallets.find(
    (w: any) => w.address === body.address
  );
  if (existingWallet) {
    return ApiResponseBuilder.conflict(
      "Wallet address already exists for this user"
    );
  }

  // Check if another user is already using this wallet address
  const existingUserWithWallet = await (User as any).findByWalletAddress(
    body.address
  );
  if (existingUserWithWallet) {
    return ApiResponseBuilder.conflict(API_MESSAGES.WALLET_ADDRESS_EXISTS);
  }

  // If this is the first wallet or isPrimary is true, make it primary
  const shouldBePrimary = user.wallets.length === 0 || body.isPrimary === true;

  // If making this wallet primary, remove primary status from other wallets
  if (shouldBePrimary) {
    user.wallets.forEach((wallet: any) => {
      wallet.isPrimary = false;
    });
  }

  // Add new wallet
  const newWallet = {
    address: body.address,
    chainType: body.chainType,
    walletClientType: body.walletClientType,
    connectorType: body.connectorType,
    isPrimary: shouldBePrimary,
  };

  user.wallets.push(newWallet);
  await user.save();

  const userResponse: UserResponse = user.toPublicJSON();

  return ApiResponseBuilder.success(userResponse, "Wallet added successfully");
}

// DELETE /api/users/me/wallet - Remove a wallet
async function removeWalletHandler(
  request: Request,
  authenticatedUser: AuthenticatedUser
) {
  await connectDB();

  const privyId = authenticatedUser.privyId;

  const validator = await RequestValidator.fromRequest(request);
  if (!validator.isValid()) {
    return validator.getErrorResponse()!;
  }

  const body: WalletRemoveRequest = validator.body;

  // Validate required fields
  validator
    .required(body.address, "address")
    .string(body.address, "address", 1, 100);

  if (!validator.isValid()) {
    return validator.getErrorResponse()!;
  }

  // Validate wallet address using viem
  if (!isAddress(body.address)) {
    return ApiResponseBuilder.error(API_MESSAGES.INVALID_WALLET_ADDRESS, 400);
  }

  const user = await (User as any).findByPrivyId(privyId);

  if (!user) {
    return ApiResponseBuilder.notFound(API_MESSAGES.USER_NOT_FOUND);
  }

  // Find the wallet to remove
  const walletIndex = user.wallets.findIndex(
    (w: any) => w.address === body.address
  );
  if (walletIndex === -1) {
    return ApiResponseBuilder.notFound("Wallet not found");
  }

  // Don't allow removing the last wallet
  if (user.wallets.length === 1) {
    return ApiResponseBuilder.error("Cannot remove the last wallet", 400);
  }

  const removedWallet = user.wallets[walletIndex];

  // Remove the wallet
  user.wallets.splice(walletIndex, 1);

  // If we removed the primary wallet, make the first remaining wallet primary
  if (removedWallet.isPrimary && user.wallets.length > 0) {
    user.wallets[0].isPrimary = true;
  }

  await user.save();

  const userResponse: UserResponse = user.toPublicJSON();

  return ApiResponseBuilder.success(
    userResponse,
    "Wallet removed successfully"
  );
}

// Export routes with authentication and error handling
export const POST = withErrorHandling(withAuth(addWalletHandler));
export const DELETE = withErrorHandling(withAuth(removeWalletHandler));
