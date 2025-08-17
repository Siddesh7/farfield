import { useQuery } from "@tanstack/react-query";
import { useAuthenticatedAPI } from "@/lib/hooks";

interface UserProfile {
  id: string;
  privyId: string;
  farcaster: {
    fid: number;
    username: string;
    displayName: string;
    pfp: string | null;
    bio: string;
    followers: number;
    following: number;
    verifiedAddresses: string[];
  };
  wallet: {
    address: string;
    verified: boolean;
  } | null;
  isVerified: boolean;
  totalEarned: number;
  createdAt: string;
  updatedAt: string;
}

export function useUserProfile() {
  const { get, isAuthenticated } = useAuthenticatedAPI();

  return useQuery({
    queryKey: ["user-profile"],
    queryFn: async (): Promise<UserProfile> => {
      if (!isAuthenticated) {
        throw new Error("User must be authenticated to fetch profile");
      }

      try {
        const res = await get("/api/users/me");
        if (!res.success) {
          throw new Error(res.error || res.message || "Failed to fetch user profile");
        }
        return res.data;
      } catch (error: any) {
        throw new Error(error.message || "Error fetching user profile");
      }
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}
