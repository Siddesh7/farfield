import { NextRequest } from "next/server";
import React from "react";
import {
  ApiResponseBuilder,
  withErrorHandling,
} from "@/lib/utils/api-response";
import { RequestValidator } from "@/lib/utils/validation";

interface ProductCardParams {
  product_name: string;
  product_image: string;
  creator_name: string;
  creator_image: string;
  price: string;
}

async function generateImageHandler(request: Request) {
  const { searchParams } = new URL(request.url);

  // Parse and validate parameters
  const params: ProductCardParams = {
    product_name: searchParams.get("pn") || "Product Name",
    product_image: searchParams.get("pi") || "",
    creator_name: searchParams.get("cn") || "Creator",
    creator_image: searchParams.get("ci") || "",
    price: searchParams.get("p") || "$0.00",
  };

  // Validate parameters
  const validator = new RequestValidator();
  validator
    .required(params.product_name, "product_name")
    .required(params.product_image, "product_image")
    .required(params.creator_name, "creator_name")
    .required(params.creator_image, "creator_image")
    .required(params.price, "price");

  if (!validator.isValid()) {
    return validator.getErrorResponse()!;
  }

  try {
    // Resolve and inline images as data URLs to avoid cross-origin issues in SVG images
    const origin = new URL(request.url).origin;
    const resolveUrl = (u: string) =>
      u.startsWith("http") ? u : `${origin}${u}`;

    async function toDataUrl(url: string): Promise<string | null> {
      try {
        const res = await fetch(resolveUrl(url), { cache: "no-store" });
        if (!res.ok) return null;
        const contentType = res.headers.get("content-type") || "image/png";
        const arrayBuffer = await res.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString("base64");
        return `data:${contentType};base64,${base64}`;
      } catch {
        return null;
      }
    }

    const [productDataUrl, creatorDataUrl, usdcDataUrl] = await Promise.all([
      toDataUrl(params.product_image),
      toDataUrl(params.creator_image),
      toDataUrl("/USDC.jpg"),
    ]);

    const svgContent = generateProductCardSvg(
      {
        ...params,
        product_image: productDataUrl || resolveUrl(params.product_image),
        creator_image: creatorDataUrl || resolveUrl(params.creator_image),
        // price unchanged
      },
      usdcDataUrl || resolveUrl("/USDC.jpg")
    );

    const headers = new Headers();
    headers.set("Content-Type", "image/svg+xml; charset=utf-8");
    headers.set("Cache-Control", "public, max-age=3600");

    return new Response(svgContent, {
      headers,
      status: 200,
    });
  } catch (error) {
    console.error("Image generation error:", error);
    return ApiResponseBuilder.error("Failed to generate image", 500);
  }
}

function generateProductCardSvg(
  params: ProductCardParams,
  usdcHref?: string
): string {
  const width = 1200;
  const height = 675;
  const productImage = params.product_image;
  const creatorImage = params.creator_image;
  const creatorName = params.creator_name || "Creator";
  const truncatedCreator =
    creatorName.length > 28 ? creatorName.slice(0, 28) + "…" : creatorName;
  const safeText = (t: string) =>
    t
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <style>
      .title { font: 600 36px 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; fill: #ffffff; }
      .label { font: 400 16px 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; fill: #ffffffa3; }
      .price { font: 600 32px 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; fill: #ffffff; }
    </style>
    ${
      creatorImage
        ? `<clipPath id="clip-creator"><rect x="648" y="224" width="26" height="26" rx="4" ry="4"/></clipPath>`
        : ""
    }
    ${
      productImage
        ? `<clipPath id="clip-product"><rect x="80" y="86" width="503" height="503" rx="20" ry="20"/></clipPath>`
        : ""
    }
    <clipPath id="clip-usdc"><rect x="640" y="342" width="37" height="37" rx="8" ry="8"/></clipPath>
  </defs>
  <rect x="0" y="0" width="${width}" height="${height}" fill="#000000" />

  ${
    productImage
      ? `
    <g clip-path="url(#clip-product)">
      <image href="${safeText(
        productImage
      )}" x="80" y="86" width="503" height="503" preserveAspectRatio="xMidYMid slice"/>
    </g>
  `
      : `
    <rect x="80" y="86" width="503" height="503" rx="20" ry="20" fill="#111827" stroke="#374151" />
    <text x="331" y="350" text-anchor="middle" class="label">No Image</text>
  `
  }

  <!-- Creator pill -->
  <g>
    <rect x="640" y="216" width="300" height="42" rx="8" ry="8" fill="#FFFFFF12" stroke="#FFFFFF12" />
    ${
      creatorImage
        ? `
      <g clip-path="url(#clip-creator)">
        <image href="${safeText(
          creatorImage
        )}" x="648" y="224" width="26" height="26" preserveAspectRatio="xMidYMid slice"/>
      </g>
    `
        : `
      <rect x="648" y="224" width="26" height="26" rx="4" ry="4" fill="#374151" />
    `
    }
    <text x="684" y="237" dominant-baseline="middle" class="label">${safeText(
      truncatedCreator
    )}</text>
  </g>

  <!-- Title -->
  <text x="640" y="300" class="title">${safeText(params.product_name)}</text>

  <!-- Price with USDC image -->
  <g clip-path="url(#clip-usdc)">
    <image href="${
      usdcHref || "/USDC.jpg"
    }" x="640" y="342" width="37" height="37" preserveAspectRatio="xMidYMid slice"/>
  </g>
  <text x="690" y="370" class="price">$ ${safeText(params.price)}</text>
</svg>`;
}

export const GET = withErrorHandling(generateImageHandler);
