import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  color?: "primary" | "secondary" | "white";
  className?: string;
}

const sizeClasses = {
  sm: "w-4 h-4",
  md: "w-8 h-8",
  lg: "w-12 h-12",
};

const colorClasses = {
  primary: "border-blue-500 border-t-transparent",
  secondary: "border-gray-500 border-t-transparent",
  white: "border-white border-t-transparent",
};

export function LoadingSpinner({
  size = "md",
  color = "primary",
  className,
}: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        "animate-spin rounded-full border-4",
        sizeClasses[size],
        colorClasses[color],
        className
      )}
    />
  );
}

interface LoadingStateProps {
  loading: boolean;
  children: React.ReactNode;
  text?: string;
  className?: string;
}

export function LoadingState({
  loading,
  children,
  text = "Loading...",
  className,
}: LoadingStateProps) {
  if (loading) {
    return (
      <div className={cn("flex items-center justify-center p-8", className)}>
        <div className="text-center">
          <LoadingSpinner className="mx-auto mb-4" />
          <p className="text-gray-600">{text}</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
