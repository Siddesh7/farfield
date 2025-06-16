"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider, createConfig } from "@privy-io/wagmi";

import { base, baseSepolia } from "wagmi/chains";
import { http } from "wagmi";

import { sdk } from "@farcaster/frame-sdk";
import { createContext, useContext, useEffect, useState } from "react";

// Mini App Context
const MiniAppContext = createContext<{
  isSDKLoaded: boolean;
  context: any;
  actions: any;
} | null>(null);

export const useMiniApp = () => {
  const context = useContext(MiniAppContext);
  if (!context) {
    throw new Error("useMiniApp must be used within MiniAppProvider");
  }
  return context;
};

function MiniAppProvider({ children }: { children: React.ReactNode }) {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      try {
        // Check if we're in a Farcaster environment
        if (typeof window !== "undefined") {
          console.log("Window location:", window.location.href);
          console.log("User agent:", navigator.userAgent);
        }

        if (!sdk) {
          console.log("SDK not available, setting mock context");
          setIsSDKLoaded(true);
          return;
        }

        const contextData = await sdk.context;
        setContext(contextData);

        // Call ready after context is loaded
        if (sdk.actions && sdk.actions.ready) {
          sdk.actions.ready();
        }

        setIsSDKLoaded(true);
      } catch (error) {
        console.error("Error loading Farcaster SDK:", error);
        setIsSDKLoaded(true);
      }
    };

    const timer = setTimeout(() => {
      load();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <MiniAppContext.Provider
      value={{
        isSDKLoaded,
        context,
        actions: sdk?.actions || null,
      }}
    >
      {children}
    </MiniAppContext.Provider>
  );
}

const queryClient = new QueryClient();
const wagmiConfig = createConfig({
  chains: [base, baseSepolia],
  transports: {
    [base.id]: http(process.env.NEXT_PUBLIC_BASE_RPC_URL || ""),
    [baseSepolia.id]: http(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || ""),
  },
});

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MiniAppProvider>
      <PrivyProvider
        appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ""}
        clientId={process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID || ""}
        config={{
          loginMethods: ["farcaster", "wallet"],
        }}
      >
        <QueryClientProvider client={queryClient}>
          <WagmiProvider config={wagmiConfig}>{children}</WagmiProvider>
        </QueryClientProvider>
      </PrivyProvider>
    </MiniAppProvider>
  );
}
