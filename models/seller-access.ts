import mongoose, { Schema, Document } from "mongoose";

export interface ISellerAccess extends Document {
  fid: number;
  hasAccess: boolean;
}

const SellerAccessSchema = new Schema<ISellerAccess>(
  {
    fid: {
      type: Number,
      required: true,
      unique: true,
      index: true,
      min: 1,
    },
    hasAccess: {
      type: Boolean,
      required: true,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

SellerAccessSchema.statics.findByFid = function (fid: number) {
  return this.findOne({ fid });
};

export const SellerAccess =
  mongoose.models.SellerAccess ||
  mongoose.model<ISellerAccess>("SellerAccess", SellerAccessSchema);

export default SellerAccess;
