import { Purchase } from "@/models/purchase";
import { User } from "@/models/user";
import connectDB from "@/lib/db/connect";
import { farfieldContract, transactionUtils } from "@/lib/blockchain/client";
import {
  ApiResponseBuilder,
  withErrorHandling,
  RequestValidator,
  HTTP_STATUS,
} from "@/lib";
import { withAuth, AuthenticatedUser } from "@/lib/auth/privy-auth";
import { Product } from "@/models/product";

interface ConfirmPurchaseRequest {
  purchaseId: string;
  transactionHash: string;
}

async function confirmPurchaseHandler(
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
  const body: ConfirmPurchaseRequest = validator.body;
  validator
    .required(body.purchaseId, "purchaseId")
    .string(body.purchaseId, "purchaseId", 1, 100)
    .required(body.transactionHash, "transactionHash")
    .string(body.transactionHash, "transactionHash", 66, 66);
  if (!validator.isValid()) {
    return validator.getErrorResponse()!;
  }
  if (!/^0x[a-fA-F0-9]{64}$/.test(body.transactionHash)) {
    return ApiResponseBuilder.error(
      "Invalid transaction hash",
      HTTP_STATUS.BAD_REQUEST
    );
  }

  // Find the purchase
  const purchase = await Purchase.findOne({
    purchaseId: body.purchaseId,
    buyerFid: fid,
  });
  if (!purchase) {
    return ApiResponseBuilder.notFound("Purchase not found");
  }
  if (purchase.status === "completed") {
    return ApiResponseBuilder.success(
      {
        purchaseId: body.purchaseId,
        status: "completed",
        completedAt: purchase.completedAt,
      },
      "Purchase already completed"
    );
  }
  if (purchase.isExpired()) {
    purchase.status = "expired";
    await purchase.save();
    return ApiResponseBuilder.error(
      "Purchase has expired. Please initiate a new purchase.",
      HTTP_STATUS.BAD_REQUEST
    );
  }
  // Check if transaction was successful
  const isSuccessful = await transactionUtils.isTransactionSuccessful(
    body.transactionHash as `0x${string}`
  );
  if (!isSuccessful) {
    purchase.status = "failed";
    purchase.transactionHash = body.transactionHash;
    await purchase.save();
    return ApiResponseBuilder.error(
      "Transaction failed or was reverted",
      HTTP_STATUS.BAD_REQUEST
    );
  }
  // Verify purchase on smart contract
  const onChainPurchase = await farfieldContract.verifyPurchase(
    body.purchaseId
  );
  if (!onChainPurchase.exists) {
    return ApiResponseBuilder.error(
      "Purchase not found on blockchain",
      HTTP_STATUS.BAD_REQUEST
    );
  }
  if (
    onChainPurchase.buyer.toLowerCase() !== purchase.buyerWallet.toLowerCase()
  ) {
    return ApiResponseBuilder.error(
      "Buyer address mismatch",
      HTTP_STATUS.BAD_REQUEST
    );
  }
  // Verify amount matches (allowing small rounding differences)
  const onChainAmountInDollars = Number(onChainPurchase.totalAmount) / 1000000;
  const purchaseAmountInDollars = purchase.totalAmount;
  const amountDifference = Math.abs(
    onChainAmountInDollars - purchaseAmountInDollars
  );
  if (amountDifference > 0.01) {
    return ApiResponseBuilder.error(
      "Purchase amount mismatch",
      HTTP_STATUS.BAD_REQUEST
    );
  }
  if (onChainPurchase.refunded) {
    purchase.status = "failed";
    purchase.transactionHash = body.transactionHash;
    await purchase.save();
    return ApiResponseBuilder.error(
      "This purchase has been refunded",
      HTTP_STATUS.BAD_REQUEST
    );
  }
  // Mark purchase as completed
  await purchase.markCompleted(body.transactionHash);
  
  // Update totalSold for each purchased product
  for (const item of purchase.items) {
    await Product.findByIdAndUpdate(
      item.productId,
      { $inc: { totalSold: 1 } },
      { new: true }
    );
  }
  
  // Prepare response
  const responseData = {
    purchaseId: body.purchaseId,
    status: "completed",
    transactionHash: body.transactionHash,
    completedAt: purchase.completedAt,
    items: purchase.items.map((item: any) => ({
      productId: item.productId,
      price: item.price / 1000000,
    })),
    totalAmount: purchase.totalAmount,
    platformFee: purchase.platformFee,
    blockchain: {
      blockchainTimestamp: Number(onChainPurchase.timestamp),
      verified: true,
    },
  };
  return ApiResponseBuilder.success(
    responseData,
    "Purchase confirmed successfully. You now have access to the purchased products."
  );
}

export const POST = withErrorHandling(withAuth(confirmPurchaseHandler));
