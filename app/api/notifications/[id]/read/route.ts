import { Notification } from "@/models/notification";
import connectDB from "@/lib/db/connect";
import {
  ApiResponseBuilder,
  withErrorHandling,
  HTTP_STATUS,
} from "@/lib";
import { withAuth, AuthenticatedUser } from "@/lib/auth/privy-auth";

async function markNotificationAsReadHandler(
  request: Request,
  authenticatedUser: AuthenticatedUser,
  { params }: { params: { id: string } }
) {
  await connectDB();
  
  const privyId = authenticatedUser.privyId;
  const notificationId = params.id;

  try {
    const result = await (Notification as any).markAsRead(notificationId, privyId);
    
    if (result.matchedCount === 0) {
      return ApiResponseBuilder.notFound("Notification not found");
    }

    return ApiResponseBuilder.success(
      { notificationId, read: true },
      "Notification marked as read"
    );

  } catch (error) {
    console.error("Error marking notification as read:", error);
    return ApiResponseBuilder.error(
      "Failed to mark notification as read",
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}

export const PUT = withErrorHandling(withAuth(markNotificationAsReadHandler));
