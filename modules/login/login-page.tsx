import { Button } from "@/components/ui/button";
import { useMiniApp } from "@/providers/provider";
import { usePrivy } from "@privy-io/react-auth";
import { useLoginToFrame } from "@privy-io/react-auth/farcaster";
import React from "react";
import { useAccount, useSignMessage } from "wagmi";

const LoginPage = () => {
  const { ready, authenticated, logout, login, user, linkWallet } = usePrivy();
  const { address, isConnected } = useAccount();
  const { data: signature, error, signMessage } = useSignMessage();

  const handleSignMessage = () => {
    signMessage({ message: "Hello, world!" });
  };

  return (
    <div>
      <div className="text-center mb-8 pt-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Farfield</h1>
      </div>

      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="w-full max-w-md space-y-8 rounded-xl shadow-lg p-8 bg-white/80">
          {/* Profile Card */}
          {user && (
            <div className="flex flex-col items-center gap-2 rounded-xl bg-gray-50 border border-gray-200 p-4 mb-4">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center mb-2">
                {user.farcaster?.pfp ? (
                  <img
                    src={user.farcaster.pfp}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl text-gray-400">👤</span>
                )}
              </div>
              <div className="text-lg font-semibold text-gray-900">
                {user.farcaster?.displayName ||
                  user.google?.name ||
                  user.twitter?.name ||
                  "Anonymous"}
              </div>
              {user.farcaster?.username && (
                <div className="text-xs text-purple-600">
                  @{user.farcaster.username}
                </div>
              )}
              {user.email?.address && (
                <div className="text-xs text-gray-600">
                  {user.email.address}
                </div>
              )}
              {user.wallet?.address && (
                <div className="text-xs font-mono text-blue-700 break-all">
                  {user.wallet.address}
                </div>
              )}
              {user.farcaster?.bio && (
                <div className="text-xs text-gray-500 text-center mt-2">
                  {user.farcaster.bio}
                </div>
              )}
            </div>
          )}
          <div className="flex flex-col gap-4">
            {!authenticated && (
              <Button variant="default" className="w-full" onClick={login}>
                Login
              </Button>
            )}

            {!authenticated ||
              (!isConnected && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={linkWallet}
                >
                  Connect Wallet
                </Button>
              ))}
          </div>
          <div className="mt-6 text-center text-sm">
            <p>
              Address: <span className="font-mono">{address}</span>
            </p>
            <p>
              Status:{" "}
              <span className={isConnected ? "text-green-600" : "text-red-600"}>
                {isConnected ? "Connected" : "Disconnected"}
              </span>
            </p>
          </div>
          {isConnected && (
            <Button
              onClick={handleSignMessage}
              variant="secondary"
              className="w-full mt-4"
            >
              Sign a message
            </Button>
          )}
          {signature && (
            <div className="mt-2 text-xs break-all text-green-700">
              Signature: {signature}
            </div>
          )}
          {error && (
            <div className="mt-2 text-xs text-red-600">
              Error: {error.message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export { LoginPage };
