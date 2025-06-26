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
import { useGlobalContext } from "@/context/global-context";
import HomePage from "@/modules/home/home-page";
import HeaderSection from "@/components/header-section";

export default function Home() {
  const { ready, authenticated, logout, login, user, linkWallet } = usePrivy();
  const { isSDKLoaded } = useMiniApp();
  const { initLoginToFrame, loginToFrame } = useLoginToFrame();
  const { address, isConnected } = useAccount();

  const { activeModule, setActiveModule } = useGlobalContext();

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
    console.log("second useEffect", user);
    if (user) {
      fetch("/api/user/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
        }),
      });
    }
  }, [user]);

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

  if (!authenticated || !isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="max-w-md mx-auto">
          <LoginPage />
        </div>
      </div>
    );
  }

  // User is authenticated and wallet is connected
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <HeaderSection />
      <div className="max-w-md mx-auto">
        {activeModule === 'home' && <HomePage />}
        {activeModule === 'profile' && <ProfilePage />}
        {/* Add other modules/components as needed */}
      </div>
      <BottomNavigation />
    </div>
  );
}