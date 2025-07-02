import { getFileStream } from "@/lib/r2";
import {
  ApiResponseBuilder,
  withErrorHandling,
} from "@/lib/utils/api-response";
import { RequestValidator } from "@/lib/utils/validation";
import { withAuth, AuthenticatedUser } from "@/lib/auth/privy-auth";
import { Product } from "@/models/product";
import { Purchase } from "@/models/purchase";
import { User } from "@/models/user";

async function getFileHandler(
  request: Request,
  authenticatedUser: AuthenticatedUser,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;
  console.log("key >>>", key);

  // Validate key parameter
  const validator = new RequestValidator();
  validator.required(key, "key").string(key, "key", 1);

  if (!validator.isValid()) {
    return validator.getErrorResponse()!;
  }

  // Find the product that references this file key (digital, preview, or image)
  const product = (await Product.findOne({
    $or: [
      { "digitalFiles.fileUrl": key },
      { "previewFiles.fileUrl": key },
      { images: key },
    ],
  }).lean()) as any;
  if (!product) {
    return ApiResponseBuilder.notFound("File not found in any product");
  }

  // Check if this is a preview file or image
  const isPreview =
    product.previewFiles &&
    product.previewFiles.some((f: any) => f.fileUrl === key);
  const isImage = product.images && product.images.includes(key);

  if (!isPreview && !isImage) {
    // Get user
    const user = await (User as any).findByPrivyId(authenticatedUser.privyId);
    if (!user) {
      return ApiResponseBuilder.unauthorized("User not found");
    }

    // Check access: creator or purchased
    const isCreator = product.creatorFid === user.farcasterFid;
    let hasPurchased = false;
    if (!isCreator) {
      const purchase = await Purchase.findOne({
        buyerFid: user.farcasterFid,
        status: "completed",
        "items.productId": product._id.toString(),
      });
      hasPurchased = !!purchase;
    }
    if (!isCreator && !hasPurchased) {
      return ApiResponseBuilder.error(
        "You do not have access to this file",
        403
      );
    }
  }

  try {
    const stream = await getFileStream(key);

    const headers = new Headers();
    headers.set("Content-Type", "application/octet-stream");
    headers.set(
      "Content-Disposition",
      `inline; filename="${key.split("_").pop()}"`
    );

    // For file downloads, we return the stream directly rather than using ApiResponseBuilder
    // since this is a binary response, not a JSON API response
    return new Response(stream as any, { headers, status: 200 });
  } catch (error) {
    console.error("File fetch error:", error);

    // Check if it's a "not found" error (this depends on your R2 implementation)
    if (error instanceof Error && error.message.includes("not found")) {
      return ApiResponseBuilder.notFound("File not found");
    }

    throw error; // Let withErrorHandling catch other errors
  }
}

export const GET = withErrorHandling(withAuth(getFileHandler));
