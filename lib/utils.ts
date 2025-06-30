import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Product } from "./types/product";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const trimAddress = (address: string | undefined, length: number) => {
  if (!address) return null;
  if (!address || address.length < 10) return address;
  return `${address.slice(0, length)}....${address.slice(-length)}`;
}

export const FeaturedProducts: Product[] = [
  {
    _id: "1",
    name: "Cool Background NCS Music with rock and pop by the best artist",
    description: "Porem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis Porem ipsum dolor sit amet, consectetur adipisit. Nunc vulputate.",
    images: ["https://example.com/uikit-preview.png"],
    price: 124.56,
    ratingsScore: 4.8,
    comments: [
      {
        commentorFid: 1001,
        comment: "This was super helpful for my project!",
        createdAt: new Date("2025-05-01T12:00:00Z")
      }
    ],
    buyer: [
      {
        fid: 1001,
        purchasedAt: new Date("2025-05-01T11:59:00Z")
      }
    ],
    hasExternalLinks: false,
    digitalFiles: [
      {
        fileName: "modern-ui-kit.zip",
        fileUrl: "https://example.com/files/modern-ui-kit.zip",
        fileSize: 12_345_678
      }
    ],
    creatorFid: 500,
    slug: "modern-ui-kit",
    category: "Design",
    tags: ["ui", "kit", "freebie"],
    isFree: true,
    totalSold: 320,
    fileSize: 12_345_678,
    fileFormat: ["zip"],
    previewAvailable: true,
    previewFile: "https://example.com/files/modern-ui-preview.pdf",
    createdAt: new Date("2025-04-20T10:00:00Z"),
    updatedAt: new Date("2025-06-25T15:30:00Z"),
    totalRatings: 78,
    ratingsBreakdown: { 1: 0, 2: 1, 3: 2, 4: 15, 5: 60 }
  },
  {
    _id: "2",
    name: "Cool Background NCS Music with rock and pop by the best artist",
    description: "An all-in-one Notion workspace for startup founders to manage their business, fundraising, and goals.",
    images: ["https://example.com/startup-notion.png"],
    price: 25,
    ratingsScore: 4.6,
    comments: [],
    buyer: [],
    hasExternalLinks: true,
    externalLinks: [
      {
        name: "Notion Link",
        url: "https://notion.so/template/startup-os",
        type: "notion"
      }
    ],
    creatorFid: 501,
    slug: "startup-os-notion-template",
    category: "Productivity",
    tags: ["notion", "startup", "template"],
    isFree: false,
    totalSold: 130,
    previewAvailable: true,
    previewLink: "https://notion.so/startup-os-preview",
    discountPercentage: 20,
    createdAt: new Date("2025-03-10T09:00:00Z"),
    updatedAt: new Date("2025-06-20T16:00:00Z"),
    totalRatings: 40,
    ratingsBreakdown: { 1: 1, 2: 0, 3: 3, 4: 10, 5: 26 }
  },
  {
    _id: "3",
    name: "Cool Background NCS Music with rock and pop by the best artist",
    description: "A vibrant collection of 50 high-quality abstract illustrations for commercial and personal use.",
    images: ["https://example.com/illustration-pack-cover.png"],
    price: 15,
    ratingsScore: 4.9,
    comments: [
      {
        commentorFid: 1200,
        comment: "Fantastic quality and variety!",
        createdAt: new Date("2025-06-10T18:22:00Z")
      }
    ],
    buyer: [
      {
        fid: 1200,
        purchasedAt: new Date("2025-06-10T18:00:00Z")
      }
    ],
    hasExternalLinks: true,
    externalLinks: [
      {
        name: "Behance Project",
        url: "https://behance.net/project/illustration-pack",
        type: "behance"
      }
    ],
    creatorFid: 502,
    slug: "abstract-illustration-pack",
    category: "Illustration",
    tags: ["illustration", "art", "vector"],
    isFree: false,
    totalSold: 84,
    previewAvailable: true,
    previewLink: "https://behance.net/project/illustration-pack-preview",
    discountPercentage: 10,
    createdAt: new Date("2025-04-01T12:00:00Z"),
    updatedAt: new Date("2025-06-26T10:00:00Z"),
    totalRatings: 25,
    ratingsBreakdown: { 1: 0, 2: 0, 3: 1, 4: 4, 5: 20 }
  },
  {
    _id: "4",
    name: "Ultimate Resume Template Bundle",
    description: "A bundle of 10 modern, ATS-friendly resume templates for professionals in tech and design.",
    images: ["https://example.com/resume-bundle.png"],
    price: 19.99,
    ratingsScore: 4.7,
    comments: [
      {
        commentorFid: 1300,
        comment: "Helped me land my dream job!",
        createdAt: new Date("2025-05-15T14:00:00Z")
      }
    ],
    buyer: [
      {
        fid: 1300,
        purchasedAt: new Date("2025-05-15T13:45:00Z")
      }
    ],
    hasExternalLinks: false,
    digitalFiles: [
      {
        fileName: "resume-bundle.zip",
        fileUrl: "https://example.com/files/resume-bundle.zip",
        fileSize: 5_000_000
      }
    ],
    creatorFid: 503,
    slug: "resume-template-bundle",
    category: "Templates",
    tags: ["resume", "template", "career"],
    isFree: false,
    totalSold: 210,
    fileSize: 5_000_000,
    fileFormat: ["zip"],
    previewAvailable: true,
    previewFile: "https://example.com/files/resume-bundle-preview.pdf",
    createdAt: new Date("2025-02-10T10:00:00Z"),
    updatedAt: new Date("2025-06-10T12:00:00Z"),
    totalRatings: 55,
    ratingsBreakdown: { 1: 0, 2: 2, 3: 3, 4: 10, 5: 40 }
  },
  {
    _id: "5",
    name: "Crypto Portfolio Tracker Sheet",
    description: "A Google Sheets template to track your crypto investments, profits, and portfolio performance.",
    images: ["https://example.com/crypto-sheet.png"],
    price: 9.99,
    ratingsScore: 4.5,
    comments: [],
    buyer: [],
    hasExternalLinks: true,
    externalLinks: [
      {
        name: "Google Sheets Link",
        url: "https://docs.google.com/spreadsheets/d/crypto-portfolio",
        type: "other"
      }
    ],
    creatorFid: 504,
    slug: "crypto-portfolio-tracker",
    category: "Finance",
    tags: ["crypto", "tracker", "sheet"],
    isFree: false,
    totalSold: 75,
    previewAvailable: true,
    previewLink: "https://docs.google.com/spreadsheets/d/crypto-portfolio-preview",
    discountPercentage: 15,
    createdAt: new Date("2025-01-20T08:00:00Z"),
    updatedAt: new Date("2025-06-15T09:00:00Z"),
    totalRatings: 18,
    ratingsBreakdown: { 1: 0, 2: 1, 3: 2, 4: 5, 5: 10 }
  },
  {
    _id: "6",
    name: "Minimalist Icon Set",
    description: "A set of 200+ minimalist SVG icons for web and mobile projects.",
    images: ["https://example.com/minimalist-icons.png"],
    price: 0,
    ratingsScore: 4.9,
    comments: [
      {
        commentorFid: 1400,
        comment: "Beautiful icons, easy to use!",
        createdAt: new Date("2025-06-01T10:00:00Z")
      }
    ],
    buyer: [
      {
        fid: 1400,
        purchasedAt: new Date("2025-06-01T09:50:00Z")
      }
    ],
    hasExternalLinks: false,
    digitalFiles: [
      {
        fileName: "minimalist-icons.zip",
        fileUrl: "https://example.com/files/minimalist-icons.zip",
        fileSize: 2_500_000
      }
    ],
    creatorFid: 505,
    slug: "minimalist-icon-set",
    category: "Icons",
    tags: ["icons", "svg", "minimalist"],
    isFree: true,
    totalSold: 500,
    fileSize: 2_500_000,
    fileFormat: ["zip"],
    previewAvailable: true,
    previewFile: "https://example.com/files/minimalist-icons-preview.pdf",
    createdAt: new Date("2025-03-05T11:00:00Z"),
    updatedAt: new Date("2025-06-27T08:00:00Z"),
    totalRatings: 100,
    ratingsBreakdown: { 1: 0, 2: 0, 3: 2, 4: 8, 5: 90 }
  }
]
