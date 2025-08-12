import { Product } from "@/models/product";
import { User } from "@/models/user";
import { Purchase } from "@/models/purchase";
import connectDB from "@/lib/db/connect";
import {
  ApiResponseBuilder,
  withErrorHandling,
  RequestValidator,
  API_MESSAGES,
} from "@/lib";
import { withAuth, AuthenticatedUser } from "@/lib/auth/privy-auth";
import mongoose from "mongoose";

// GET /api/products/[id] - Get single product details (Public)
async function getProductByIdHandler(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();

  const { id } = await params;

  const validator = new RequestValidator();
  validator.required(id, "id").string(id, "id", 1);

  if (!validator.isValid()) {
    return validator.getErrorResponse()!;
  }

  // Validate MongoDB ObjectId format
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return ApiResponseBuilder.error("Invalid product ID format", 400);
  }

  const product = await Product.findById(id);

  if (!product) {
    return ApiResponseBuilder.notFound("Product not found");
  }

  // Check if product is published (unless user is the creator)
  if (!product.publishedAt) {
    return ApiResponseBuilder.notFound("Product not found");
  }

  // Return public product data (remove buyer information for public view)
  const productObj = product.toObject();
  delete productObj.buyer;

  // Fetch creator info
  const creatorUser = await User.findOne({
    farcasterFid: productObj.creatorFid,
  });
  let creatorInfo = null;
  if (creatorUser) {
    creatorInfo = {
      fid: creatorUser.farcasterFid,
      name: creatorUser.farcaster.displayName,
      username: creatorUser.farcaster.username,
      pfp: creatorUser.farcaster.pfp || null,
    };
  }
  productObj.creator = creatorInfo;
  delete productObj.creatorFid;

  // Add commentsPreview: 3 latest comments with commentator info
  const comments = productObj.comments || [];
  const latestComments = comments
    .sort(
      (a: any, b: any) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 3);
  const commentorFids = [
    ...new Set(latestComments.map((c: any) => c.commentorFid)),
  ];
  const commentUsers = await User.find({
    farcasterFid: { $in: commentorFids },
  });
  const commentUserMap = new Map(
    commentUsers.map((u) => [
      u.farcasterFid,
      {
        fid: u.farcasterFid,
        name: u.farcaster.displayName,
        username: u.farcaster.username,
        pfp: u.farcaster.pfp || null,
      },
    ])
  );
  productObj.commentsPreview = latestComments.map((comment: any) => ({
    _id: comment._id,
    commentorFid: comment.commentorFid,
    comment: comment.comment,
    createdAt: comment.createdAt,
    commentor: commentUserMap.get(comment.commentorFid) || null,
  }));

  // Remove comments array from product response
  delete productObj.comments;

  // Add buyers: 3 latest buyers with their info from Purchase model (actual completed purchases)
  const completedPurchases = await Purchase.find({
    "items.productId": id,
    status: "completed",
    blockchainVerified: true,
  })
    .sort({ completedAt: -1 })
    .limit(3);

  const buyerFids = [...new Set(completedPurchases.map((p) => p.buyerFid))];
  const buyerUsers = await User.find({
    farcasterFid: { $in: buyerFids },
  });
  const buyerUserMap = new Map(
    buyerUsers.map((u) => [
      u.farcasterFid,
      {
        fid: u.farcasterFid,
        name: u.farcaster.displayName,
        username: u.farcaster.username,
        pfp: u.farcaster.pfp || null,
      },
    ])
  );

  productObj.buyers = completedPurchases
    .map((purchase) => {
      const buyerInfo = buyerUserMap.get(purchase.buyerFid);
      return buyerInfo
        ? {
            fid: buyerInfo.fid,
            username: buyerInfo.username,
            pfp: buyerInfo.pfp,
            name: buyerInfo.name,
          }
        : null;
    })
    .filter(Boolean);

  // Remove buyer array from product response (keep it private)
  delete productObj.buyer;

  return ApiResponseBuilder.success(
    productObj,
    "Product retrieved successfully"
  );
}

