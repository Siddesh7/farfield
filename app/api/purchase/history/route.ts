import { Purchase } from "@/models/purchase";
import { User } from "@/models/user";
import { Product } from "@/models/product";
import connectDB from "@/lib/db/connect";
import { ApiResponseBuilder, withErrorHandling, HTTP_STATUS } from "@/lib";
import { withAuth, AuthenticatedUser } from "@/lib/auth/privy-auth";

async function purchaseHistoryHandler(
  request: Request,
  authenticatedUser: AuthenticatedUser
) {
  await connectDB();
  const privyId = authenticatedUser.privyId;
  const user = await (User as any).findByPrivyId(privyId);
  if (!user) {
    return ApiResponseBuilder.notFound("User not found");
  }
  const fid = user.farcasterFid;

  // Parse query parameters
  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
  const limit = Math.min(
    Math.max(1, parseInt(url.searchParams.get("limit") || "20")),
    100
  );
  const status = url.searchParams.get("status");

  // Build query
  const query: any = { buyerFid: fid };
  if (
    status &&
    ["completed", "pending", "failed", "expired"].includes(status)
  ) {
    query.status = status;
  }

  // Get purchases with pagination
  const purchases = await Purchase.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();
  const totalPurchases = await Purchase.countDocuments(query);

  // Get product details for completed purchases
  const completedPurchases = purchases.filter((p) => p.status === "completed");
  const allProductIds = completedPurchases.flatMap((p) =>
    p.items.map((item: any) => item.productId)
  );
  const products = await Product.find({
    _id: { $in: allProductIds },
  })
    .select("name description price digitalFiles externalLinks images")
    .lean();
  const productMap = products.reduce((acc: any, product: any) => {
    acc[product._id.toString()] = product;
    return acc;
  }, {});

  // Format response
  const formattedPurchases = purchases.map((purchase) => ({
    purchaseId: purchase.purchaseId,
    status: purchase.status,
    totalAmount: purchase.totalAmount,
    platformFee: purchase.platformFee,
    createdAt: purchase.createdAt,
    completedAt: purchase.completedAt,
    expiresAt: purchase.expiresAt,
    transactionHash: purchase.transactionHash,
    items: purchase.items.map((item: any) => {
      const product = productMap[item.productId];
      return {
        productId: item.productId,
        price: item.price / 1000000,
        product: product
          ? {
              name: product.name,
              description: product.description,
              thumbnail: product.images?.[0] || null,
              hasFiles:
                (product.digitalFiles && product.digitalFiles.length > 0) ||
                (product.externalLinks && product.externalLinks.length > 0),
            }
          : null,
      };
    }),
  }));

  const responseData = {
    purchases: formattedPurchases,
    pagination: {
      page,
      limit,
      total: totalPurchases,
      totalPages: Math.ceil(totalPurchases / limit),
    },
    summary: {
      totalPurchases,
      completedPurchases: purchases.filter((p) => p.status === "completed")
        .length,
      pendingPurchases: purchases.filter((p) => p.status === "pending").length,
      totalSpent: completedPurchases.reduce((sum, p) => sum + p.totalAmount, 0),
    },
  };
  return ApiResponseBuilder.success(
    responseData,
    "Purchase history retrieved successfully"
  );
}

export const GET = withErrorHandling(withAuth(purchaseHistoryHandler));
