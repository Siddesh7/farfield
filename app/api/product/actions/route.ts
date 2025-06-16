import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import { ProductService } from "@/lib/services/product-service";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { action, productId } = body;

    if (!action || !productId) {
      return NextResponse.json(
        { error: "Missing required fields: action and productId" },
        { status: 400 }
      );
    }

    switch (action) {
      case "addComment": {
        const { commentorFid, comment } = body;

        if (!commentorFid || !comment) {
          return NextResponse.json(
            { error: "Missing required fields: commentorFid and comment" },
            { status: 400 }
          );
        }

        if (typeof commentorFid !== "number") {
          return NextResponse.json(
            { error: "commentorFid must be a number" },
            { status: 400 }
          );
        }

        if (typeof comment !== "string" || comment.trim().length === 0) {
          return NextResponse.json(
            { error: "comment must be a non-empty string" },
            { status: 400 }
          );
        }

        if (comment.length > 1000) {
          return NextResponse.json(
            { error: "comment must be 1000 characters or less" },
            { status: 400 }
          );
        }

        const updatedProduct = await ProductService.addComment(
          productId,
          commentorFid,
          comment.trim()
        );

        return NextResponse.json({
          message: "Comment added successfully",
          product: updatedProduct,
        });
      }

      case "addRating": {
        const { rating } = body;

        if (rating === undefined || rating === null) {
          return NextResponse.json(
            { error: "Missing required field: rating" },
            { status: 400 }
          );
        }

        if (typeof rating !== "number" || rating < 1 || rating > 5) {
          return NextResponse.json(
            { error: "rating must be a number between 1 and 5" },
            { status: 400 }
          );
        }

        const updatedProduct = await ProductService.addRating(
          productId,
          rating
        );

        return NextResponse.json({
          message: "Rating added successfully",
          product: updatedProduct,
        });
      }

      case "recordPurchase": {
        const { buyerFid } = body;

        if (!buyerFid) {
          return NextResponse.json(
            { error: "Missing required field: buyerFid" },
            { status: 400 }
          );
        }

        if (typeof buyerFid !== "number") {
          return NextResponse.json(
            { error: "buyerFid must be a number" },
            { status: 400 }
          );
        }

        const updatedProduct = await ProductService.recordPurchase(
          productId,
          buyerFid
        );

        return NextResponse.json({
          message: "Purchase recorded successfully",
          product: updatedProduct,
        });
      }

      case "checkPurchase": {
        const { userFid } = body;

        if (!userFid) {
          return NextResponse.json(
            { error: "Missing required field: userFid" },
            { status: 400 }
          );
        }

        if (typeof userFid !== "number") {
          return NextResponse.json(
            { error: "userFid must be a number" },
            { status: 400 }
          );
        }

        const hasPurchased = await ProductService.hasUserPurchased(
          productId,
          userFid
        );

        return NextResponse.json({
          hasPurchased,
          userFid,
          productId,
        });
      }

      default:
        return NextResponse.json(
          {
            error:
              "Invalid action. Supported actions: addComment, addRating, recordPurchase, checkPurchase",
          },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error("Error performing product action:", error);

    if (error.message.includes("Product not found")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (
      error.message.includes("Rating must be between 1 and 5") ||
      error.message.includes("Validation error")
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
