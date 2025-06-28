import { getFileStream } from "@/lib/r2";
import {
  ApiResponseBuilder,
  withErrorHandling,
} from "@/lib/utils/api-response";
import { RequestValidator } from "@/lib/utils/validation";

async function getFileHandler(
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

  console.log(`Fetching file with key: ${key}`);

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

export const GET = withErrorHandling(getFileHandler);
