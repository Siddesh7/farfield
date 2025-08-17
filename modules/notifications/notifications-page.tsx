"use client";

import { LoadingState } from "@/components/ui/loading-spinner";
import { ErrorBoundary } from "@/components/ui/error-display";
import { useNotifications } from "@/lib/hooks/use-notifications";
import { cn } from "@/lib/utils";
import { BoxContainer } from "@/components/common";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import type { NotificationResponse } from "@/lib/types/notification";

export function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAllAsRead,
    markAsRead,
    clearError,
    refresh,
  } = useNotifications();

  return (
    <BoxContainer className='relative flex flex-1 flex-col pt-22 px-5.5'>
      <div className="pt-4.5 flex flex-col flex-1 gap-4 pb-28">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-awesome text-black">Notifications</h1>
          {notifications && notifications.length > 0 && unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-sm text-[#00000052] hover:text-black transition-colors"
            >
              Mark all as read
            </button>
          )}
        </div>

        <ScrollArea className="rounded-md flex-1 min-h-0 overflow-y-auto pr-3">
          <div className="flex flex-col gap-4">
            <LoadingState loading={loading} text="Loading notifications...">
              <ErrorBoundary 
                error={error}
                onRetry={refresh}
                onClear={clearError}
              >
                {!notifications || notifications.length === 0 ? (
                  <div className='flex flex-col gap-2 items-center justify-center py-12'>
                    <h3 className="text-center font-awesome text-2xl">No notifications yet</h3>
                    <p className='text-[#00000052] text-sm'>You'll see updates about products here</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notifications.map((notification) => (
                      <NotificationCard
                        key={notification._id}
                        notification={notification}
                        onMarkAsRead={markAsRead}
                      />
                    ))}
                  </div>
                )}
              </ErrorBoundary>
            </LoadingState>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </BoxContainer>
  );
}

interface NotificationCardProps {
  notification: NotificationResponse;
  onMarkAsRead: (notificationId: string) => void;
}

function NotificationCard({ notification, onMarkAsRead }: NotificationCardProps) {
  const extractPriceFromMessage = (message: string, type: string) => {
    if (type === "sale") {
      const priceMatch = message.match(/\$?(\d+(?:\.\d{2})?)/);
      return priceMatch ? `+$${priceMatch[1]}` : null;
    }
    return null;
  };

  const price = extractPriceFromMessage(notification.message, notification.type);
  const isUnread = !notification.read;

  return (
    <div
      className={cn(
        "p-4 rounded-[16px] border transition-all cursor-pointer",
        // Unread notifications - vibrant green colors
        isUnread && [
          "bg-[#0ED0650D]", // 5% opacity background
          "border-[#0ED06566]" // 40% opacity border
        ],
        // Read notifications - gray disabled appearance
        !isUnread && [
          "bg-gray-50", // Light gray background
          "border-gray-200", // Gray border
          "opacity-75" // Slightly faded overall
        ]
      )}
      onClick={() => !notification.read && onMarkAsRead(notification._id)}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 flex items-center gap-2">
          {/* Unread indicator dot */}
          {isUnread && (
            <div className="w-2 h-2 bg-[#0ED065] rounded-full flex-shrink-0"></div>
          )}
          
          <p className={cn(
            "text-sm font-medium leading-relaxed",
            // Unread notifications - full green color
            isUnread && "text-[#0ED065]",
            // Read notifications - gray disabled text
            !isUnread && "text-gray-500"
          )}>
            {notification.message}
          </p>
        </div>

        {/* Price display for sale notifications */}
        {price && notification.type === "sale" && (
          <div className="ml-4">
            <p className={cn(
              "text-sm font-medium",
              // Unread notifications - full green color
              isUnread && "text-[#0ED065]",
              // Read notifications - gray disabled text
              !isUnread && "text-gray-500"
            )}>
              {price}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
