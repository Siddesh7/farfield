import { User } from "@/models/user";
import connectDB from "@/lib/db/connect";
import {
  ApiResponseBuilder,
  withErrorHandling,
  RequestValidator,
  API_MESSAGES,
} from "@/lib";
import { UserResponse, UserRegistrationRequest } from "@/lib/types/user";

// POST /api/users/register - Register/create new user
async function registerHandler(request: Request) {
  await connectDB();

  const validator = await RequestValidator.fromRequest(request);
  if (!validator.isValid()) {
    return validator.getErrorResponse()!;
  }

  const body: UserRegistrationRequest = validator.body;

  // Validate required fields
  validator
    .required(body.privyId, "privyId")
    .string(body.privyId, "privyId", 1, 100)
    .required(body.farcasterFid, "farcasterFid")
    .number(body.farcasterFid, "farcasterFid", 1)
    .required(body.farcaster, "farcaster");

  // Validate farcaster object
  if (body.farcaster) {
    validator
      .required(body.farcaster.ownerAddress, "farcaster.ownerAddress")
      .string(body.farcaster.ownerAddress, "farcaster.ownerAddress", 1, 100)
      .required(body.farcaster.displayName, "farcaster.displayName")
      .string(body.farcaster.displayName, "farcaster.displayName", 1, 100)
      .required(body.farcaster.username, "farcaster.username")
      .string(body.farcaster.username, "farcaster.username", 1, 50);

    if (body.farcaster.bio) {
      validator.string(body.farcaster.bio, "farcaster.bio", 0, 500);
    }

    if (body.farcaster.pfp) {
      validator.string(body.farcaster.pfp, "farcaster.pfp", 1, 500);
    }
  }

  // Validate wallet object (only address is required)
  if (body.wallet) {
    validator
      .required(body.wallet.address, "wallet.address")
      .string(body.wallet.address, "wallet.address", 1, 100);

    // Optional wallet fields
    if (body.wallet.chainType) {
      validator.string(body.wallet.chainType, "wallet.chainType", 1, 50);
    }
    if (body.wallet.walletClientType) {
      validator.string(
        body.wallet.walletClientType,
        "wallet.walletClientType",
        1,
        50
      );
    }
    if (body.wallet.connectorType) {
      validator.string(
        body.wallet.connectorType,
        "wallet.connectorType",
        1,
        50
      );
    }
  }

  if (!validator.isValid()) {
    return validator.getErrorResponse()!;
  }

  // Check if user already exists with this privyId
  const existingUserByPrivy = await (User as any).findByPrivyId(body.privyId);
  if (existingUserByPrivy) {
    return ApiResponseBuilder.conflict(API_MESSAGES.USER_ALREADY_EXISTS);
  }

  // Check if user already exists with this Farcaster FID
  const existingUserByFid = await (User as any).findByFarcasterFid(
    body.farcasterFid
  );
  if (existingUserByFid) {
    return ApiResponseBuilder.conflict(API_MESSAGES.FARCASTER_USER_EXISTS);
  }

  // Check if user already exists with this username
  const existingUserByUsername = await (User as any).findByUsername(
    body.farcaster.username
  );
  if (existingUserByUsername) {
    return ApiResponseBuilder.conflict(API_MESSAGES.USERNAME_EXISTS);
  }

  // Check if user already exists with this wallet address (if wallet provided)
  if (body.wallet) {
    const existingUserByWallet = await (User as any).findByWalletAddress(
      body.wallet.address
    );
    if (existingUserByWallet) {
      return ApiResponseBuilder.conflict(API_MESSAGES.WALLET_ADDRESS_EXISTS);
    }
  }

  // Create new user data
  const userData: any = {
    privyId: body.privyId,
    farcasterFid: body.farcasterFid,
    farcaster: body.farcaster,
    wallets: [], // Initialize empty wallets array
  };

  // Add wallet to array if provided
  if (body.wallet) {
    const { address, chainType, walletClientType, connectorType } = body.wallet;
    userData.wallets.push({
      address,
      chainType,
      walletClientType,
      connectorType,
      isPrimary: true, // First wallet is always primary
    });
  }

  const newUser = new User(userData);
  await newUser.save();

  const userResponse: UserResponse = newUser.toPublicJSON();

  return ApiResponseBuilder.success(
    userResponse,
    API_MESSAGES.USER_CREATED_SUCCESS,
    201
  );
}

export const POST = withErrorHandling(registerHandler);
