"use client";

import { useState, useCallback, useEffect } from "react";
import { LoadingState } from "@/components/ui/loading-spinner";
import { ErrorBoundary } from "@/components/ui/error-display";
import { useApiState } from "@/lib/hooks/use-api-state";
import { useAuthenticatedAPI } from "@/lib/hooks/use-authenticated-fetch";

interface Notification {
  _id: string;
  type: "purchase" | "sale" | "rating" | "comment" | "system";
  message: string;
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { data, loading, error, execute } = useApiState<NotificationsResponse>();
  const { get, put } = useAuthenticatedAPI();

  const fetchNotifications = useCallback(async () => {
    await execute(async () => {
      const response = await get("/api/notifications");
      return response.data; // Extract data from ApiResponse wrapper
    });
  }, [execute, get]);

  const markAllAsRead = useCallback(async () => {
    try {
      await put("/api/notifications/read-all", {});
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  }, [put]);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification._id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  // Load notifications on mount
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Update local state when API data changes
  useEffect(() => {
    if (data) {
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    }
  }, [data]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Notifications</h1>
              {unreadCount > 0 && (
                <p className="text-sm text-gray-500">{unreadCount} unread</p>
              )}
            </div>
          </div>

          {/* Wallet Address Display */}
          <div className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600 font-mono">0x1234...bcd</span>
          </div>
        </div>
      </div>

      {/* Mark All Read Button - Below navbar */}
      {unreadCount > 0 && (
        <div className="bg-white px-4 py-3 border-b border-gray-100">
          <div className="flex justify-end">
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 text-sm font-medium text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
            >
              Mark all read
            </button>
          </div>
        </div>
      )}

      {/* Notifications List */}
      <div className="px-4 py-6">
        <LoadingState loading={loading}>
          <ErrorBoundary error={error}>
            <div className="space-y-4">
              {!notifications || notifications.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-5z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h5l-5-5-5 5h5v5z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications yet</h3>
                  <p className="text-gray-500">You'll see updates about your sales, purchases, ratings and comments here.</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <NotificationCard
                    key={notification._id}
                    notification={notification}
                    onMarkAsRead={markAsRead}
                  />
                ))
              )}
            </div>
          </ErrorBoundary>
        </LoadingState>
      </div>
    </div>
  );
}

interface NotificationCardProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}

function NotificationCard({ notification, onMarkAsRead }: NotificationCardProps) {
  const getNotificationStyle = () => {
    switch (notification.type) {
      case "sale":
        return "bg-green-50 border-green-200";
      case "purchase":
        return "bg-blue-50 border-blue-200";
      case "rating":
        return "bg-yellow-50 border-yellow-200";
      case "comment":
        return "bg-purple-50 border-purple-200";
      case "system":
        return "bg-gray-50 border-gray-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  const getTypeIcon = () => {
    switch (notification.type) {
      case "sale":
        return (
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
        );
      case "purchase":
        return (
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
        );
      case "rating":
        return (
          <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
        );
      case "comment":
        return (
          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
        );
      case "system":
        return (
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  // Extract price from sale messages for display
  const extractPriceFromMessage = (message: string, type: string) => {
    if (type === "sale") {
      // For sale messages, show a price on the right
      return "+$124.56"; // This could be extracted from the message or passed separately
    }
    return null;
  };

  const price = extractPriceFromMessage(notification.message, notification.type);

  return (
    <div
      className={`p-4 rounded-xl border ${getNotificationStyle()} ${
        !notification.read ? "ring-2 ring-opacity-20 ring-green-500" : ""
      } cursor-pointer hover:shadow-sm transition-shadow`}
      onClick={() => !notification.read && onMarkAsRead(notification._id)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          {getTypeIcon()}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {!notification.read && (
                <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
              )}
              <p className={`text-sm ${
                !notification.read ? "font-medium text-gray-900" : "text-gray-700"
              }`}>
                {notification.message}
              </p>
            </div>
            <p className="text-xs text-gray-500">
              {formatDate(notification.createdAt)}
            </p>
          </div>
        </div>

        {/* Price display for sale notifications */}
        {price && notification.type === "sale" && (
          <div className="text-right">
            <p className="text-lg font-semibold text-green-600">
              {price}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
