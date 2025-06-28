"use client";
import { usePrivy } from "@privy-io/react-auth";
import { useMiniApp } from "@/providers/provider";
import { useEffect } from "react";
import frameSdk from "@farcaster/frame-sdk";
import { useLoginToFrame } from "@privy-io/react-auth/farcaster";
import { LoginPage } from "@/modules/login";
import { useAccount } from "wagmi";
import { ProfilePage } from "@/modules/profile";
import BottomNavigation from "@/components/bottom-navigation";
import { useAuthenticatedAPI } from "@/lib/hooks/use-authenticated-fetch";

export default function Home() {
  const { ready, authenticated, logout, login, user, linkWallet } = usePrivy();
  const { isSDKLoaded } = useMiniApp();
  const { initLoginToFrame, loginToFrame } = useLoginToFrame();
  const { address, isConnected } = useAccount();
  const { post } = useAuthenticatedAPI();

  useEffect(() => {
    console.log("First useEFfect", ready, authenticated);
    if (ready && !authenticated) {
      const loginAsync = async () => {
        const { nonce } = await initLoginToFrame();
        const result = await frameSdk.actions.signIn({ nonce });
        await loginToFrame({
          message: result.message,
          signature: result.signature,
        });
      };
      loginAsync();
    }
  }, [ready, authenticated, initLoginToFrame, loginToFrame]);

  useEffect(() => {
    console.log("second useEffect", user, authenticated);
    if (user && authenticated) {
      // Register user with authenticated API call
      const registerUser = async () => {
        try {
          const response = await post("/api/users/register", {
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
          });
          console.log("User registration response:", response);
        } catch (error) {
          // User might already exist, which is fine
          console.log("User registration error (might already exist):", error);
        }
      };

      registerUser();
    }
  }, [user, authenticated, post]);

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p>Loading Privy...</p>
        </div>
      </div>
    );
  }

  if (!isSDKLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
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
