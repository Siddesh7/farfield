import mongoose, { Schema, Document } from "mongoose";

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
  wallet: {
    address: string;
    chainType: string;
    walletClientType: string;
    connectorType: string;
  };
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
    wallet: {
      address: { type: String, required: true },
      chainType: { type: String, required: true },
      walletClientType: { type: String, required: true },
      connectorType: { type: String, required: true },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
UserSchema.index({ privyId: 1 }, { unique: true });
UserSchema.index({ farcasterFid: 1 }, { unique: true });
UserSchema.index({ "farcaster.username": 1 }, { unique: true });
UserSchema.index({ "wallet.address": 1 });

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
  return this.findOne({ "wallet.address": address });
};

UserSchema.statics.findByUsername = function (username: string) {
  return this.findOne({ "farcaster.username": username });
};

// Export the model
export const User =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
