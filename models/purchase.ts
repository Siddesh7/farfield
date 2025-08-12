import mongoose, { Schema, Document } from "mongoose";

export interface IPurchase extends Document {
  purchaseId: string;
  buyerFid: number;
  buyerWallet: string;
  items: {
    productId: string;
    price: number; // In USDC (6 decimals)
    sellerFid: number;
    sellerWallet: string;
  }[];
  totalAmount: number; // In USDC (6 decimals) - what user pays
  platformFee: number; // In USDC (6 decimals)
  status: "pending" | "completed" | "failed" | "expired";
  transactionHash?: string;
  blockchainVerified: boolean;
  expiresAt?: Date; // Made optional since completed purchases won't have this
  createdAt: Date;
  completedAt?: Date;
}

const PurchaseItemSchema = new Schema(
  {
    productId: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    sellerFid: { type: Number, required: true },
    sellerWallet: { type: String, required: true },
  },
  { _id: false }
);

const PurchaseSchema = new Schema<IPurchase>(
  {
    purchaseId: {
      type: String,
      required: true,
      unique: true,
    },
    buyerFid: {
      type: Number,
      required: true,
    },
    buyerWallet: {
      type: String,
      required: true,
      index: true,
    },
    items: [PurchaseItemSchema],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    platformFee: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "expired"],
      default: "pending",
      index: true,
    },
    transactionHash: {
      type: String,
      sparse: true,
      index: true,
    },
    blockchainVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: false, // Changed from true to false
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Conditional TTL index - only applies to non-completed purchases
PurchaseSchema.index(
  { expiresAt: 1 }, 
  { 
    expireAfterSeconds: 0,
    partialFilterExpression: { 
      status: { $in: ["pending", "failed", "expired"] }
    }
  }
);

// Index for user purchase history
PurchaseSchema.index({ buyerFid: 1, createdAt: -1 });

// Methods
PurchaseSchema.methods.isExpired = function () {
  return this.expiresAt && Date.now() > this.expiresAt.getTime();
};

PurchaseSchema.methods.markCompleted = function (transactionHash: string) {
  this.status = "completed";
  this.transactionHash = transactionHash;
  this.blockchainVerified = true;
  this.completedAt = new Date();
  // Remove expiresAt so TTL doesn't apply to completed purchases
  this.expiresAt = undefined;
  return this.save();
};

PurchaseSchema.methods.markFailed = function (reason?: string) {
  this.status = "failed";
  // Keep expiresAt so failed purchases can still be cleaned up
  return this.save();
};

// Static methods
PurchaseSchema.statics.findByBuyerFid = function (buyerFid: number) {
  return this.find({ buyerFid }).sort({ createdAt: -1 });
};

PurchaseSchema.statics.findPendingExpired = function () {
  return this.find({
    status: "pending",
    expiresAt: { $lt: new Date() },
  });
};

export const Purchase =
  mongoose.models.Purchase ||
  mongoose.model<IPurchase>("Purchase", PurchaseSchema);
