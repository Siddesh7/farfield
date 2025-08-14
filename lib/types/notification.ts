// Notification API Response Types
export interface NotificationResponse {
  _id: string;
  message: string;
  read: boolean;
  type: "purchase" | "sale" | "rating" | "comment" | "system";
  createdAt: string;
  updatedAt: string;
}

// Service types for creating notifications
export interface CreateNotificationRequest {
  userId: string;
  message: string;
  type: "purchase" | "sale" | "rating" | "comment" | "system";
}

export interface NotificationEventData {
  productId: string;
  productName: string;
  buyerFid: number;
  sellerFid: number;
  price: number;
}

export interface RatingEventData {
  productId: string;
  productName: string;
  raterFid: number;
  creatorFid: number;
  rating: number;
}

export interface CommentEventData {
  productId: string;
  productName: string;
  commenterFid: number;
  creatorFid: number;
  comment: string;
}

// API Response types
export interface NotificationsListResponse {
  notifications: NotificationResponse[];
  unreadCount: number;
}

export interface MarkAllReadResponse {
  updatedCount: number;
  message: string;
}
  