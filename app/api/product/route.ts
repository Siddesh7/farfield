import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import { ProductService } from "@/lib/services/product-service";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);

    // Check for specific product queries
    const productId = searchParams.get("id");
    const slug = searchParams.get("slug");
    const creatorFid = searchParams.get("creatorFid");
    const category = searchParams.get("category");
    const isFree = searchParams.get("isFree");
    const search = searchParams.get("search");

    // If specific query parameters are provided, return matching products
    if (productId) {
      const product = await ProductService.getProductById(productId);
      if (!product) {
        return NextResponse.json(
          { error: "Product not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ product });
    }

    if (slug) {
      const product = await ProductService.getProductBySlug(slug);
      if (!product) {
        return NextResponse.json(
          { error: "Product not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ product });
    }

    if (creatorFid) {
      const fid = parseInt(creatorFid);
      if (isNaN(fid)) {
        return NextResponse.json(
          { error: "Invalid creatorFid format" },
          { status: 400 }
        );
      }
      const products = await ProductService.getProductsByCreatorFid(fid);
      return NextResponse.json({ products });
    }

    if (category) {
      const products = await ProductService.getProductsByCategory(category);
      return NextResponse.json({ products });
    }

    if (isFree !== null) {
      const freeProducts = isFree === "true";
      if (freeProducts) {
        const products = await ProductService.getFreeProducts();
        return NextResponse.json({ products });
      }
    }

    if (search) {
      // Parse additional filter parameters for search
      const searchFilters: any = {};

      const filterCategory = searchParams.get("filterCategory");
      const filterFree = searchParams.get("filterFree");
      const minPrice = searchParams.get("minPrice");
      const maxPrice = searchParams.get("maxPrice");
      const tags = searchParams.get("tags");

      if (filterCategory) searchFilters.category = filterCategory;
      if (filterFree !== null) searchFilters.isFree = filterFree === "true";
      if (minPrice) searchFilters.minPrice = parseFloat(minPrice);
      if (maxPrice) searchFilters.maxPrice = parseFloat(maxPrice);
      if (tags) searchFilters.tags = tags.split(",");

      const products = await ProductService.searchProducts(
        search,
        searchFilters
      );
      return NextResponse.json({ products });
    }

    // If no specific query parameters are provided, return error
    return NextResponse.json(
      {
        error:
          "Please provide a specific query parameter (id, slug, creatorFid, category, isFree, or search)",
      },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
