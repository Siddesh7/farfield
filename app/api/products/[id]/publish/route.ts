import { Product } from "@/models/product";
import { User } from "@/models/user";
import connectDB from "@/lib/db/connect";
import { ApiResponseBuilder, withErrorHandling, RequestValidator } from "@/lib";
import { withAuth, AuthenticatedUser } from "@/lib/auth/privy-auth";
import mongoose from "mongoose";

// POST /api/products/[id]/publish - Publish/unpublish product (Protected - Creator only)
async function publishProductHandler(
  request: Request,
  authenticatedUser: AuthenticatedUser
) {
  await connectDB();

  const url = new URL(request.url);
  const id = url.pathname.split("/")[3]; // Extract product ID from path

  const validator = await RequestValidator.fromRequest(request);
  if (!validator.isValid()) {
    return validator.getErrorResponse()!;
  }

  const body = validator.body;

  // Validate product ID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return ApiResponseBuilder.error("Invalid product ID format", 400);
  }

  // Validate publish status
  validator.required(body.published, "published");

  if (typeof body.published !== "boolean") {
    return ApiResponseBuilder.error("published must be a boolean value", 400);
  }

  if (!validator.isValid()) {
    return validator.getErrorResponse()!;
  }

  // Get product and verify ownership
  const product = await Product.findById(id);
  if (!product) {
    return ApiResponseBuilder.notFound("Product not found");
  }

  // Get authenticated user to check if they're the creator
  const user = await (User as any).findByPrivyId(authenticatedUser.privyId);
  if (!user) {
    return ApiResponseBuilder.unauthorized("User not found");
  }

  // Check if user is the creator
  if (product.creatorFid !== user.farcasterFid) {
    return ApiResponseBuilder.forbidden(
      "You can only publish/unpublish your own products"
    );
  }

  // Validate product completeness before publishing
  if (body.published) {
    const validationErrors: string[] = [];

    // Check required fields
    if (!product.name || product.name.trim().length === 0) {
      validationErrors.push("Product name is required");
    }
    if (!product.description || product.description.trim().length === 0) {
      validationErrors.push("Product description is required");
    }
    if (!product.images || product.images.length === 0) {
      validationErrors.push("At least one product image is required");
    }
    if (!product.category || product.category.trim().length === 0) {
      validationErrors.push("Product category is required");
    }

    // Check content (digital files or external links)
    if (product.hasExternalLinks) {
      if (!product.externalLinks || product.externalLinks.length === 0) {
        validationErrors.push(
          "External links are required when hasExternalLinks is true"
        );
      }
    } else {
      if (!product.digitalFiles || product.digitalFiles.length === 0) {
        validationErrors.push(
          "Digital files are required when hasExternalLinks is false"
        );
      }
    }

    if (validationErrors.length > 0) {
      return ApiResponseBuilder.error(
        `Cannot publish incomplete product: ${validationErrors.join(", ")}`,
        400
      );
    }
  }

  // Update publish status
  const updateData: any = {};

  if (body.published) {
    updateData.publishedAt = new Date();
  } else {
    updateData.publishedAt = null;
  }

  const updatedProduct = await Product.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  const status = body.published ? "published" : "unpublished";
  const message = `Product ${status} successfully`;

  return ApiResponseBuilder.success(
    {
      id: updatedProduct!._id,
      published: body.published,
      publishedAt: updatedProduct!.publishedAt,
      name: updatedProduct!.name,
    },
    message
  );
}

// Export handler
async function protectedPublishHandler(
  request: Request,
  authenticatedUser: AuthenticatedUser
) {
  return publishProductHandler(request, authenticatedUser);
}

export const POST = withErrorHandling(withAuth(protectedPublishHandler));
