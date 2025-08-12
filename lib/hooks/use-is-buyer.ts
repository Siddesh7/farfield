"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useMemo } from "react";
import { Product } from "@/lib/types/product";

interface UseIsBuyerReturn {
  isBuyer: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
  userFid?: number | null;
}

export function useIsBuyer(product: Product | null): UseIsBuyerReturn {
  const { ready, authenticated, user } = usePrivy();

  const result = useMemo<UseIsBuyerReturn>(() => {
    if (!ready || !authenticated || !user) {
      return {
        isBuyer: false,
        isLoading: !ready,
        isAuthenticated: authenticated,
        userFid: undefined,
      };
    }

    // If no product provided, return default values using user context
    if (!product) {
      return {
        isBuyer: false,
        isLoading: false,
        isAuthenticated: authenticated,
        userFid: user.farcaster?.fid,
      };
    }

    const userFid = user.farcaster?.fid;
    if (!userFid) {
      return {
        isBuyer: false,
        isLoading: false,
        isAuthenticated: authenticated,
        userFid,
      };
    }

    // Check enriched buyers array (API shape)
    const inBuyersEnriched = product.buyers?.some(
      (b) => b?.fid === userFid || b?.buyer?.fid === userFid
    );

    // Check raw buyer array (DB shape)
    const inBuyerRaw = Array.isArray(product.buyer)
      ? product.buyer.some((b) => b?.fid === userFid)
      : false;

    const isBuyer = Boolean(inBuyersEnriched || inBuyerRaw);

    return {
      isBuyer,
      isLoading: false,
      isAuthenticated: authenticated,
      userFid,
    };
  }, [ready, authenticated, user, product]);

  return result;
}


