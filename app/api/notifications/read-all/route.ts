import connectDB from "@/lib/db/connect";
import { User } from "@/models/user";
import {
  ApiResponseBuilder,
  withErrorHandling,
  API_MESSAGES,
} from "@/lib";
import { MarkAllReadResponse } from "@/lib/types/notification";
import { withAuth, AuthenticatedUser } from "@/lib/auth/privy-auth";
import { NotificationService } from "@/lib/services/notification-service";

// PUT /api/notifications/read-all - Mark all notifications as read for authenticated user
async function markAllReadHandler(
  request: Request,
  authenticatedUser: AuthenticatedUser
) {
  await connectDB();

  const privyId = authenticatedUser.privyId;
  const user = await (User as any).findByPrivyId(privyId);

  if (!user) {
    return ApiResponseBuilder.notFound(API_MESSAGES.USER_NOT_FOUND);
  }

  try {
    // Mark all notifications as read using the service
    const updatedCount = await NotificationService.markAllAsRead(user._id.toString());

    const response: MarkAllReadResponse = {
      updatedCount,
      message: `${updatedCount} notifications marked as read`,
    };

    return ApiResponseBuilder.success(
      response,
      API_MESSAGES.NOTIFICATIONS_MARKED_READ_SUCCESS
    );
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    return ApiResponseBuilder.error("Failed to mark notifications as read", 500);
  }
}

// Export with authentication and error handling
export const PUT = withErrorHandling(withAuth(markAllReadHandler));
