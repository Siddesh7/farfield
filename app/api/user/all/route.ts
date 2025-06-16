import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import { UserService } from "@/lib/services/user-service";

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

    // Get all users with pagination
    const result = await UserService.getAllUsers(
      page,
      limit,
      sortBy,
      sortOrder
    );

    return NextResponse.json({
      users: result.users,
      pagination: {
        page: result.page,
        pages: result.pages,
        total: result.total,
        limit: limit,
      },
    });
  } catch (error: any) {
    console.error("Error fetching all users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