// PUT /api/products/[id] - Update product (Protected - Creator only)
async function updateProductHandler(
  request: Request,
  authenticatedUser: AuthenticatedUser,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();

  const { id } = await params;

  const validator = await RequestValidator.fromRequest(request);
  if (!validator.isValid()) {
    return validator.getErrorResponse()!;
  }

  const body = validator.body;

  // Validate MongoDB ObjectId format
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return ApiResponseBuilder.error("Invalid product ID format", 400);
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
      "You can only update your own products"
    );
  }

  // Validate updateable fields
  if (body.name !== undefined) {
    validator.string(body.name, "name", 1, 200);
  }
  if (body.description !== undefined) {
    validator.string(body.description, "description", 1, 5000);
  }
  if (body.price !== undefined) {
    validator.number(body.price, "price", 0);
  }
  if (body.category !== undefined) {
    validator.string(body.category, "category", 1, 100);
  }
  if (body.images !== undefined) {
    validator.array(body.images, "images", 1);
    if (Array.isArray(body.images)) {
      body.images.forEach((image: string, index: number) => {
        validator.string(image, `images[${index}]`, 1, 500);
      });
    }
  }
  if (body.tags !== undefined) {
    validator.array(body.tags, "tags", 0, 10);
    if (Array.isArray(body.tags)) {
      body.tags.forEach((tag: string, index: number) => {
        validator.string(tag, `tags[${index}]`, 1, 50);
      });
    }
  }
  if (body.discountPercentage !== undefined) {
    validator.number(body.discountPercentage, "discountPercentage", 0, 100);
  }

  // Validate digital files or external links if being updated
  if (body.hasExternalLinks !== undefined && body.hasExternalLinks) {
    if (body.externalLinks) {
      validator.array(body.externalLinks, "externalLinks", 1);
      if (Array.isArray(body.externalLinks)) {
        body.externalLinks.forEach((link: any, index: number) => {
          validator
            .required(link.name, `externalLinks[${index}].name`)
            .string(link.name, `externalLinks[${index}].name`, 1, 100)
            .required(link.url, `externalLinks[${index}].url`)
            .string(link.url, `externalLinks[${index}].url`, 1, 500)
            .required(link.type, `externalLinks[${index}].type`)
            .enum(link.type, `externalLinks[${index}].type`, [
              "figma",
              "notion",
              "behance",
              "github",
              "other",
            ]);
        });
      }
    }
    // Validate previewLinks if present
    if (body.previewLinks) {
      validator.array(body.previewLinks, "previewLinks");
      if (Array.isArray(body.previewLinks)) {
        body.previewLinks.forEach((link: any, index: number) => {
          validator
            .required(link.name, `previewLinks[${index}].name`)
            .string(link.name, `previewLinks[${index}].name`, 1, 100)
            .required(link.url, `previewLinks[${index}].url`)
            .string(link.url, `previewLinks[${index}].url`, 1, 500)
            .required(link.type, `previewLinks[${index}].type`)
            .enum(link.type, `previewLinks[${index}].type`, [
              "figma",
              "notion",
              "behance",
              "github",
              "other",
            ]);
        });
      }
    }
  } else if (body.hasExternalLinks !== undefined && !body.hasExternalLinks) {
    if (body.digitalFiles) {
      validator.array(body.digitalFiles, "digitalFiles", 1);
      if (Array.isArray(body.digitalFiles)) {
        body.digitalFiles.forEach((file: any, index: number) => {
          validator
            .required(file.fileName, `digitalFiles[${index}].fileName`)
            .string(file.fileName, `digitalFiles[${index}].fileName`, 1, 255)
            .required(file.fileUrl, `digitalFiles[${index}].fileUrl`)
            .string(file.fileUrl, `digitalFiles[${index}].fileUrl`, 1, 500)
            .required(file.fileSize, `digitalFiles[${index}].fileSize`)
            .number(file.fileSize, `digitalFiles[${index}].fileSize`, 1);
        });
      }
    }
    // Validate previewFiles if present
    if (body.previewFiles) {
      validator.array(body.previewFiles, "previewFiles");
      if (Array.isArray(body.previewFiles)) {
        body.previewFiles.forEach((file: any, index: number) => {
          validator
            .required(file.fileName, `previewFiles[${index}].fileName`)
            .string(file.fileName, `previewFiles[${index}].fileName`, 1, 255)
            .required(file.fileUrl, `previewFiles[${index}].fileUrl`)
            .string(file.fileUrl, `previewFiles[${index}].fileUrl`, 1, 500)
            .required(file.fileSize, `previewFiles[${index}].fileSize`)
            .number(file.fileSize, `previewFiles[${index}].fileSize`, 1);
        });
      }
    }
  }

  if (!validator.isValid()) {
    return validator.getErrorResponse()!;
  }

  // Update fields
  const updateData: any = {};

  if (body.name !== undefined) updateData.name = body.name;
  if (body.description !== undefined) updateData.description = body.description;
  if (body.price !== undefined) {
    updateData.price = body.price;
    updateData.isFree = body.price === 0;
  }
  if (body.category !== undefined) updateData.category = body.category;
  if (body.images !== undefined) updateData.images = body.images;
  if (body.tags !== undefined) updateData.tags = body.tags;
  if (body.discountPercentage !== undefined)
    updateData.discountPercentage = body.discountPercentage;
  if (body.hasExternalLinks !== undefined)
    updateData.hasExternalLinks = body.hasExternalLinks;
  if (body.externalLinks !== undefined)
    updateData.externalLinks = body.externalLinks;
  if (body.digitalFiles !== undefined)
    updateData.digitalFiles = body.digitalFiles;
  if (body.fileFormat !== undefined) updateData.fileFormat = body.fileFormat;
  if (body.previewFiles !== undefined)
    updateData.previewFiles = body.previewFiles;
  if (body.previewLinks !== undefined)
    updateData.previewLinks = body.previewLinks;
  if (body.previewFiles !== undefined || body.previewLinks !== undefined) {
    updateData.previewAvailable = !!(
      (body.previewFiles && body.previewFiles.length) ||
      (body.previewLinks && body.previewLinks.length)
    );
  }

  const updatedProduct = await Product.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  return ApiResponseBuilder.success(
    updatedProduct!.toObject(),
    "Product updated successfully"
  );
}

