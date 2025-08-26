import { NextRequest } from "next/server";
import {
  ApiResponseBuilder,
  withErrorHandling,
} from "@/lib/utils/api-response";
import { RequestValidator } from "@/lib/utils/validation";

interface ProductCardParams {
  name: string;
  creator: string;
  image: string;
  price: string;
}

async function generateImageHandler(request: Request) {
  const { searchParams } = new URL(request.url);

  // Parse and validate parameters
  const params: ProductCardParams = {
    name: searchParams.get("name") || "Product Name",
    creator: searchParams.get("creator") || "Creator",
    image: searchParams.get("image") || "",
    price: searchParams.get("price") || "$0.00",
  };

  // Validate parameters
  const validator = new RequestValidator();
  validator
    .required(params.name, "name")
    .required(params.creator, "creator")
    .required(params.image, "image")
    .required(params.price, "price");

  if (!validator.isValid()) {
    return validator.getErrorResponse()!;
  }

  try {
    const imageBuffer = await generateProductCardImage(params);

    const headers = new Headers();
    headers.set("Content-Type", "image/png");
    headers.set("Cache-Control", "public, max-age=3600");
    headers.set("Content-Disposition", `inline; filename="product-card.png"`);

    return new Response(imageBuffer, {
      headers,
      status: 200,
    });
  } catch (error) {
    console.error("Image generation error:", error);
    return ApiResponseBuilder.error("Failed to generate image", 500);
  }
}

async function generateProductCardImage(
  params: ProductCardParams
): Promise<Buffer> {
  const { Canvas, createCanvas, loadImage } = await import("canvas");

  // Create canvas with maximum dimensions for product card
  const width = 3000;
  const height = 2000;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Keep background transparent/simple - no background fill
  // ctx.fillStyle = "#ffffff";
  // ctx.fillRect(0, 0, width, height);

  // Draw border (optional - keeping minimal)
  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 4;
  ctx.strokeRect(0, 0, width, height);

  // Draw product name (largest text)
  ctx.fillStyle = "#1f2937";
  ctx.font = "bold 120px Arial";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(params.name, 100, 100);

  // Draw creator
  ctx.fillStyle = "#6b7280";
  ctx.font = "80px Arial";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(`by ${params.creator}`, 100, 250);

  // Handle image - try to load it or create a placeholder
  const imageArea = {
    x: 100,
    y: 400,
    width: 800,
    height: 600,
  };

  try {
    // Try to load the image from the URL
    if (params.image && params.image.startsWith("http")) {
      const img = await loadImage(params.image);
      ctx.drawImage(
        img,
        imageArea.x,
        imageArea.y,
        imageArea.width,
        imageArea.height
      );
    } else {
      // Create a placeholder image area
      ctx.fillStyle = "#f3f4f6";
      ctx.fillRect(imageArea.x, imageArea.y, imageArea.width, imageArea.height);
      ctx.strokeStyle = "#d1d5db";
      ctx.lineWidth = 4;
      ctx.strokeRect(
        imageArea.x,
        imageArea.y,
        imageArea.width,
        imageArea.height
      );

      // Add placeholder text
      ctx.fillStyle = "#9ca3af";
      ctx.font = "60px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        "Image",
        imageArea.x + imageArea.width / 2,
        imageArea.y + imageArea.height / 2
      );
    }
  } catch (error) {
    // If image loading fails, create a placeholder
    ctx.fillStyle = "#f3f4f6";
    ctx.fillRect(imageArea.x, imageArea.y, imageArea.width, imageArea.height);
    ctx.strokeStyle = "#d1d5db";
    ctx.lineWidth = 4;
    ctx.strokeRect(imageArea.x, imageArea.y, imageArea.width, imageArea.height);

    // Add error placeholder text
    ctx.fillStyle = "#9ca3af";
    ctx.font = "60px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      "Image",
      imageArea.x + imageArea.width / 2,
      imageArea.y + imageArea.height / 2
    );
  }

  // Draw price (bottom right)
  ctx.fillStyle = "#059669";
  ctx.font = "bold 140px Arial";
  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";
  ctx.fillText(params.price, width - 100, height - 100);

  // Remove decorative elements to keep it simple
  // ctx.fillStyle = "#f3f4f6";
  // ctx.fillRect(0, height - 60, width, 60);

  // Convert to PNG buffer with transparency
  return canvas.toBuffer("image/png");
}

export const GET = withErrorHandling(generateImageHandler);
