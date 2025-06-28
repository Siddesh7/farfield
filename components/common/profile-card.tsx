import { cn } from "@/lib/utils";

interface ProfileData {
  farcaster?: {
    pfp?: string | null;
    displayName?: string | null;
    username?: string | null;
    bio?: string | null;
  };
  google?: {
    name?: string | null;
  };
  twitter?: {
    name?: string | null;
  };
  email?: {
    address?: string | null;
  };
  wallet?: {
    address?: string | null;
  };
}

interface ProfileCardProps {
  user: ProfileData;
  variant?: "compact" | "full";
  showWallet?: boolean;
  showEmail?: boolean;
  className?: string;
}

export function ProfileCard({
  user,
  variant = "full",
  showWallet = true,
  showEmail = true,
  className,
}: ProfileCardProps) {
  const displayName =
    user.farcaster?.displayName ||
    user.google?.name ||
    user.twitter?.name ||
    "Anonymous";

  const avatarSize = variant === "compact" ? "w-12 h-12" : "w-16 h-16";

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 rounded-xl bg-gray-50 border border-gray-200 p-4",
        className
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "rounded-full overflow-hidden bg-gray-200 flex items-center justify-center mb-2",
          avatarSize
        )}
      >
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

      {/* Display Name */}
      <div className="text-lg font-semibold text-gray-900">{displayName}</div>

      {/* Username */}
      {user.farcaster?.username && (
        <div className="text-xs text-purple-600">
          @{user.farcaster.username}
        </div>
      )}

      {/* Email */}
      {showEmail && user.email?.address && (
        <div className="text-xs text-gray-600">{user.email.address}</div>
      )}

      {/* Wallet Address */}
      {showWallet && user.wallet?.address && (
        <div className="text-xs font-mono text-blue-700 break-all">
          {user.wallet.address}
        </div>
      )}

      {/* Bio */}
      {variant === "full" && user.farcaster?.bio && (
        <div className="text-xs text-gray-500 text-center mt-2">
          {user.farcaster.bio}
        </div>
      )}
    </div>
  );
}

// Pre-configured variants for common use cases
export function CompactProfileCard(props: Omit<ProfileCardProps, "variant">) {
  return <ProfileCard {...props} variant="compact" />;
}

export function PublicProfileCard(
  props: Omit<ProfileCardProps, "showWallet" | "showEmail">
) {
  return <ProfileCard {...props} showWallet={false} showEmail={false} />;
}
