import { getFileStream } from "@/lib/r2";
import {
  ApiResponseBuilder,
  withErrorHandling,
} from "@/lib/utils/api-response";
import { RequestValidator } from "@/lib/utils/validation";
import { Product } from "@/models/product";

async function getImageHandler(
  request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;

  // Validate key parameter
  const validator = new RequestValidator();
  validator.required(key, "key").string(key, "key", 1);
  if (!validator.isValid()) {
    return validator.getErrorResponse()!;
  }

  // Check if the key is in any product's images array
  const product = await Product.findOne({ images: key }).lean();
  if (!product) {
    return ApiResponseBuilder.notFound("Image not found in any product");
  }

  try {
    const stream = await getFileStream(key);
    // Try to infer content type from file extension
    let contentType = "image/jpeg";
    if (key.match(/\.(png)$/i)) contentType = "image/png";
    else if (key.match(/\.(gif)$/i)) contentType = "image/gif";
    else if (key.match(/\.(webp)$/i)) contentType = "image/webp";
    else if (key.match(/\.(svg)$/i)) contentType = "image/svg+xml";
    else if (key.match(/\.(bmp)$/i)) contentType = "image/bmp";
    else if (key.match(/\.(avif)$/i)) contentType = "image/avif";

    const headers = new Headers();
    headers.set("Content-Type", contentType);
    headers.set(
      "Content-Disposition",
      `inline; filename=\"${key.split("_").pop()}\"`
    );
    return new Response(stream as any, { headers, status: 200 });
  } catch (error) {
    console.error("Image fetch error:", error);
    if (error instanceof Error && error.message.includes("not found")) {
      return ApiResponseBuilder.notFound("Image not found");
    }
    throw error;
  }
}

export const GET = withErrorHandling(getImageHandler);
