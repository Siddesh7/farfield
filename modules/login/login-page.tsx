import { Button } from "@/components/ui/button";
import { useLinkAccount, usePrivy } from "@privy-io/react-auth";
import { useAccount, useSignMessage } from "wagmi";
import { ProfileCard } from "@/components/common";
import { ErrorDisplay } from "@/components/ui/error-display";
import { useCallback } from "react";

const LoginPage = () => {
  const { authenticated, login, user, linkWallet } = usePrivy();
  const { address, isConnected } = useAccount();
  const { data: signature, error, signMessage } = useSignMessage();

  const handleSignMessage = useCallback(() => {
    signMessage({ message: "Hello, world!" });
  }, [signMessage]);

  return (
    <div>
      <div className="text-center mb-8 pt-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Farfield</h1>
      </div>

      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="w-full max-w-md space-y-8 rounded-xl shadow-lg p-8 bg-white/80">
          {user && <ProfileCard user={user} variant="full" className="mb-4" />}

          <div className="flex flex-col gap-4">
            {!authenticated && (
              <Button variant="default" className="w-full" onClick={login}>
                Login
              </Button>
            )}

            {(!authenticated || !isConnected) && (
              <Button variant="outline" className="w-full" onClick={linkWallet}>
                Connect Wallet
              </Button>
            )}
          </div>

          <div className="mt-6 text-center text-sm space-y-2">
            <p>
              Address:{" "}
              <span className="font-mono">{address || "Not connected"}</span>
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
            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
              <p className="text-xs text-green-700 font-medium">Signature:</p>
              <p className="text-xs text-green-600 break-all font-mono">
                {signature}
              </p>
            </div>
          )}

          <ErrorDisplay
            error={error?.message || null}
            variant="inline"
            className="mt-2"
          />
        </div>
      </div>
    </div>
  );
};

export { LoginPage };
