"use client";

import { useState, useCallback } from "react";
import { LoadingState } from "@/components/ui/loading-spinner";
import { ErrorBoundary } from "@/components/ui/error-display";
import { useApiState } from "@/lib/hooks/use-api-state";

interface Notification {
  id: string;
  type: "sale" | "purchase" | "system";
  title: string;
  message: string;
  amount?: number;
  timestamp: Date;
  isRead: boolean;
}

// Mock data for testing - replace with real API call
const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "sale",
    title: "Sale Made!",
    message: "Woohh! You made a sale @piyush bought Product Name",
    amount: 124.56,
    timestamp: new Date(),
    isRead: false,
  },
];

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const { data, loading, error, execute } = useApiState<Notification[]>();

  const fetchNotifications = useCallback(() => {
    execute(async () => {
      // Replace with actual API call
      // const response = await fetch("/api/notifications");
      // return response.json();
      
      // For now, return mock data
      return new Promise(resolve => 
        setTimeout(() => resolve(mockNotifications), 1000)
      );
    });
  }, [execute]);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, isRead: true }
          : notification
      )
    );
  }, []);

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
            <h1 className="text-xl font-semibold text-gray-900">Notifications</h1>
          </div>
          
          {/* Wallet Address Display */}
          <div className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600 font-mono">0x1234...bcd</span>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="px-4 py-6">
        <LoadingState loading={loading}>
          <ErrorBoundary error={error}>
            <div className="space-y-4">
              {notifications.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-5z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h5l-5-5-5 5h5v5z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications yet</h3>
                  <p className="text-gray-500">You'll see updates about your sales and purchases here.</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <NotificationCard
                    key={notification.id}
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
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  const getAmountColor = () => {
    switch (notification.type) {
      case "sale":
        return "text-green-600";
      case "purchase":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div
      className={`p-4 rounded-xl border ${getNotificationStyle()} ${
        !notification.isRead ? "ring-2 ring-opacity-20 ring-green-500" : ""
      }`}
      onClick={() => !notification.isRead && onMarkAsRead(notification.id)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {!notification.isRead && (
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            )}
            <p className={`text-sm font-medium ${
              notification.type === "sale" ? "text-green-700" : "text-gray-700"
            }`}>
              {notification.message}
            </p>
          </div>
        </div>
        
        {notification.amount && (
          <div className={`text-right ${getAmountColor()}`}>
            <p className="text-lg font-semibold">
              {notification.type === "sale" ? "+" : "-"}${notification.amount.toFixed(2)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
