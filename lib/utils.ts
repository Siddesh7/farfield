import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Product } from "./types/product";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const trimAddress = (address: string | undefined, length: number) => {
  if (!address) return null;
  if (!address || address.length < 10) return address;
  return `${address.slice(0, length)}....${address.slice(-length)}`;
};

export const getTruncatedDescription = (desc: string, charLimit: number) => {
  if (desc.length <= charLimit) return desc;
  return desc.slice(0, charLimit) + "...";
};


export function formatTimeAgo(date: Date | string): string {
  const now = new Date();
  const d = typeof date === 'string' ? new Date(date) : date;
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000); // in seconds

  if (isNaN(diff) || diff < 0) return '';
  if (diff < 60) return 'just now';
  if (diff < 3600) {
    const mins = Math.floor(diff / 60);
    return `${mins} min${mins > 1 ? 's' : ''} ago`;
  }
  if (diff < 86400) {
    const hours = Math.floor(diff / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }
  const days = Math.floor(diff / 86400);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}
