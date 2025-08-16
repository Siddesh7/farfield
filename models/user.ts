import mongoose, { Schema, Document } from "mongoose";
import { UserResponse } from "@/lib/types/user";

export interface IUser extends Document {
  privyId: string;
  farcasterFid: number;
  farcaster: {
    ownerAddress: string;
    displayName: string;
    username: string;
    bio?: string;
    pfp?: string;
  };
  wallets: Array<{
    address: string;
    chainType?: string;
    walletClientType?: string;
    connectorType?: string;
    isPrimary?: boolean;
  }>;
  isVerified: boolean;
  verificationCheckedAt?: Date;
  toPublicJSON(): UserResponse;
}

// Mongoose Schema
const UserSchema = new Schema<IUser>(
  {
    privyId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    farcasterFid: {
      type: Number,
      required: true,
      index: true,
    },
    farcaster: {
      ownerAddress: { type: String, required: true },
      displayName: { type: String, required: true },
      username: { type: String, required: true, unique: true },
      bio: { type: String, maxlength: 500 },
      pfp: { type: String },
    },
    wallets: [
      {
        address: { type: String, required: true },
        chainType: { type: String },
        walletClientType: { type: String },
        connectorType: { type: String },
        isPrimary: { type: Boolean, default: false },
      },
    ],
    isVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    verificationCheckedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Post-save middleware to check verification status
UserSchema.post('save', async function(doc) {
  // Only run for new documents (when isNew was true before save)
  if (this.isNew && !doc.verificationCheckedAt) {
    try {
      // Import here to avoid circular dependencies
      const { checkAndUpdateUserVerification } = await import('@/lib/neynar');
      
      // Run async without blocking
      setImmediate(async () => {
        try {
          await checkAndUpdateUserVerification(doc.farcasterFid);
        } catch (error) {
          console.error(`Failed to check verification for user ${doc.farcasterFid}:`, error);
        }
      });
    } catch (error) {
      console.error('Error importing neynar verification utility:', error);
    }
  }
});

// Methods
UserSchema.methods.toPublicJSON = function () {
  const user = this.toObject();
  delete user.privyId;
  return user;
};

// Static methods
UserSchema.statics.findByPrivyId = function (privyId: string) {
  return this.findOne({ privyId });
};

UserSchema.statics.findByFarcasterFid = function (farcasterFid: number) {
  return this.findOne({ farcasterFid });
};

UserSchema.statics.findByWalletAddress = function (address: string) {
  return this.findOne({ "wallets.address": address });
};

UserSchema.statics.findByUsername = function (username: string) {
  return this.findOne({ "farcaster.username": username });
};

// Force model recreation if schema changed
if (mongoose.models.User) {
  delete mongoose.models.User;
}

// Export the model
export const User = mongoose.model<IUser>("User", UserSchema);

export default User;
