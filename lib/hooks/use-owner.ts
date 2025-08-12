"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useMemo, useEffect } from "react";
import { Product } from "@/lib/types/product";
import { useAuthenticatedAPI } from "./use-authenticated-fetch";
import { useApiState } from "./use-api-state";

interface UseOwnerReturn {
  isOwner: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
  userFid?: number | null;
  productCreatorFid?: number;
}

export function useOwner(product: Product | null): UseOwnerReturn {
  const { ready, authenticated, user } = usePrivy();

  const result = useMemo((): UseOwnerReturn => {
    if (!ready || !authenticated || !user) {
      return {
        isOwner: false,
        isLoading: !ready,
        isAuthenticated: authenticated,
        userFid: undefined,
        productCreatorFid: undefined,
      };
    }

    // If no product provided, return default values
    if (!product) {
      return {
        isOwner: false,
        isLoading: false,
        isAuthenticated: authenticated,
        userFid: user.farcaster?.fid,
        productCreatorFid: undefined,
      };
    }

    // Extract Farcaster IDs
    const userFid = user.farcaster?.fid;
    const productCreatorFid = product.creator?.fid;

    // Check if user is the owner
    const isOwner = userFid === productCreatorFid;

    return {
      isOwner,
      isLoading: false,
      isAuthenticated: authenticated,
      userFid,
      productCreatorFid,
    };
  }, [ready, authenticated, user, product]);

  return result;
}
