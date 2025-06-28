import { usePrivy } from "@privy-io/react-auth";
import { ProfileCard } from "@/components/common";
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
          <div className="mb-6">
            <ProfileCard user={user} variant="full" />
          </div>
        )}

        {authenticated && (
          <LoadingState loading={profileLoading} text="Loading profile...">
            <ErrorBoundary error={profileError} onRetry={fetchProfile}>
              {profile && (
                <div className="bg-white rounded-lg shadow-sm border p-4">
                  <h2 className="text-lg font-semibold mb-4">
                    Server Profile Data
                  </h2>
                  <pre className="text-sm bg-gray-50 p-3 rounded overflow-auto">
                    {JSON.stringify(profile, null, 2)}
                  </pre>
                </div>
              )}
            </ErrorBoundary>
          </LoadingState>
        )}
      </div>
    </LoadingState>
  );
};

export { ProfilePage };
