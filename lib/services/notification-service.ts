import { Notification } from "@/models/notification";
import { User } from "@/models/user";
import connectDB from "@/lib/db/connect";
import { 
  CreateNotificationRequest, 
  NotificationEventData, 
  RatingEventData, 
  CommentEventData 
} from "@/lib/types/notification";

export class NotificationService {
  /**
   * Create a new notification for a user
   */
  static async createNotification(data: CreateNotificationRequest): Promise<void> {
    await connectDB();
    
    try {
      // Enforce user notification limit before creating new notification
      await (Notification as any).enforceUserLimit(data.userId, 100);
      
      // Create new notification
      const notification = new Notification(data);
      await notification.save();
      
      console.log(`Notification created for user ${data.userId}: ${data.message}`);
    } catch (error) {
      console.error("Error creating notification:", error);
      // Don't throw error to avoid breaking the main flow
    }
  }

  /**
   * Handle purchase event - creates notifications for both buyer and seller
   */
  static async handlePurchaseEvent(eventData: NotificationEventData): Promise<void> {
    await connectDB();
    
    try {
      // Get buyer and seller users
      const [buyer, seller] = await Promise.all([
        (User as any).findByFarcasterFid(eventData.buyerFid),
        (User as any).findByFarcasterFid(eventData.sellerFid),
      ]);

      if (!buyer || !seller) {
        console.error("Could not find buyer or seller for notification");
        return;
      }

      // Create notifications for both parties with engaging messages
      const notifications = [
        {
          userId: buyer._id.toString(),
          message: `You purchased ${eventData.productName}`,
          type: "purchase" as const,
        },
        {
          userId: seller._id.toString(),
          message: `Woohh! You made a sale @${buyer.farcaster.username} bought ${eventData.productName}`,
          type: "sale" as const,
        },
      ];

      // Create notifications in parallel
      await Promise.all(
        notifications.map(notification => this.createNotification(notification))
      );
    } catch (error) {
      console.error("Error handling purchase event:", error);
    }
  }

  /**
   * Handle rating event - creates notification for product creator
   */
  static async handleRatingEvent(eventData: RatingEventData): Promise<void> {
    await connectDB();
    
    try {
      // Get rater and creator users
      const [rater, creator] = await Promise.all([
        (User as any).findByFarcasterFid(eventData.raterFid),
        (User as any).findByFarcasterFid(eventData.creatorFid),
      ]);

      if (!rater || !creator) {
        console.error("Could not find rater or creator for notification");
        return;
      }

      // Don't notify if creator rates their own product
      if (eventData.raterFid === eventData.creatorFid) {
        return;
      }

      // Create notification for creator
      const stars = "⭐".repeat(eventData.rating);
      const notification = {
        userId: creator._id.toString(),
        message: `${stars} @${rater.farcaster.username} rated your product "${eventData.productName}" ${eventData.rating} star${eventData.rating > 1 ? 's' : ''}!`,
        type: "rating" as const,
      };

      await this.createNotification(notification);
    } catch (error) {
      console.error("Error handling rating event:", error);
    }
  }

  /**
   * Handle comment event - creates notification for product creator
   */
  static async handleCommentEvent(eventData: CommentEventData): Promise<void> {
    await connectDB();
    
    try {
      // Get commenter and creator users
      const [commenter, creator] = await Promise.all([
        (User as any).findByFarcasterFid(eventData.commenterFid),
        (User as any).findByFarcasterFid(eventData.creatorFid),
      ]);

      if (!commenter || !creator) {
        console.error("Could not find commenter or creator for notification");
        return;
      }

      // Don't notify if creator comments on their own product
      if (eventData.commenterFid === eventData.creatorFid) {
        return;
      }

      // Create notification for creator
      const notification = {
        userId: creator._id.toString(),
        message: `💬 @${commenter.farcaster.username} commented on your product "${eventData.productName}"`,
        type: "comment" as const,
      };

      await this.createNotification(notification);
    } catch (error) {
      console.error("Error handling comment event:", error);
    }
  }

  /**
   * Get notifications for a user
   */
  static async getUserNotifications(userId: string, limit?: number) {
    await connectDB();
    
    const notifications = await (Notification as any).findByUserId(userId, limit);
    const unreadCount = await (Notification as any).getUnreadCount(userId);
    
    return {
      notifications: notifications.map((n: any) => n.toPublicJSON()),
      unreadCount,
    };
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: string) {
    await connectDB();
    
    const result = await (Notification as any).markAllAsRead(userId);
    return result.modifiedCount;
  }
}
