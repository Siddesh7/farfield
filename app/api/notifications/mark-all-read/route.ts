import { Notification } from "@/models/notification";
import connectDB from "@/lib/db/connect";
import {
  ApiResponseBuilder,
  withErrorHandling,
  HTTP_STATUS,
} from "@/lib";
import { withAuth, AuthenticatedUser } from "@/lib/auth/privy-auth";

async function markAllNotificationsAsReadHandler(
  request: Request,
  authenticatedUser: AuthenticatedUser
) {
  await connectDB();
  
  const privyId = authenticatedUser.privyId;

  try {
    const result = await (Notification as any).markAllAsRead(privyId);
    
    return ApiResponseBuilder.success(
      { 
        modifiedCount: result.modifiedCount,
        message: `Marked ${result.modifiedCount} notifications as read`
      },
      "All notifications marked as read"
    );

  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return ApiResponseBuilder.error(
      "Failed to mark all notifications as read",
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}

export const PUT = withErrorHandling(withAuth(markAllNotificationsAsReadHandler));
