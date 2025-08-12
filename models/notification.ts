import mongoose, { Schema, Document } from "mongoose";

export interface INotification extends Document {
  userId: string; // privyId of the user
  type: "purchase_buyer" | "purchase_seller";
  title: string;
  message: string;
  data: {
    purchaseId: string;
    productName?: string;
    amount?: number;
    buyerUsername?: string;
    sellerUsername?: string;
  };
  read: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["purchase_buyer", "purchase_seller"],
      required: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 100,
    },
    message: {
      type: String,
      required: true,
      maxlength: 500,
    },
    data: {
      purchaseId: { type: String, required: true },
      productName: { type: String },
      amount: { type: Number },
      buyerUsername: { type: String },
      sellerUsername: { type: String },
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries (user + timestamp)
NotificationSchema.index({ userId: 1, createdAt: -1 });

// Compound index for unread notifications
NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

// Static method to maintain max 100 notifications per user
NotificationSchema.statics.createWithLimit = async function (
  notificationData: Partial<INotification>
) {
  const notification = new this(notificationData);
  await notification.save();

  // Keep only the latest 100 notifications for this user
  const notifications = await this.find({ userId: notificationData.userId })
    .sort({ createdAt: -1 })
    .skip(100);

  if (notifications.length > 0) {
    const idsToDelete = notifications.map((n: any) => n._id);
    await this.deleteMany({ _id: { $in: idsToDelete } });
  }

  return notification;
};

// Static method to get notifications for a user
NotificationSchema.statics.getForUser = function (
  userId: string,
  limit: number = 100
) {
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to get unread count
NotificationSchema.statics.getUnreadCount = function (userId: string) {
  return this.countDocuments({ userId, read: false });
};

// Static method to mark notification as read
NotificationSchema.statics.markAsRead = function (
  notificationId: string,
  userId: string
) {
  return this.updateOne(
    { _id: notificationId, userId },
    { read: true }
  );
};

// Static method to mark all as read
NotificationSchema.statics.markAllAsRead = function (userId: string) {
  return this.updateMany(
    { userId, read: false },
    { read: true }
  );
};

export const Notification =
  mongoose.models.Notification ||
  mongoose.model<INotification>("Notification", NotificationSchema);
