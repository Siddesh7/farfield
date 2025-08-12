import { Notification } from "@/models/notification";
import { User } from "@/models/user";
import { Product } from "@/models/product";

interface PurchaseNotificationData {
  purchaseId: string;
  buyerFid: number;
  items: Array<{
    productId: string;
    sellerFid: number;
    price: number;
  }>;
  totalAmount: number;
}

export class NotificationService {
  /**
   * Create notifications for a completed purchase
   */
  static async createPurchaseNotifications(
    purchaseData: PurchaseNotificationData
  ) {
    try {
      // Get buyer and seller user data
      const buyerUser = await (User as any).findByFarcasterFid(
        purchaseData.buyerFid
      );
      if (!buyerUser) {
        console.error("Buyer user not found for notification");
        return;
      }

      // Get product details and seller users
      const productIds = purchaseData.items.map((item) => item.productId);
      const products = await Product.find({ _id: { $in: productIds } });
      
      const sellerFids = [...new Set(purchaseData.items.map(item => item.sellerFid))];
      const sellerUsers = await User.find({ farcasterFid: { $in: sellerFids } });
      const sellerUserMap = new Map(
        sellerUsers.map(user => [user.farcasterFid, user])
      );

      // Create buyer notification
      const productNames = products.map((p) => p.name).join(", ");
      const buyerNotification = {
        userId: buyerUser.privyId,
        type: "purchase_buyer" as const,
        title: "Purchase Confirmed! 🎉",
        message: `Your purchase of ${productNames} has been confirmed. You can now access your products.`,
        data: {
          purchaseId: purchaseData.purchaseId,
          productName: productNames,
          amount: purchaseData.totalAmount,
        },
        read: false,
      };

      await (Notification as any).createWithLimit(buyerNotification);

      // Create seller notifications (one per seller)
      for (const sellerFid of sellerFids) {
        const sellerUser = sellerUserMap.get(sellerFid);
        if (!sellerUser) {
          console.error(`Seller user not found for FID: ${sellerFid}`);
          continue;
        }

        // Get products sold by this seller in this purchase
        const sellerProducts = products.filter(p => p.creatorFid === sellerFid);
        const sellerProductNames = sellerProducts.map(p => p.name).join(", ");
        const sellerAmount = purchaseData.items
          .filter(item => item.sellerFid === sellerFid)
          .reduce((sum, item) => sum + (item.price / 1000000), 0); // Convert from USDC units

        const sellerNotification = {
          userId: sellerUser.privyId,
          type: "purchase_seller" as const,
          title: "You made a sale! 💰",
          message: `${buyerUser.farcaster?.username || `User ${purchaseData.buyerFid}`} purchased ${sellerProductNames} for $${sellerAmount.toFixed(2)}.`,
          data: {
            purchaseId: purchaseData.purchaseId,
            productName: sellerProductNames,
            amount: sellerAmount,
            buyerUsername: buyerUser.farcaster?.username || `User ${purchaseData.buyerFid}`,
          },
          read: false,
        };

        await (Notification as any).createWithLimit(sellerNotification);
      }

      console.log(`✅ Created notifications for purchase: ${purchaseData.purchaseId}`);
    } catch (error) {
      console.error("❌ Failed to create purchase notifications:", error);
      // Don't throw error to avoid breaking the purchase flow
    }
  }
}
