"use client";
import { usePrivy } from "@privy-io/react-auth";
import { useMiniApp } from "@/providers/provider";
import { useEffect, useCallback } from "react";
import frameSdk from "@farcaster/frame-sdk";
import { useLoginToFrame } from "@privy-io/react-auth/farcaster";
import { LoginPage } from "@/modules/login";
import { useAccount } from "wagmi";
import { ProfilePage } from "@/modules/profile";
import BottomNavigation from "@/components/bottom-navigation";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useApiState } from "@/lib/hooks/use-api-state";
import { useAuthenticatedAPI } from "@/lib/hooks/use-authenticated-fetch";

export default function Home() {
  const { ready, authenticated, user } = usePrivy();
  const { isSDKLoaded } = useMiniApp();
  const { initLoginToFrame, loginToFrame } = useLoginToFrame();
  const { isConnected } = useAccount();
  const { post } = useAuthenticatedAPI();
  const { execute: registerUser } = useApiState();

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

  const handleUserRegistration = useCallback(async () => {
    if (user && authenticated) {
      await registerUser(() =>
        post("/api/users/register", {
          privyId: user.id,
          farcasterFid: user.farcaster?.fid,
          farcaster: {
            username: user.farcaster?.username,
            displayName: user.farcaster?.displayName,
            bio: user.farcaster?.bio,
            pfp: user.farcaster?.pfp,
            ownerAddress: user.farcaster?.ownerAddress,
          },
          wallet: {
            address: user.wallet?.address,
            chainType: user.wallet?.chainType,
            walletClientType: user.wallet?.walletClientType,
            connectorType: user.wallet?.connectorType,
          },
        })
      );
    }
  }, [user, authenticated, registerUser, post]);

  useEffect(() => {
    handleFrameLogin();
  }, [handleFrameLogin]);

  useEffect(() => {
    handleUserRegistration();
  }, [handleUserRegistration]);

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <LoadingSpinner className="mx-auto mb-4" />
          <p>Loading Privy...</p>
        </div>
      </div>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="max-w-md mx-auto">
        <LoginPage />
        {isConnected && <ProfilePage />}
      </div>
      <BottomNavigation />
    </div>
  );
}
