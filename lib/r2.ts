import { S3Client } from "@aws-sdk/client-s3";
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Readable } from "stream";

const r2Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY!,
    secretAccessKey: process.env.R2_SECRET_KEY!,
  },
});

export async function storeFile(file: {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
}) {
  const key = `${Date.now()}_${file.originalname}`;
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  });
  await r2Client.send(command);
  return key;
}

export async function getFileStream(key: string) {
  const command = new GetObjectCommand({
    Bucket: process.env.R2_BUCKET,
    Key: key,
  });
  const response = await r2Client.send(command);
  return response.Body as Readable;
}

// Enhanced presigned URL options
export interface PresignedUrlOptions {
  expiresIn?: number;
  responseContentType?: string;
  responseContentDisposition?: string;
  responseCacheControl?: string;
  responseContentLanguage?: string;
  responseExpires?: string;
  responseContentEncoding?: string;
}

// ENHANCED: Original function with backward compatibility
export async function getPresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
  return getPresignedUrlWithOptions(key, { expiresIn });
}

// NEW: Enhanced presigned URL with full header control
export async function getPresignedUrlWithOptions(
  key: string, 
  options: PresignedUrlOptions = {}
): Promise<string> {
  const {
    expiresIn = 3600,
    responseContentType,
    responseContentDisposition,
    responseCacheControl,
    responseContentLanguage,
    responseExpires,
    responseContentEncoding,
  } = options;

  const command = new GetObjectCommand({
    Bucket: process.env.R2_BUCKET,
    Key: key,
    // These parameters will be included in the presigned URL as query parameters
    ResponseContentType: responseContentType,
    ResponseContentDisposition: responseContentDisposition,
    ResponseCacheControl: responseCacheControl,
    ResponseContentLanguage: responseContentLanguage,
    ResponseContentEncoding: responseContentEncoding,
  });
  
  return await getSignedUrl(r2Client, command, { expiresIn });
}

// NEW: Specific functions for different use cases
export async function getImagePresignedUrl(
  key: string, 
  options: { 
    expiresIn?: number;
    forceDownload?: boolean;
    filename?: string;
    cacheControl?: string;
  } = {}
): Promise<string> {
  const { 
    expiresIn = 3600, 
    forceDownload = false, 
    filename,
    cacheControl = "public, max-age=3600"
  } = options;

  // Extract original filename from key if not provided
  const originalFilename = filename || key.split('_').pop() || 'image';
  
  const disposition = forceDownload 
    ? `attachment; filename="${originalFilename}"`
    : `inline; filename="${originalFilename}"`;

  return getPresignedUrlWithOptions(key, {
    expiresIn,
    responseContentDisposition: disposition,
    responseCacheControl: cacheControl,
    responseContentType: getContentTypeFromKey(key),
  });
}

export async function getDownloadPresignedUrl(
  key: string,
  options: {
    expiresIn?: number;
    filename?: string;
  } = {}
): Promise<string> {
  const { expiresIn = 3600, filename } = options;
  
  // Extract original filename from key if not provided
  const originalFilename = filename || key.split('_').pop() || 'download';
  
  return getPresignedUrlWithOptions(key, {
    expiresIn,
    responseContentDisposition: `attachment; filename="${originalFilename}"`,
    responseContentType: getContentTypeFromKey(key),
  });
}

// Helper function to determine content type from file key
function getContentTypeFromKey(key: string): string {
  const extension = key.split('.').pop()?.toLowerCase();
  
  const mimeTypes: Record<string, string> = {
    // Images
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    'bmp': 'image/bmp',
    'avif': 'image/avif',
    
    // Documents
    'pdf': 'application/pdf',
    'txt': 'text/plain',
    'json': 'application/json',
    
    // Audio
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'm4a': 'audio/mp4',
    'aac': 'audio/aac',
    'ogg': 'audio/ogg',
    
    // Video
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'mov': 'video/quicktime',
    'avi': 'video/x-msvideo',
  };
  
  return mimeTypes[extension || ''] || 'application/octet-stream';
}

// NEW: Batch generate presigned URLs with options
export async function getBatchPresignedUrlsWithOptions(
  keys: string[], 
  options: PresignedUrlOptions = {}
): Promise<Record<string, string>> {
  const urlPromises = keys.map(async (key) => {
    const url = await getPresignedUrlWithOptions(key, options);
    return [key, url] as const;
  });
  
  const urlPairs = await Promise.all(urlPromises);
  return Object.fromEntries(urlPairs);
}

// NEW: Transform products with enhanced presigned URLs
export async function transformProductsWithPresignedUrls(
  products: any[], 
  options: {
    expiresIn?: number;
    forceDownload?: boolean;
    imageOptions?: {
      cacheControl?: string;
      forceDownload?: boolean;
    };
  } = {}
): Promise<any[]> {
  const { expiresIn = 3600, imageOptions = {} } = options;
  
  // Collect all unique image keys from all products
  const allImageKeys = new Set<string>();
  products.forEach(product => {
    if (product.images && Array.isArray(product.images)) {
      product.images.forEach((key: string) => allImageKeys.add(key));
    }
  });

  // Batch generate presigned URLs for all image keys with image-specific options
  const presignedUrls = await getBatchPresignedUrlsWithOptions(
    Array.from(allImageKeys),
    {
      expiresIn,
      responseContentDisposition: imageOptions.forceDownload 
        ? 'attachment' 
        : 'inline',
      responseCacheControl: imageOptions.cacheControl || 'public, max-age=3600',
    }
  );

  // Transform products to use presigned URLs
  return products.map(product => ({
    ...product,
    images: product.images?.map((key: string) => presignedUrls[key] || key) || [],
    imageKeys: product.images, // Keep original keys for reference
  }));
}