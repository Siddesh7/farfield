"use client";
import { usePrivy } from "@privy-io/react-auth";
import { useMiniApp } from "@/providers/provider";
import { useEffect, useCallback, useRef, useState } from "react";
import frameSdk from "@farcaster/frame-sdk";
import { useLoginToFrame } from "@privy-io/react-auth/farcaster";
import { LoginPage } from "@/modules/login";
import { useAccount } from "wagmi";
import BottomNavigation from "@/components/layout/bottom-navigation";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useApiState } from "@/lib/hooks/use-api-state";
import { useAuthenticatedAPI } from "@/lib/hooks/use-authenticated-fetch";
import { useWalletSync } from "@/lib/hooks/use-wallet-sync";
import { DesktopLayout, HeaderSection, LoadingLayout } from "@/components/layout";
import { useGlobalContext } from "@/context/global-context";
import { useIsMobile } from "@/lib/hooks/use-is-mobile";
import BodySection from "@/components/layout/body-section";

export default function Home() {
  const { ready, authenticated, user } = usePrivy();
  const { isSDKLoaded, isMiniApp } = useMiniApp();
  const { initLoginToFrame, loginToFrame } = useLoginToFrame();
  const { isConnected } = useAccount();
  const { post } = useAuthenticatedAPI();
  const { execute: registerUser } = useApiState();

  const { activeModule } = useGlobalContext();

  // Automatically sync wallet changes to user database
  const walletSync = useWalletSync();

  // Track if we've already attempted to register the current user
  const registeredUserIdRef = useRef<string | null>(null);

  const handleFrameLogin = useCallback(async () => {
    if (ready && !authenticated) {
      try {
        const { nonce } = await initLoginToFrame();
        const result = await frameSdk.actions.signIn({ nonce });
        await loginToFrame({
          message: result.message,
          signature: result.signature,
        });
      } catch (error) {
        console.error("Frame login error:", error);
      }
    }
  }, [ready, authenticated, initLoginToFrame, loginToFrame]);

  // Register user only once per user ID
  useEffect(() => {
    if (user && authenticated && registeredUserIdRef.current !== user.id) {
      // Mark this user as being processed
      registeredUserIdRef.current = user.id;

      const attemptRegistration = async () => {
        try {
          // Prepare registration data
          const registrationData: any = {
            privyId: user.id,
            farcasterFid: user.farcaster?.fid,
            farcaster: {
              username: user.farcaster?.username,
              displayName: user.farcaster?.displayName,
              bio: user.farcaster?.bio,
              pfp: user.farcaster?.pfp,
              ownerAddress: user.farcaster?.ownerAddress,
            },
          };

          // Only include wallet if address is present
          if (user.wallet?.address) {
            registrationData.wallet = {
              address: user.wallet.address,
              chainType: user.wallet.chainType,
              walletClientType: user.wallet.walletClientType,
              connectorType: user.wallet.connectorType,
            };
          }

          await registerUser(() =>
            post("/api/users/register", registrationData)
          );
        } catch (error) {
          // If registration fails, reset so we can retry later
          console.error("User registration failed:", error);
          registeredUserIdRef.current = null;
        }
      };

      attemptRegistration();
    }
  }, [user?.id, authenticated, registerUser, post]);

  useEffect(() => {
    handleFrameLogin();
  }, [handleFrameLogin]);

  // Clear registered user ID when user logs out
  useEffect(() => {
    if (!authenticated) {
      registeredUserIdRef.current = null;
    }
  }, [authenticated]);

  const isMobile = useIsMobile();

  if (!isMobile) {
    return (
      <DesktopLayout />
    );
  }

  if (!ready) {
    return (
      <LoadingLayout />
    );
  }
  if (!isSDKLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <LoadingSpinner color="secondary" className="mx-auto mb-4" />
          <p>Loading Farcaster SDK...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="max-w-md mx-auto">
          <LoginPage />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <HeaderSection />
      <BodySection />
      <BottomNavigation />
    </div>
  );
}
