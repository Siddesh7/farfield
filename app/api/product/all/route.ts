import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import { ProductService } from "@/lib/services/product-service";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);

    // Get pagination and sorting parameters
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = (searchParams.get("sortOrder") || "desc") as
      | "asc"
      | "desc";

    // Get filter parameters
    const category = searchParams.get("category");
    const productType = searchParams.get("productType");
    const isFree = searchParams.get("isFree");
    const creatorFid = searchParams.get("creatorFid");

    // Validate pagination parameters
    if (page < 1) {
      return NextResponse.json(
        { error: "Page must be greater than 0" },
        { status: 400 }
      );
    }

    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: "Limit must be between 1 and 100" },
        { status: 400 }
      );
    }

    if (!["asc", "desc"].includes(sortOrder)) {
      return NextResponse.json(
        { error: "Sort order must be 'asc' or 'desc'" },
        { status: 400 }
      );
    }

    // Validate sortBy parameter
    const validSortFields = [
      "createdAt",
      "updatedAt",
      "publishedAt",
      "name",
      "price",
      "ratingsScore",
      "totalSold",
      "totalRatings",
    ];
    if (!validSortFields.includes(sortBy)) {
      return NextResponse.json(
        { error: `Sort field must be one of: ${validSortFields.join(", ")}` },
        { status: 400 }
      );
    }

    // Build filters object
    const filters: any = {};

    if (category) {
      filters.category = category;
    }

    if (productType) {
      filters.productType = productType;
    }

    if (isFree !== null) {
      filters.isFree = isFree === "true";
    }

    if (creatorFid) {
      const fid = parseInt(creatorFid);
      if (isNaN(fid)) {
        return NextResponse.json(
          { error: "Invalid creatorFid format" },
          { status: 400 }
        );
      }
      filters.creatorFid = fid;
    }

    // Get all products with pagination and filters
    const result = await ProductService.getAllProducts(
      page,
      limit,
      sortBy,
      sortOrder,
      filters
    );

    return NextResponse.json({
      products: result.products,
      pagination: {
        page: result.page,
        pages: result.pages,
        total: result.total,
        limit: limit,
      },
      filters: filters,
    });
  } catch (error: any) {
    console.error("Error fetching all products:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