// DELETE /api/products/[id] - Delete product (Protected - Creator only)
async function deleteProductHandler(
  request: Request,
  authenticatedUser: AuthenticatedUser,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();

  const { id } = await params;

  // Validate MongoDB ObjectId format
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return ApiResponseBuilder.error("Invalid product ID format", 400);
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
      "You can only delete your own products"
    );
  }

  await Product.findByIdAndDelete(id);

  return ApiResponseBuilder.success(
    { deleted: true },
    "Product deleted successfully"
  );
}

// Export handlers with proper authentication wrapper pattern
export const GET = withErrorHandling(getProductByIdHandler);

async function protectedUpdateHandler(
  request: Request,
  authenticatedUser: AuthenticatedUser
) {
  const url = new URL(request.url);
  const id = url.pathname.split("/").pop()!;
  const params = Promise.resolve({ id });
  return updateProductHandler(request, authenticatedUser, { params });
}

async function protectedDeleteHandler(
  request: Request,
  authenticatedUser: AuthenticatedUser
) {
  const url = new URL(request.url);
  const id = url.pathname.split("/").pop()!;
  const params = Promise.resolve({ id });
  return deleteProductHandler(request, authenticatedUser, { params });
}

export const PUT = withErrorHandling(withAuth(protectedUpdateHandler));
export const DELETE = withErrorHandling(withAuth(protectedDeleteHandler));
