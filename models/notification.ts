import mongoose, { Schema, Document } from "mongoose";
import { NotificationResponse } from "@/lib/types/notification";

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  message: string;
  read: boolean;
  type: "purchase" | "sale" | "rating" | "comment" | "system";
  createdAt: Date;
  updatedAt: Date;

  toPublicJSON(): NotificationResponse;
}

// Mongoose Schema
const NotificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    message: {
      type: String,
      required: true,
      maxlength: 500,
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    type: {
      type: String,
      enum: ["purchase", "sale", "rating", "comment", "system"],
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, read: 1 });
NotificationSchema.index({ createdAt: -1 });

// Methods
NotificationSchema.methods.toPublicJSON = function () {
  const notification = this.toObject();
  return {
    _id: notification._id.toString(),
    message: notification.message,
    read: notification.read,
    type: notification.type,
    createdAt: notification.createdAt.toISOString(),
    updatedAt: notification.updatedAt.toISOString(),
  };
};

// Static methods
NotificationSchema.statics.findByUserId = function (userId: string, limit?: number) {
  const query = this.find({ userId }).sort({ createdAt: -1 });
  return limit ? query.limit(limit) : query;
};

NotificationSchema.statics.markAllAsRead = function (userId: string) {
  return this.updateMany(
    { userId, read: false },
    { read: true }
  );
};

NotificationSchema.statics.getUnreadCount = function (userId: string) {
  return this.countDocuments({ userId, read: false });
};

NotificationSchema.statics.enforceUserLimit = async function (userId: string, limit: number = 100) {
  const count = await this.countDocuments({ userId });
  if (count > limit) {
    const excess = count - limit;
    const oldestNotifications = await this.find({ userId })
      .sort({ createdAt: 1 })
      .limit(excess)
      .select('_id');
    
    const ids = oldestNotifications.map((n: any) => n._id);
    await this.deleteMany({ _id: { $in: ids } });
  }
};

// Force model recreation if schema changed
if (mongoose.models.Notification) {
  delete mongoose.models.Notification;
}

// Export the model
export const Notification = mongoose.model<INotification>("Notification", NotificationSchema);

export default Notification;
