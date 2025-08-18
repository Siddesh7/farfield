import { storeFile } from "@/lib/r2";
import {
  ApiResponseBuilder,
  withErrorHandling,
} from "@/lib/utils/api-response";
import { RequestValidator } from "@/lib/utils/validation";
import { FileUploadResponse } from "@/lib/types/api";

async function uploadHandler(request: Request) {
  // Parse form data
  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  // Validate file
  const validator = new RequestValidator();
  validator.required(file, "file");

  if (!validator.isValid()) {
    return validator.getErrorResponse()!;
  }

  // Additional file validation
  if (file) {
    if (file.size === 0) {
      return ApiResponseBuilder.error("File cannot be empty", 400);
    }

    // Optional: Add file size limit (e.g., 10MB)


    // Dynamic file size limit based on file type
    const isAudioVideo = file.type.startsWith('audio/') || file.type.startsWith('video/');
    const maxSize = isAudioVideo ? 100 * 1024 * 1024 : 10 * 1024 * 1024; // 100MB for audio/video, 10MB for others

    if (file.size > maxSize) {
      const limitText = isAudioVideo ? "100MB" : "10MB";
      return ApiResponseBuilder.error(`File size exceeds ${limitText} limit`, 400);
    }

    // Optional: Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "text/plain",
      "application/json",
      // Audio formats
      "audio/mpeg",      // .mp3
      "audio/wav",       // .wav
      "audio/mp4",       // .m4a
      "audio/aac",       // .aac
      "audio/ogg",       // .ogg
      "audio/webm",      // .webm audio
      // Video formats
      "video/mp4",       // .mp4
      "video/webm",      // .webm
      "video/quicktime", // .mov
      "video/x-msvideo", // .avi
      // Archive formats
      "application/zip", // .zip files
    ];

    if (!allowedTypes.includes(file.type)) {
      return ApiResponseBuilder.error(
        `File type ${file.type
        } is not allowed. Allowed types: ${allowedTypes.join(", ")}`,
        400
      );
    }
  }

  // Process file upload
  const arrayBuffer = await file!.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const fileKey = await storeFile({
    buffer,
    originalname: file!.name,
    mimetype: file!.type,
  });

  const fileUrl = `${process.env.R2_ENDPOINT}/${fileKey}`;

  // Create standardized response
  const responseData: FileUploadResponse = {
    fileKey,
    fileUrl,
    originalName: file!.name,
    size: file!.size,
    mimeType: file!.type,
  };

  return ApiResponseBuilder.success(
    responseData,
    "File uploaded successfully",
    201
  );
}

export const POST = withErrorHandling(uploadHandler);
