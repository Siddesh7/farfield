import { useState, useCallback, useEffect } from "react";
import { useApiState } from "./use-api-state";
import { useAuthenticatedAPI } from "./use-authenticated-fetch";
import type { NotificationResponse, NotificationsListResponse } from "@/lib/types/notification";

interface UseNotificationsReturn {
  // State
  notifications: NotificationResponse[];
  unreadCount: number;
  loading: boolean;
  error: string | null;

  // Actions
  fetchNotifications: () => Promise<void>;
  markAllAsRead: () => Promise<void>;
  markAsRead: (notificationId: string) => void;
  clearError: () => void;
  refresh: () => Promise<void>;
}

/**
 * Custom hook for notifications management
 * Follows standardized API state management patterns
 */
export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { data, loading, error, execute, clearError } = useApiState<NotificationsListResponse>();
  const { get, put } = useAuthenticatedAPI();

  const fetchNotifications = useCallback(async () => {
    await execute(async () => {
      const response = await get("/api/notifications");
      return response.data;
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

  const refresh = useCallback(async () => {
    await fetchNotifications();
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAllAsRead,
    markAsRead,
    clearError,
    refresh,
  };
}
