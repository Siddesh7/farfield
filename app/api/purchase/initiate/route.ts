import { Product } from "@/models/product";
import { Purchase } from "@/models/purchase";
import { User } from "@/models/user";
import connectDB from "@/lib/db/connect";
import {
  farfieldContract,
  usdcUtils,
  usdcContract,
} from "@/lib/blockchain/client";
import { FARFIELD_CONTRACT_ADDRESS } from "@/lib/blockchain/constants";
import { nanoid } from "nanoid";
import {
  ApiResponseBuilder,
  withErrorHandling,
  RequestValidator,
  HTTP_STATUS,
} from "@/lib";
import { withAuth, AuthenticatedUser } from "@/lib/auth/privy-auth";

interface PurchaseItem {
  productId: string;
  quantity?: number;
}

interface InitiatePurchaseRequest {
  items: PurchaseItem[];
  buyerWallet: string;
}

const PURCHASE_EXPIRY_MINUTES = 15;

async function initiatePurchaseHandler(
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

  // Parse and validate body
  const validator = await RequestValidator.fromRequest(request);
  if (!validator.isValid()) {
    return validator.getErrorResponse()!;
  }
  const body: InitiatePurchaseRequest = validator.body;
  validator
    .required(body.items, "items")
    .array(body.items, "items", 1)
    .required(body.buyerWallet, "buyerWallet")
    .string(body.buyerWallet, "buyerWallet", 42, 42);
  if (!validator.isValid()) {
    return validator.getErrorResponse()!;
  }
  if (!/^0x[a-fA-F0-9]{40}$/.test(body.buyerWallet)) {
    return ApiResponseBuilder.error(
      "Invalid wallet address",
      HTTP_STATUS.BAD_REQUEST
    );
  }

  // Get all products
  const productIds = body.items.map((item) => item.productId);
  const products = await Product.find({
    _id: { $in: productIds },
  });

  if (products.length !== productIds.length) {
    return ApiResponseBuilder.error(
      "Some products not found or not available",
      HTTP_STATUS.BAD_REQUEST
    );
  }

  // Check for products user already owns
  const existingPurchases = await Purchase.find({
    buyerFid: fid,
    status: "completed",
    "items.productId": { $in: productIds },
  });
  const ownedProductIds = existingPurchases.flatMap((p: any) =>
    p.items.map((item: any) => item.productId)
  );
  if (ownedProductIds.length > 0) {
    return ApiResponseBuilder.error(
      `You already own some of these products: ${ownedProductIds.join(", ")}`,
      HTTP_STATUS.BAD_REQUEST
    );
  }

  // For each product, fetch the seller user by creatorFid
  const sellerMap: Record<string, any> = {};
  for (const product of products) {
    const seller = await (User as any).findByFarcasterFid(product.creatorFid);
    if (!seller || !seller.wallets || seller.wallets.length === 0) {
      return ApiResponseBuilder.error(
        `Product ${product.name} does not have a valid seller wallet`,
        HTTP_STATUS.BAD_REQUEST
      );
    }
    sellerMap[product._id.toString()] = seller;
  }

  // Prepare purchase data
  const purchaseItems = products.map((product: any) => {
    const seller = sellerMap[product._id.toString()];
    return {
      productId: product._id.toString(),
      price: Math.round(product.price * 1000000),
      sellerFid: product.creatorFid,
      sellerWallet: seller.wallets[0].address,
    };
  });
  const productPrices = purchaseItems.map((item: any) => BigInt(item.price));
  const sellerAddresses = purchaseItems.map(
    (item: any) => item.sellerWallet as `0x${string}`
  );

  // Calculate costs using smart contract
  const costBreakdown = await farfieldContract.calculatePurchaseCost(
    productPrices
  );

  // Generate unique purchase ID
  const purchaseId = `purchase_${nanoid(16)}`;
  // Create purchase record
  const purchase = new Purchase({
    purchaseId,
    buyerFid: fid,
    buyerWallet: body.buyerWallet,
    items: purchaseItems,
    totalAmount: usdcUtils.fromUnits(costBreakdown.totalUserPays),
    platformFee: usdcUtils.fromUnits(costBreakdown.platformFee),
    status: "pending",
    expiresAt: new Date(Date.now() + PURCHASE_EXPIRY_MINUTES * 60 * 1000),
  });
  await purchase.save();
  // Generate transaction payloads
  const purchaseTx = farfieldContract.generatePurchaseTransaction(
    purchaseId,
    productPrices,
    sellerAddresses
  );
  const transactions = [
    {
      type: "purchase",
      description: "Process purchase",
      ...purchaseTx,
      gas: "200000",
    },
  ];
  // Prepare response data
  const responseData = {
    purchaseId,
    transactions,
    summary: {
      items: products.map((product: any) => {
        const seller = sellerMap[product._id.toString()];
        return {
          id: product._id,
          name: product.name,
          price: product.price,
          seller: seller.farcaster?.username || `User ${product.creatorFid}`,
        };
      }),
      totalAmount: usdcUtils.fromUnits(costBreakdown.totalUserPays),
      platformFee: usdcUtils.fromUnits(costBreakdown.platformFee),
      expiresAt: purchase.expiresAt.toISOString(),
    },
    blockchain: {
      network: "Base Sepolia",
      contractAddress: FARFIELD_CONTRACT_ADDRESS,
    },
  };
  return ApiResponseBuilder.success(
    responseData,
    "Purchase initiated successfully. Complete the transactions to finalize."
  );
}

export const POST = withErrorHandling(withAuth(initiatePurchaseHandler));
