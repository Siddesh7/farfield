import { ApiResponseBuilder, RequestValidator, createRoute } from "@/lib";
import { SellerAccess } from "@/models/seller-access";
import { SELLER_INVITE_CODE } from "@/constants";
import { API_MESSAGES } from "@/lib";

// Use this ONCE per route file
const route = createRoute();

// GET /api/sellers/[fid] - Check if fid has seller access
async function getSellerAccessHandler(
  request: Request,
  { params }: { params: Promise<{ fid: string }> }
) {
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

  const record = await (SellerAccess as any).findByFid(farcasterFid);

  return ApiResponseBuilder.success(
    {
      fid: farcasterFid,
      hasAccess: record ? record.hasAccess : false,
      updatedAt: record?.updatedAt ?? null,
    },
    API_MESSAGES.SELLER_ACCESS_RETRIEVED_SUCCESS
  );
}

// POST /api/sellers/[fid] - Grant access with invite code (public)
async function postSellerAccessHandler(
  request: Request,
  { params }: { params: Promise<{ fid: string }> }
) {
  const { fid } = await params;

  const validator = await RequestValidator.fromRequest(request);
  if (!validator.isValid()) {
    return validator.getErrorResponse()!;
  }

  const body = validator.body as { code?: string };

  validator
    .required(fid, "fid")
    .string(fid, "fid", 1)
    .required(body.code, "code")
    .string(body.code, "code", 1, 200);

  if (!validator.isValid()) {
    return validator.getErrorResponse()!;
  }

  const farcasterFid = parseInt(fid);
  if (isNaN(farcasterFid) || farcasterFid < 1) {
    return ApiResponseBuilder.error("Invalid Farcaster FID", 400);
  }

  if (body.code !== SELLER_INVITE_CODE) {
    return ApiResponseBuilder.unauthorized(API_MESSAGES.INVALID_INVITE_CODE);
  }

  const record = await SellerAccess.findOneAndUpdate(
    { fid: farcasterFid },
    { fid: farcasterFid, hasAccess: true },
    { new: true, upsert: true }
  );

  return ApiResponseBuilder.success(
    {
      fid: record.fid,
      hasAccess: record.hasAccess,
      updatedAt: record.updatedAt,
    },
    API_MESSAGES.SELLER_ACCESS_GRANTED_SUCCESS
  );
}

// Automatic middleware wrapping - no withAPI() needed!
export const GET = route.public(getSellerAccessHandler);
export const POST = route.public(postSellerAccessHandler);
