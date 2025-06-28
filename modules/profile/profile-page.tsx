import { usePrivy } from "@privy-io/react-auth";
import { ProfileCard, WalletSyncStatus } from "@/components/common";
import { LoadingState } from "@/components/ui/loading-spinner";
import { useUserProfileApi } from "@/lib/hooks/use-api-state";
import { ErrorBoundary } from "@/components/ui/error-display";
import { useEffect, useRef } from "react";

const ProfilePage = () => {
  const { ready, authenticated, user } = usePrivy();
  const { profile, profileLoading, profileError, fetchProfile } =
    useUserProfileApi();

  // Track if we've already fetched the profile to prevent infinite loops
  const hasFetchedRef = useRef(false);

  // Fetch profile data when component mounts
  useEffect(() => {
    if (authenticated && ready && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchProfile();
    }
  }, [authenticated, ready]); // Removed fetchProfile from dependencies

  // Reset the fetch flag when user logs out
  useEffect(() => {
    if (!authenticated) {
      hasFetchedRef.current = false;
    }
  }, [authenticated]);

  return (
    <LoadingState loading={!ready} text="Loading Privy...">
      <div className="p-4">
        {user && (
          <div className="mb-6 space-y-4">
            <ProfileCard user={user} variant="full" />
            <WalletSyncStatus variant="full" />
          </div>
        )}
      </div>
    </LoadingState>
  );
};

export { ProfilePage };
