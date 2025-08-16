import mongoose, { Schema, Document } from "mongoose";

export interface IProduct extends Document {
  name: string;
  description: string;
  images: string[];
  price: number;
  ratingsScore: number;
  comments: {
    commentorFid: number;
    comment: string;
    createdAt: Date;
  }[];
  buyer: {
    fid: number;
    purchasedAt: Date;
  }[];

  // Either digitalFiles OR externalLinks
  hasExternalLinks: boolean; // true = externalLinks, false = digitalFiles
  digitalFiles?: {
    fileName: string;
    fileUrl: string;
    fileSize: number;
  }[];
  externalLinks?: {
    name: string;
    url: string;
    type: "figma" | "notion" | "behance" | "other";
  }[];

  // Core product info
  creatorFid: number;
  slug?: string;
  category: string;
  tags?: string[];

  // Business logic
  isFree: boolean;
  totalSold: number;
  fileSize?: number;
  fileFormat?: string[];

  // Preview
  previewAvailable: boolean;
  previewFiles?: {
    fileName: string;
    fileUrl: string;
    fileSize: number;
  }[];
  previewLinks?: {
    name: string;
    url: string;
    type: "figma" | "notion" | "behance" | "github" | "other";
  }[];

  // Discount
  discountPercentage?: number;

  // Timestamps
  publishedAt?: Date;

