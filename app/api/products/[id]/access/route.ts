import { Purchase } from "@/models/purchase";
import { User } from "@/models/user";
import { Product } from "@/models/product";
import connectDB from "@/lib/db/connect";
import { ApiResponseBuilder, withErrorHandling, HTTP_STATUS } from "@/lib";
import { withAuth, AuthenticatedUser } from "@/lib/auth/privy-auth";

interface RouteParams {
  params: {
    id: string;
  };
}

async function productAccessHandler(
  request: Request,
  authenticatedUser: AuthenticatedUser,
  { params }: RouteParams
) {
  await connectDB();
  const privyId = authenticatedUser.privyId;
  const user = await (User as any).findByPrivyId(privyId);
  if (!user) {
    return ApiResponseBuilder.notFound("User not found");
  }
  const fid = user.farcasterFid;
  const productId = params.id;
  if (!productId) {
    return ApiResponseBuilder.error(
      "Product ID is required",
      HTTP_STATUS.BAD_REQUEST
    );
  }
  const product = (await Product.findById(productId)
    .select("name price status creatorFid digitalFiles externalLinks")
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
  if (hasAccess) {
    if (product.digitalFiles && product.digitalFiles.length > 0) {
      downloadUrls = product.digitalFiles.map((file: any) => ({
        fileName: file.fileName,
        url: `/api/files/${file.fileUrl}`,
        fileSize: file.fileSize,
      }));
    }
    if (product.externalLinks && product.externalLinks.length > 0) {
      externalLinks = product.externalLinks.map((link: any) => ({
        name: link.name,
        url: link.url,
        type: link.type,
      }));
    }
  } else {
    downloadUrls = null;
    externalLinks = null;
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
  };
  return ApiResponseBuilder.success(
    responseData,
    hasAccess ? "Access granted" : "Access denied"
  );
}

export const GET = withErrorHandling(withAuth(productAccessHandler));
