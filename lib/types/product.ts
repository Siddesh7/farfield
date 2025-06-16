export type Product = {
  _id?: string;
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
  previewFile?: string;
  previewLink?: string;

  // Discount
  discountPercentage?: number;

  // Timestamps
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Ratings
  totalRatings: number;
  ratingsBreakdown: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
};