  // Ratings
  totalRatings: number;
  ratingsBreakdown: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

// Comment sub-schema
const CommentSchema = new Schema({
  commentorFid: { type: Number, required: true },
  comment: { type: String, required: true, maxlength: 1000 },
  createdAt: { type: Date, default: Date.now },
});

// Buyer sub-schema
const BuyerSchema = new Schema({
  fid: { type: Number, required: true },
  purchasedAt: { type: Date, default: Date.now },
});

// Digital files sub-schema
const DigitalFileSchema = new Schema({
  fileName: { type: String, required: true },
  fileUrl: { type: String, required: true },
  fileSize: { type: Number, required: true },
});

// External links sub-schema
const ExternalLinkSchema = new Schema({
  name: { type: String, required: true },
  url: { type: String, required: true },
  type: {
    type: String,
    enum: ["figma", "notion", "behance", "github", "other"],
    required: true,
  },
});

// Ratings breakdown sub-schema
const RatingsBreakdownSchema = new Schema(
  {
    1: { type: Number, default: 0 },
    2: { type: Number, default: 0 },
    3: { type: Number, default: 0 },
    4: { type: Number, default: 0 },
    5: { type: Number, default: 0 },
  },
  { _id: false }
);

// Mongoose Schema
const ProductSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      maxlength: 5000,
    },
    images: [
      {
        type: String,
        required: true,
      },
    ],
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    ratingsScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    comments: [CommentSchema],
    buyer: [BuyerSchema],

    // Either digitalFiles OR externalLinks
    hasExternalLinks: {
      type: Boolean,
      required: true,
    },
    digitalFiles: [DigitalFileSchema],
    externalLinks: [ExternalLinkSchema],

    // Core product info
    creatorFid: {
      type: Number,
      required: true,
    },
    slug: {
      type: String,
      unique: true,
      sparse: true,
    },
    category: {
      type: String,
      required: true,
    },
    tags: [
      {
        type: String,
      },
    ],

    // Business logic
    isFree: {
      type: Boolean,
      default: false,
    },
    totalSold: {
      type: Number,
      default: 0,
      min: 0,
    },
    fileSize: {
      type: Number,
      min: 0,
    },
    fileFormat: [
      {
        type: String,
      },
    ],

    // Preview
    previewAvailable: {
      type: Boolean,
      default: false,
    },
    previewFiles: [DigitalFileSchema],
    previewLinks: [ExternalLinkSchema],

    // Discount
    discountPercentage: {
      type: Number,
      min: 0,
      max: 100,
    },

    // Timestamps
    publishedAt: {
      type: Date,
    },

    // Ratings
    totalRatings: {
      type: Number,
      default: 0,
      min: 0,
    },
    ratingsBreakdown: {
      type: RatingsBreakdownSchema,
      default: () => ({
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      }),
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
ProductSchema.index({ creatorFid: 1 });
ProductSchema.index({ category: 1 });
ProductSchema.index({ isFree: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ ratingsScore: -1 });
ProductSchema.index({ totalSold: -1 });
ProductSchema.index({ createdAt: -1 });
ProductSchema.index({ publishedAt: -1 });
ProductSchema.index({ tags: 1 });
ProductSchema.index({ name: "text", description: "text" });
ProductSchema.index({ "buyer.fid": 1 });

// Compound indexes for common queries
ProductSchema.index({ creatorFid: 1, createdAt: -1 });
ProductSchema.index({ isFree: 1, ratingsScore: -1 });

// Validation: Ensure either digitalFiles OR externalLinks, but not both
ProductSchema.pre("save", function (next) {
  const hasDigitalFiles = this.digitalFiles && this.digitalFiles.length > 0;
  const hasExternalLinksContent =
    this.externalLinks && this.externalLinks.length > 0;

  if (hasDigitalFiles && hasExternalLinksContent) {
    next(new Error("Product cannot have both digitalFiles and externalLinks"));
  } else if (!hasDigitalFiles && !hasExternalLinksContent) {
    next(new Error("Product must have either digitalFiles or externalLinks"));
  } else {
    // Ensure the boolean flag matches the content
    if (hasExternalLinksContent && !this.hasExternalLinks) {
      next(
        new Error(
          "hasExternalLinks must be true when externalLinks are provided"
        )
      );
    } else if (hasDigitalFiles && this.hasExternalLinks) {
      next(
        new Error(
          "hasExternalLinks must be false when digitalFiles are provided"
        )
      );
    } else {
      next();
    }
  }
});

// Validation: Preview file/link should only exist if previewAvailable is true
ProductSchema.pre("save", function (next) {
  const hasPreviewFiles =
    Array.isArray(this.previewFiles) && this.previewFiles.length > 0;
  const hasPreviewLinks =
    Array.isArray(this.previewLinks) && this.previewLinks.length > 0;
  if ((hasPreviewFiles || hasPreviewLinks) && !this.previewAvailable) {
    return next(
      new Error(
        "Preview file/link can only be set when previewAvailable is true"
      )
    );
  }
  next();
});

// Methods
ProductSchema.methods.toPublicJSON = function () {
  const product = this.toObject();
  return product;
};

ProductSchema.methods.addComment = function (
  commentorFid: number,
  comment: string
) {
  this.comments.push({
    commentorFid,
    comment,
    createdAt: new Date(),
  });
  return this.save();
};

ProductSchema.methods.addRating = function (rating: number) {
  if (rating < 1 || rating > 5) {
    throw new Error("Rating must be between 1 and 5");
  }

  // Ensure ratingsBreakdown is properly initialized
  if (!this.ratingsBreakdown || typeof this.ratingsBreakdown !== 'object') {
    this.ratingsBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  }

  // Ensure all rating levels exist
  for (let i = 1; i <= 5; i++) {
    if (typeof this.ratingsBreakdown[i] !== 'number') {
      this.ratingsBreakdown[i] = 0;
    }
  }

  // Ensure totalRatings is a number
  if (typeof this.totalRatings !== 'number' || isNaN(this.totalRatings)) {
    this.totalRatings = 0;
  }

  this.ratingsBreakdown[rating]++;
  this.totalRatings++;

  // Recalculate average rating with safer calculation
  let totalScore = 0;
  for (let star = 1; star <= 5; star++) {
    const count = this.ratingsBreakdown[star] || 0;
    totalScore += star * count;
  }

  // Prevent division by zero
  this.ratingsScore = this.totalRatings > 0 ? totalScore / this.totalRatings : 0;

  return this.save();
};

ProductSchema.methods.recordPurchase = function (buyerFid: number) {
  const existingBuyer = this.buyer.find((b: any) => b.fid === buyerFid);
  if (!existingBuyer) {
    this.buyer.push({
      fid: buyerFid,
      purchasedAt: new Date(),
    });
    this.totalSold += 1;
  }
  return this.save();
};

// Static methods
ProductSchema.statics.findByCreatorFid = function (creatorFid: number) {
  return this.find({ creatorFid });
};

ProductSchema.statics.findByCategory = function (category: string) {
  return this.find({ category });
};

ProductSchema.statics.findBySlug = function (slug: string) {
  return this.findOne({ slug });
};

ProductSchema.statics.findFreeProducts = function () {
  return this.find({ isFree: true });
};

ProductSchema.statics.findByPriceRange = function (
  minPrice: number,
  maxPrice: number
) {
  return this.find({ price: { $gte: minPrice, $lte: maxPrice } });
};

// Export the model
export const Product =
  mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);

export default Product;
