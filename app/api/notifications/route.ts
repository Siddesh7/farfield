import { Notification } from "@/models/notification";
import connectDB from "@/lib/db/connect";
import {
  ApiResponseBuilder,
  withErrorHandling,
  HTTP_STATUS,
} from "@/lib";
import { withAuth, AuthenticatedUser } from "@/lib/auth/privy-auth";

async function getNotificationsHandler(
  request: Request,
  authenticatedUser: AuthenticatedUser
) {
  await connectDB();
  
  const privyId = authenticatedUser.privyId;
  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "100"), 100);

  try {
    // Get notifications for the user
    const notifications = await (Notification as any).getForUser(privyId, limit);
    
    // Get unread count
    const unreadCount = await (Notification as any).getUnreadCount(privyId);

    return ApiResponseBuilder.success({
      notifications: notifications.map((notification: any) => ({
        id: notification._id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        read: notification.read,
        createdAt: notification.createdAt,
      })),
      unreadCount,
      total: notifications.length,
    }, "Notifications retrieved successfully");

  } catch (error) {
    console.error("Error fetching notifications:", error);
    return ApiResponseBuilder.error(
      "Failed to fetch notifications",
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}

export const GET = withErrorHandling(withAuth(getNotificationsHandler));
