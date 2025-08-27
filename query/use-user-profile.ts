import { useQuery } from "@tanstack/react-query";
import { useAuthenticatedAPI } from "@/lib/hooks";

interface UserProfile {
  id: string;
  privyId?: string;
  farcaster: {
    ownerAddress: string;
    displayName: string;
    username: string;
    pfp: string | null;
  };
  farcasterFid: number;
  wallets: Array<{
    address: string;
    chainType: string;
    walletClientType: string;
    connectorType: string;
    isPrimary: boolean;
    _id: string;
    id: string;
  }>;
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
