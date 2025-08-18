import { Purchase } from "@/models/purchase";
import { User } from "@/models/user";
import { Product } from "@/models/product";
import connectDB from "@/lib/db/connect";
import { ApiResponseBuilder, withErrorHandling, HTTP_STATUS } from "@/lib";
import { withAuth, AuthenticatedUser } from "@/lib/auth/privy-auth";
import { getPresignedUrl } from "@/lib/r2";

interface RouteParams {
  params: {
    id: string;
  };
}

async function productAccessHandler(
  request: Request,
  authenticatedUser: AuthenticatedUser,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();
  const { id: productId } = await params;
  const privyId = authenticatedUser.privyId;
  const user = await (User as any).findByPrivyId(privyId);
  if (!user) {
    return ApiResponseBuilder.notFound("User not found");
  }
  const fid = user.farcasterFid;
  if (!productId) {
    return ApiResponseBuilder.error(
      "Product ID is required",
      HTTP_STATUS.BAD_REQUEST
    );
  }
  const product = (await Product.findById(productId)
    .select(
      "name price status creatorFid digitalFiles externalLinks previewFiles previewLinks images"
    )
    .lean()) as any;
  if (!product) {
    return ApiResponseBuilder.notFound("Product not found");
  }
  const isCreator = product.creatorFid === user.farcasterFid;
  const purchase = (await Purchase.findOne({
    buyerFid: fid,
    status: "completed",
    "items.productId": productId,
  }).lean()) as any;
  const hasPurchased = !!purchase;
  const hasAccess = isCreator || hasPurchased;
  let purchaseDetails = null;
  if (purchase) {
    const purchaseItem = purchase.items.find(
      (item: any) => item.productId === productId
    );
    purchaseDetails = {
      purchaseId: purchase.purchaseId,
      purchasedAt: purchase.completedAt,
      pricePaid: purchaseItem ? purchaseItem.price / 1000000 : null,
      transactionHash: purchase.transactionHash,
    };
  }
  let downloadUrls = null;
  let externalLinks = null;
  let previewFiles = null;
  let previewLinks = null;
  if (hasAccess) {
    if (product.digitalFiles && product.digitalFiles.length > 0) {
      // Generate presigned URLs for authenticated downloads
      downloadUrls = await Promise.all(
        product.digitalFiles.map(async (file: any) => ({
          fileName: file.fileName,
          url: await getPresignedUrl(file.fileUrl, 3600), // 1 hour expiry
          fileSize: file.fileSize,
        }))
      );
    }
    if (product.externalLinks && product.externalLinks.length > 0) {
      externalLinks = product.externalLinks.map((link: any) => ({
        name: link.name,
        url: link.url,
        type: link.type,
      }));
    }
    if (product.previewFiles && product.previewFiles.length > 0) {
      // Generate presigned URLs for preview files too
      previewFiles = await Promise.all(
        product.previewFiles.map(async (file: any) => ({
          fileName: file.fileName,
          url: await getPresignedUrl(file.fileUrl, 3600), // 1 hour expiry
          fileSize: file.fileSize,
        }))
      );
    }
    if (product.previewLinks && product.previewLinks.length > 0) {
      previewLinks = product.previewLinks.map((link: any) => ({
        name: link.name,
        url: link.url,
        type: link.type,
      }));
    }
  } else {
    downloadUrls = null;
    externalLinks = null;
    previewFiles = null;
    previewLinks = null;
  }
  // Fetch creator info
  const creatorUser = await User.findOne({ farcasterFid: product.creatorFid });
  let creatorInfo = null;
  if (creatorUser) {
    creatorInfo = {
      fid: creatorUser.farcasterFid,
      name: creatorUser.farcaster.displayName,
      username: creatorUser.farcaster.username,
      pfp: creatorUser.farcaster.pfp || null,
    };
  }

  const responseData = {
    productId,
    productTitle: product.name,
    hasAccess,
    isCreator,
    hasPurchased,
    purchaseDetails,
    access: {
      canDownload: hasAccess,
      canView: hasAccess || product.status === "published",
      canEdit: isCreator,
    },
    downloadUrls,
    externalLinks,
    previewFiles,
    previewLinks,
    images: product.images || [],
    creator: creatorInfo,
  };
  return ApiResponseBuilder.success(
    responseData,
    hasAccess ? "Access granted" : "Access denied"
  );
}

export const GET = withErrorHandling(withAuth(productAccessHandler));
