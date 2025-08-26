import { User } from "@/models/user";
import { createRoute } from "@/lib";
import { ApiResponseBuilder, RequestValidator, API_MESSAGES } from "@/lib";

// Use this ONCE per route file
const route = createRoute();

// POST /api/users/register - Register/Create new user
async function registerHandler(request: Request) {
  const validator = await RequestValidator.fromRequest(request);
  if (!validator.isValid()) {
    return validator.getErrorResponse()!;
  }

  const body = validator.body;

  // Validate required fields
  validator
    .required(body.privyId, "privyId")
    .string(body.privyId, "privyId", 1, 100)
    .required(body.farcasterFid, "farcasterFid")
    .number(body.farcasterFid, "farcasterFid", 1)
    .required(body.farcaster, "farcaster")
    .required(body.wallet, "wallet");

  if (!validator.isValid()) {
    return validator.getErrorResponse()!;
  }

  // Validate farcaster data
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

  // Validate wallet data
  if (body.wallet) {
    validator
      .required(body.wallet.address, "wallet.address")
      .string(body.wallet.address, "wallet.address", 1, 100);

    if (body.wallet.chainType) {
      validator.string(body.wallet.chainType, "wallet.chainType", 1, 50);
    }
  }

  if (!validator.isValid()) {
    return validator.getErrorResponse()!;
  }

  // Check if user already exists
  const existingUser = await (User as any).findByPrivyId(body.privyId);
  if (existingUser) {
    return ApiResponseBuilder.conflict(API_MESSAGES.USER_ALREADY_EXISTS);
  }

  // Check if Farcaster FID already exists
  const existingFarcasterUser = await (User as any).findByFarcasterFid(
    body.farcasterFid
  );
  if (existingFarcasterUser) {
    return ApiResponseBuilder.conflict(API_MESSAGES.FARCASTER_USER_EXISTS);
  }

  // Check if username already exists
  const existingUsernameUser = await (User as any).findByUsername(
    body.farcaster.username
  );
  if (existingUsernameUser) {
    return ApiResponseBuilder.conflict(API_MESSAGES.USERNAME_EXISTS);
  }

  // Check if wallet address already exists
  const existingWalletUser = await (User as any).findByWalletAddress(
    body.wallet.address
  );
  if (existingWalletUser) {
    return ApiResponseBuilder.conflict(API_MESSAGES.WALLET_ADDRESS_EXISTS);
  }

  // Create new user
  const newUser = new User({
    privyId: body.privyId,
    farcasterFid: body.farcasterFid,
    farcaster: {
      ownerAddress: body.farcaster.ownerAddress,
      displayName: body.farcaster.displayName,
      username: body.farcaster.username,
      bio: body.farcaster.bio || "",
      pfp: body.farcaster.pfp || "",
    },
    wallets: [
      {
        address: body.wallet.address,
        chainType: body.wallet.chainType || "ethereum",
        isPrimary: true,
      },
    ],
    isVerified: false,
  });

  await newUser.save();

  const userResponse = newUser.toPublicJSON();

  return ApiResponseBuilder.success(
    userResponse,
    API_MESSAGES.USER_CREATED_SUCCESS,
    201
  );
}

// Automatic middleware wrapping - no withAPI() needed!
export const POST = route.public(registerHandler);
