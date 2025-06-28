import { useEffect, useRef } from "react";
import { useAccount } from "wagmi";
import { usePrivy } from "@privy-io/react-auth";
import { useAuthenticatedAPI } from "./use-authenticated-fetch";

/**
 * Hook that automatically syncs wagmi wallet changes with user database
 * Monitors useAccount address changes and adds new wallets to user profile
 */
export function useWalletSync() {
  const { address, isConnected, connector } = useAccount();
  const { authenticated, user } = usePrivy();
  const { post, get } = useAuthenticatedAPI();

  // Keep track of the last processed address to avoid duplicate calls
  const lastProcessedAddress = useRef<string | null>(null);

  useEffect(() => {
    // Only proceed if user is authenticated and wallet is connected
    if (!authenticated || !isConnected || !address || !user) {
      return;
    }

    // Skip if we've already processed this address
    if (lastProcessedAddress.current === address) {
      return;
    }

    const syncWallet = async () => {
      try {
        // First, get current user data to check if wallet already exists
        const currentUser = await get("/api/users/me");

        // Check if this wallet address is already in user's wallets
        const existingWallet = currentUser.wallets?.find(
          (wallet: any) =>
            wallet.address.toLowerCase() === address.toLowerCase()
        );

        if (existingWallet) {
          console.log("✅ Wallet already exists in user profile:", address);
          lastProcessedAddress.current = address;
          return;
        }

        // Wallet doesn't exist, add it to user profile
        console.log("🔄 Adding new wallet to user profile:", address);

        const walletData = {
          address,
          chainType:
            (connector as any)?.chains?.[0]?.name?.toLowerCase() || "ethereum",
          walletClientType: connector?.name || "unknown",
          connectorType: connector?.type || "unknown",
        };

        await post("/api/users/me/wallet", walletData);

        console.log("✅ Successfully synced wallet to database:", address);
        lastProcessedAddress.current = address;
      } catch (error) {
        console.error("❌ Failed to sync wallet to database:", error);

        // Don't update lastProcessedAddress on error so we can retry
        // Check if it's a conflict error (wallet already exists)
        if (
          error instanceof Error &&
          error.message.includes("already exists")
        ) {
          console.log("✅ Wallet already exists (conflict error):", address);
          lastProcessedAddress.current = address;
        }
      }
    };

    // Debounce the sync call slightly to avoid rapid-fire calls
    const timeoutId = setTimeout(syncWallet, 500);

    return () => clearTimeout(timeoutId);
  }, [address, isConnected, authenticated, user?.id, connector, post, get]);

  // Reset processed address when user changes or disconnects
  useEffect(() => {
    if (!authenticated || !isConnected) {
      lastProcessedAddress.current = null;
    }
  }, [authenticated, isConnected, user?.id]);

  return {
    isConnected,
    address,
    connectorName: connector?.name,
  };
}
