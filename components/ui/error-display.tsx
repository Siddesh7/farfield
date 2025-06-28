import { cn } from "@/lib/utils";
import { Button } from "./button";

interface ErrorDisplayProps {
  error: string | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  variant?: "banner" | "card" | "inline";
  className?: string;
}

export function ErrorDisplay({
  error,
  onRetry,
  onDismiss,
  variant = "banner",
  className,
}: ErrorDisplayProps) {
  if (!error) return null;

  const baseClasses = "text-red-600 bg-red-50 border-red-200";

  const variantClasses = {
    banner: "p-4 border rounded-lg",
    card: "p-6 border rounded-xl shadow-sm",
    inline: "text-sm p-2",
  };

  return (
    <div className={cn(baseClasses, variantClasses[variant], className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <span className="text-red-500 mr-2">⚠️</span>
          <span className="font-medium">Error:</span>
          <span className="ml-2">{error}</span>
        </div>
        <div className="flex items-center space-x-2">
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="border-red-300 text-red-700 hover:bg-red-100"
            >
              Retry
            </Button>
          )}
          {onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="text-red-500 hover:bg-red-100"
            >
              ×
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

interface ErrorBoundaryProps {
  error: string | null;
  onRetry?: () => void;
  onClear?: () => void;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ErrorBoundary({
  error,
  onRetry,
  onClear,
  children,
  fallback,
}: ErrorBoundaryProps) {
  if (error) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="p-8 text-center">
        <div className="text-red-500 text-4xl mb-4">⚠️</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Something went wrong
        </h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <div className="space-x-2">
          {onRetry && (
            <Button onClick={onRetry} variant="outline">
              Try Again
            </Button>
          )}
          {onClear && (
            <Button onClick={onClear} variant="ghost">
              Clear Error
            </Button>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
