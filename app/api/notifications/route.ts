import { Notification } from "@/models/notification";
import { User } from "@/models/user";
import connectDB from "@/lib/db/connect";
import {
  ApiResponseBuilder,
  withErrorHandling,
  RequestValidator,
  API_MESSAGES,
} from "@/lib";
import { NotificationsListResponse } from "@/lib/types/notification";
import { withAuth, AuthenticatedUser } from "@/lib/auth/privy-auth";
import { NotificationService } from "@/lib/services/notification-service";

// GET /api/notifications - Get all notifications for authenticated user
async function getNotificationsHandler(
  request: Request,
  authenticatedUser: AuthenticatedUser
) {
  await connectDB();

  const privyId = authenticatedUser.privyId;
  const user = await (User as any).findByPrivyId(privyId);

  if (!user) {
    return ApiResponseBuilder.notFound(API_MESSAGES.USER_NOT_FOUND);
  }

  // Parse query parameters
  const url = new URL(request.url);
  const limit = url.searchParams.get("limit");

  const validator = new RequestValidator();
  
  // Validate limit if provided
  if (limit) {
    validator.number(parseInt(limit), "limit", 1, 100);
    if (!validator.isValid()) {
      return validator.getErrorResponse()!;
    }
  }

  try {
    // Get notifications using the service
    const result = await NotificationService.getUserNotifications(
      user._id.toString(),
      limit ? parseInt(limit) : undefined
    );

    const response: NotificationsListResponse = {
      notifications: result.notifications,
      unreadCount: result.unreadCount,
    };

    return ApiResponseBuilder.success(
      response,
      API_MESSAGES.NOTIFICATIONS_RETRIEVED_SUCCESS
    );
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return ApiResponseBuilder.error("Failed to fetch notifications", 500);
  }
}

// Export with authentication and error handling
export const GET = withErrorHandling(withAuth(getNotificationsHandler));
