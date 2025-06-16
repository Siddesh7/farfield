import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import { ProductService } from "@/lib/services/product-service";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");

    if (limit < 1 || limit > 50) {
      return NextResponse.json(
        { error: "Limit must be between 1 and 50" },
        { status: 400 }
      );
    }

    const products = await ProductService.getTrendingProducts(limit);

    return NextResponse.json({
      products,
      count: products.length,
    });
  } catch (error: any) {
    console.error("Error fetching trending products:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
