import { IUser } from "@/models/user";
import { Product } from "@/models/product";

// User API Response Types
export interface UserResponse {
  _id: string;
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
  verificationCheckedAt?: string;
  createdAt: string;
  updatedAt: string;
  totalEarned: number;
}

export interface PublicUserResponse extends Omit<UserResponse, "wallets"> {
  wallets: Array<{
    address: string;
    chainType?: string;
  }>;
}

// User Registration Request
export interface UserRegistrationRequest {
  privyId: string;
  farcasterFid: number;
  farcaster: {
    ownerAddress: string;
    displayName: string;
    username: string;
    bio?: string;
    pfp?: string;
  };
  wallet?: {
    address: string;
    chainType?: string;
    walletClientType?: string;
    connectorType?: string;
  };
}

// User Update Requests
export interface UserUpdateRequest {
  farcaster?: {
    displayName?: string;
    bio?: string;
    pfp?: string;
  };
}

export interface FarcasterUpdateRequest {
  displayName?: string;
  bio?: string;
  pfp?: string;
}

export interface WalletAddRequest {
  address: string;
  chainType?: string;
  walletClientType?: string;
  connectorType?: string;
  isPrimary?: boolean;
}

export interface WalletRemoveRequest {
  address: string;
}

// Search and Query Types
export interface UserSearchQuery {
  query?: string;
  farcasterFid?: number;
  username?: string;
  displayName?: string;
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "updatedAt" | "farcasterFid" | "displayName";
  sortOrder?: "asc" | "desc";
}

export interface UserListQuery {
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "updatedAt" | "farcasterFid" | "displayName";
  sortOrder?: "asc" | "desc";
  chainType?: string;
}
