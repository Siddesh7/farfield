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
  creator_image: string
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
    const htmlContent = generateProductCardImage(params);

    const headers = new Headers();
    headers.set("Content-Type", "text/html");
    headers.set("Cache-Control", "public, max-age=3600");

    return new Response(htmlContent, {
      headers,
      status: 200,
    });
  } catch (error) {
    console.error("Image generation error:", error);
    return ApiResponseBuilder.error("Failed to generate image", 500);
  }
}

function generateProductCardImage(params: ProductCardParams): string {
  return `
    <div style="
      display: flex;
      background: black;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      border: 1px solid #e5e7eb;
      width: 1200px;
      height: 675px;
      padding: 0px 13px;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    ">
      <div style="
        position: relative;
        flex: 1;
        justify-content: center;
        align-items: center;
        display: flex;
        padding: 0px 12px;
      ">
        ${
          params.product_image && params.product_image.startsWith("http")
            ? `<img 
            src="${params.product_image}" 
            alt="${params.product_name}"
            style="
              object-fit: cover;
              width: 503px;
              height: 503px;
              border-radius: 20px;
            "
          />`
            : `<div style="
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f3f4f6;
            color: #9ca3af;
          ">
            <div style="text-align: center;">
              <div style="
                width: 48px;
                height: 48px;
                background: #d1d5db;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 8px auto;
              ">
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p style="margin: 0; font-size: 14px;">No Image</p>
            </div>
          </div>`
        }
      </div>

      <div style="
        flex: 1;
        padding: 0px 12px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap:32px;
      ">
        
          <div
            style="
              display: flex;
              align-items: center;
              background: #FFFFFF12;
              border-radius: 8px;
              width: fit-content;
              padding: 8px 12px;
              gap: 8px;
              border: 1px solid #FFFFFF12;
            "
          >
            <img
              src="${params.creator_image}"
              alt="${params.creator_name}"
              style="
                width: 26px;
                height: 26px;
                object-fit: cover;
                border-radius: 2px;
              "
            />
            <p style="
              font-size: 16px;
              font-weight: 400;
              color: #FFFFFFA3;
              margin: 0;
            ">
            <span style="font-weight: 500;">${params.creator_name}</span>
            </p>
          </div>
         
          <div>
            <h1 style="
              font-size: 36px;
              font-weight: 600;
              color: #FFFFFF;
              margin: 0 0 8px 0;
              line-height: 1.3;
            ">
              ${params.product_name}
            </h1>
          </div>

        <div style="display: flex; align-items: center; gap: 8px;">
        <img
          src="/USDC.jpg"
          alt="USDC"
          style="
            width: 37px;
            height: 37px;
            object-fit: cover;
            border-radius: 8px;
          "
        />
          <p style="
            font-weight: 600;
            font-size: 32px;
            line-height: 120%;
            margin: 0;
            color: #FFFFFF;
          ">
            $ ${params.price}
          </p>
        </div>
      </div>
    </div>
  `;
}

export const GET = withErrorHandling(generateImageHandler);
