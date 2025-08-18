// Comment types
export type Commentor = {
  farcaster: {
    ownerAddress: string;
    displayName: string;
    username: string;
    pfp: string;
  };
  isVerified: boolean;
  _id: string;
  farcasterFid: number;
  wallets: Array<{
    address: string;
    chainType: string;
    walletClientType: string;
    connectorType: string;
    isPrimary: boolean;
    _id: string;
    id: string;
  }>;
  createdAt: string;
  updatedAt: string;
  __v: number;
  id: string;
};

export type Comment = {
  _id: string;
  commentorFid: number;
  comment: string;
  createdAt: string;
  commentor: Commentor;
};

export type Product = {
  id: string;
  name: string;
  description: string;
  images: string[];
  price: number;
  ratingsScore: number;
  comments: Comment[];
  buyer: {
    fid: number;
    purchasedAt: Date;
  }[];
  buyers?: {
    fid: number;
    purchasedAt: Date;
    name: string;
    username: string;
    pfp: string | null;
  }[];

  // Either digitalFiles OR externalLinks
  hasExternalLinks: boolean; // true = externalLinks, false = digitalFiles
  digitalFiles?: {
    fileName: string;
    fileUrl: string;
    fileSize: number;
    isZip?: boolean;
    originalFiles?: {
      name: string;
      size: number;
      type: string;
    }[];
    originalTotalSize?: number;
    fileCount?: number;
  }[];
  externalLinks?: {
    name: string;
    url: string;
    type: "figma" | "notion" | "behance" | "other";
  }[];

  // Core product info
  creator: {
    fid: number;
    name: string;
    pfp: string;
    username: string;
    isVerified?: boolean;
  };
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
    type: "figma" | "notion" | "behance" | "other";
  }[];

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


// Types for the product access response
export interface ProductAccessResponse {
  productId: string;
  productTitle: string;
  hasAccess: boolean;
  isCreator: boolean;
  hasPurchased: boolean;
  purchaseDetails: {
    purchaseId: string;
    purchasedAt: string;
    pricePaid: number;
    transactionHash: string;
  } | null;
  access: {
    canDownload: boolean;
    canView: boolean;
    canEdit: boolean;
  };
  downloadUrls: Array<{
    fileName: string;
    url: string;
    fileSize: number;
  }> | null;
  externalLinks: Array<{
    name: string;
    url: string;
    type: string;
  }> | null;
  previewFiles: Array<{
    fileName: string;
    url: string;
    fileSize: number;
  }> | null;
  previewLinks: Array<{
    name: string;
    url: string;
    type: string;
  }> | null;
  images: string[];
  creator: {
    fid: number;
    name: string;
    username: string;
    pfp: string | null;
    isSubscribed: boolean;
    isVerified?: boolean;
  } | null;
}

export type CreateProductFormVariables = {
  name: string;
  description: string;
  price: number;
  category: string;
  hasExternalLinks: boolean;
  images: string[];
  digitalFiles: Array<{
      fileName: string;
      fileUrl: string;
      fileSize: number;
      isZip?: boolean;
      originalFiles?: {
        name: string;
        size: number;
        type: string;
      }[];
      originalTotalSize?: number;
      fileCount?: number;
  }>;
  externalLinks: Array<{
      name: string;
      url: string;
      type: string;
  }>;
  tags: string[] | string;
  fileFormat: string[] | string;
  discountPercentage?: number;
  coverImageFile: File | null;  // cover image file
  productFiles: File[]; // product files
  productLink: string;
};