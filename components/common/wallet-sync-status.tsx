import { useWalletSync } from "@/lib/hooks/use-wallet-sync";
import { cn } from "@/lib/utils";

interface WalletSyncStatusProps {
  className?: string;
  variant?: "compact" | "full";
}

export function WalletSyncStatus({
  className,
  variant = "compact",
}: WalletSyncStatusProps) {
  const { isConnected, address, connectorName } = useWalletSync();

  if (!isConnected || !address) {
    return null;
  }

  if (variant === "compact") {
    return (
      <div
        className={cn(
          "flex items-center gap-2 text-xs text-green-600",
          className
        )}
      >
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <span>Wallet synced</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "bg-green-50 border border-green-200 rounded-lg p-3",
        className
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
        <span className="text-sm font-medium text-green-800">
          Wallet Connected & Synced
        </span>
      </div>

      <div className="text-xs text-green-700 space-y-1">
        <div>
          <span className="font-medium">Address:</span>{" "}
          <span className="font-mono">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
        </div>

        {connectorName && (
          <div>
            <span className="font-medium">Connector:</span> {connectorName}
          </div>
        )}
      </div>
    </div>
  );
}
