import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import { ProductService } from "@/lib/services/product-service";
import { Product as ProductType } from "@/lib/types/product";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();

    // Validate required fields
    const requiredFields = [
      "name",
      "description",
      "images",
      "price",
      "creatorFid",
      "category",
      "isFree",
      "previewAvailable",
      "hasExternalLinks",
    ];

    for (const field of requiredFields) {
      if (body[field] === undefined || body[field] === null) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate field types
    if (typeof body.creatorFid !== "number") {
      return NextResponse.json(
        { error: "creatorFid must be a number" },
        { status: 400 }
      );
    }

    if (typeof body.price !== "number" || body.price < 0) {
      return NextResponse.json(
        { error: "price must be a non-negative number" },
        { status: 400 }
      );
    }

    if (!Array.isArray(body.images) || body.images.length === 0) {
      return NextResponse.json(
        { error: "images must be a non-empty array" },
        { status: 400 }
      );
    }

    if (typeof body.isFree !== "boolean") {
      return NextResponse.json(
        { error: "isFree must be a boolean" },
        { status: 400 }
      );
    }

    if (typeof body.previewAvailable !== "boolean") {
      return NextResponse.json(
        { error: "previewAvailable must be a boolean" },
        { status: 400 }
      );
    }

    if (typeof body.hasExternalLinks !== "boolean") {
      return NextResponse.json(
        { error: "hasExternalLinks must be a boolean" },
        { status: 400 }
      );
    }

    // Validate that either digitalFiles or externalLinks is provided, but not both
    const hasDigitalFiles =
      body.digitalFiles &&
      Array.isArray(body.digitalFiles) &&
      body.digitalFiles.length > 0;
    const hasExternalLinks =
      body.externalLinks &&
      Array.isArray(body.externalLinks) &&
      body.externalLinks.length > 0;

    if (!hasDigitalFiles && !hasExternalLinks) {
      return NextResponse.json(
        { error: "Either digitalFiles or externalLinks must be provided" },
        { status: 400 }
      );
    }

    if (hasDigitalFiles && hasExternalLinks) {
      return NextResponse.json(
        { error: "Cannot provide both digitalFiles and externalLinks" },
        { status: 400 }
      );
    }

    // Validate that the boolean flag matches the content
    if (hasExternalLinks && !body.hasExternalLinks) {
      return NextResponse.json(
        {
          error:
            "hasExternalLinks must be true when externalLinks are provided",
        },
        { status: 400 }
      );
    }

    if (hasDigitalFiles && body.hasExternalLinks) {
      return NextResponse.json(
        {
          error:
            "hasExternalLinks must be false when digitalFiles are provided",
        },
        { status: 400 }
      );
    }

    // Validate external link types if provided
    if (hasExternalLinks) {
      const validLinkTypes = ["figma", "notion", "behance", "github", "other"];
      for (const link of body.externalLinks) {
        if (!validLinkTypes.includes(link.type)) {
          return NextResponse.json(
            {
              error: `External link type must be one of: ${validLinkTypes.join(
                ", "
              )}`,
            },
            { status: 400 }
          );
        }
      }
    }

    // Validate preview requirements
    if (body.previewAvailable && !body.previewFile && !body.previewLink) {
      return NextResponse.json(
        {
          error:
            "previewFile or previewLink must be provided when previewAvailable is true",
        },
        { status: 400 }
      );
    }

    // Validate discount percentage
    if (
      body.discountPercentage !== undefined &&
      (body.discountPercentage < 0 || body.discountPercentage > 100)
    ) {
      return NextResponse.json(
        { error: "discountPercentage must be between 0 and 100" },
        { status: 400 }
      );
    }

    // Create the product data
    const productData: Omit<ProductType, "_id" | "createdAt" | "updatedAt"> = {
      name: body.name,
      description: body.description,
      images: body.images,
      price: body.price,
      ratingsScore: 0,
      comments: [],
      buyer: [],
      hasExternalLinks: body.hasExternalLinks,
      creatorFid: body.creatorFid,
      slug: body.slug,
      category: body.category,
      tags: body.tags || [],
      productType: body.productType,
      isFree: body.isFree,
      totalSold: 0,
      fileSize: body.fileSize,
      fileFormat: body.fileFormat || [],
      previewAvailable: body.previewAvailable,
      previewFile: body.previewFile,
      previewLink: body.previewLink,
      discountPercentage: body.discountPercentage,
      publishedAt: body.publishedAt ? new Date(body.publishedAt) : new Date(),
      totalRatings: 0,
      ratingsBreakdown: {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      },
    };

    // Add either digitalFiles or externalLinks
    if (hasDigitalFiles) {
      productData.digitalFiles = body.digitalFiles;
    } else {
      productData.externalLinks = body.externalLinks;
    }

    const product = await ProductService.createProduct(productData);

    return NextResponse.json(
      {
        message: "Product created successfully",
        product: {
          _id: product._id,
          name: product.name,
          description: product.description,
          images: product.images,
          price: product.price,
          ratingsScore: product.ratingsScore,
          comments: product.comments,
          buyerFids: product.buyerFids,
          hasExternalLinks: product.hasExternalLinks,
          digitalFiles: product.digitalFiles,
          externalLinks: product.externalLinks,
          creatorFid: product.creatorFid,
          slug: product.slug,
          category: product.category,
          tags: product.tags,
          productType: product.productType,
          isFree: product.isFree,
          totalSold: product.totalSold,
          fileSize: product.fileSize,
          fileFormat: product.fileFormat,
          previewAvailable: product.previewAvailable,
          previewFile: product.previewFile,
          previewLink: product.previewLink,
          discountPercentage: product.discountPercentage,
          publishedAt: product.publishedAt,
          totalRatings: product.totalRatings,
          ratingsBreakdown: product.ratingsBreakdown,
          createdAt: (product as any).createdAt,
          updatedAt: (product as any).updatedAt,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating product:", error);

    if (error.message.includes("already exists")) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    if (error.message.includes("Validation error")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
