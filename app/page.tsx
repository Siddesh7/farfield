"use client";
import { Button } from "@/components/ui/button";
import { usePrivy } from "@privy-io/react-auth";
import { useAccount } from "wagmi";
import { useMiniApp } from "@/providers/provider";

export default function Home() {
  const { ready, authenticated, logout, login } = usePrivy();
  const { address } = useAccount();
  const { isSDKLoaded, context } = useMiniApp();

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading Privy...</p>
        </div>
      </div>
    );
  }

  if (!isSDKLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading Farcaster SDK...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Farfield</h1>
        </div>

        {/* User Info */}
        {context?.user && (
          <div className="bg-white rounded-xl p-6 mb-6 shadow-sm border">
            <div className="flex items-center gap-4">
              {context.user.pfpUrl && (
                <img
                  src={context.user.pfpUrl}
                  alt="Profile"
                  className="w-12 h-12 rounded-full object-cover"
                />
              )}
              <div>
                <h3 className="font-semibold text-gray-900">
                  {context.user.displayName || context.user.username}
                </h3>
                <p className="text-gray-500 text-sm">
                  @{context.user.username}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Wallet Section */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          {authenticated ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Wallet Address
                </label>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm font-mono text-gray-800 break-all">
                    {address || "Not connected"}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => logout()}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                Logout
              </Button>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Connect Your Wallet
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Connect your wallet to start using the app
                </p>
              </div>
              <Button
                onClick={() => login()}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Connect Wallet
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
