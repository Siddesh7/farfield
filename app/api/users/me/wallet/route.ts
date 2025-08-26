import { User } from "@/models/user";
import { createRoute } from "@/lib";
import { ApiResponseBuilder, RequestValidator, API_MESSAGES } from "@/lib";
import { AuthenticatedUser } from "@/lib/auth/privy-auth";

// Use this ONCE per route file
const route = createRoute();

// POST /api/users/me/wallet - Add new wallet
async function addWalletHandler(
  request: Request,
  authenticatedUser: AuthenticatedUser
) {
  const privyId = authenticatedUser.privyId;

  const validator = await RequestValidator.fromRequest(request);
  if (!validator.isValid()) {
    return validator.getErrorResponse()!;
  }

  const body = validator.body;

  // Validate wallet data
  validator
    .required(body.address, "address")
    .string(body.address, "address", 1, 100);

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

  const user = await (User as any).findByPrivyId(privyId);

  if (!user) {
    return ApiResponseBuilder.notFound(API_MESSAGES.USER_NOT_FOUND);
  }

  // Check if wallet already exists
  const existingWallet = user.wallets.find(
    (w: any) => w.address === body.address
  );

  if (existingWallet) {
    return ApiResponseBuilder.conflict(API_MESSAGES.WALLET_ADDRESS_EXISTS);
  }

  // Add new wallet
  const newWallet = {
    address: body.address,
    chainType: body.chainType,
    walletClientType: body.walletClientType,
    connectorType: body.connectorType,
    isPrimary: body.isPrimary || false,
  };

  user.wallets.push(newWallet);

  // If this is the first wallet or marked as primary, make it primary
  if (user.wallets.length === 1 || body.isPrimary) {
    user.wallets.forEach((w: any) => (w.isPrimary = false));
    newWallet.isPrimary = true;
  }

  await user.save();

  return ApiResponseBuilder.success(
    { wallets: user.wallets },
    API_MESSAGES.WALLET_UPDATED_SUCCESS
  );
}

// DELETE /api/users/me/wallet - Remove wallet
async function removeWalletHandler(
  request: Request,
  authenticatedUser: AuthenticatedUser
) {
  const privyId = authenticatedUser.privyId;

  const validator = await RequestValidator.fromRequest(request);
  if (!validator.isValid()) {
    return validator.getErrorResponse()!;
  }

  const body = validator.body;

  validator.required(body.address, "address");

  if (!validator.isValid()) {
    return validator.getErrorResponse()!;
  }

  const user = await (User as any).findByPrivyId(privyId);

  if (!user) {
    return ApiResponseBuilder.notFound(API_MESSAGES.USER_NOT_FOUND);
  }

  // Find and remove wallet
  const walletIndex = user.wallets.findIndex(
    (w: any) => w.address === body.address
  );

  if (walletIndex === -1) {
    return ApiResponseBuilder.notFound("Wallet not found");
  }

  const removedWallet = user.wallets[walletIndex];
  user.wallets.splice(walletIndex, 1);

  // If we removed the primary wallet and have other wallets, make the first one primary
  if (removedWallet.isPrimary && user.wallets.length > 0) {
    user.wallets[0].isPrimary = true;
  }

  await user.save();

  return ApiResponseBuilder.success(
    { wallets: user.wallets },
    API_MESSAGES.WALLET_UPDATED_SUCCESS
  );
}

// Automatic middleware wrapping - no withAPI() needed!
export const POST = route.protected(addWalletHandler);
export const DELETE = route.protected(removeWalletHandler);
