import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthenticatedAPI } from "@/lib/hooks";

interface SellerAccessResponse {
  fid: number;
  hasAccess: boolean;
  updatedAt: string | null;
}

interface SellerAccessRequest {
  code: string;
}

export function useSellerAccess(fid: number | null) {
  const { get, isAuthenticated } = useAuthenticatedAPI();

  return useQuery({
    queryKey: ["seller-access", fid],
    queryFn: async (): Promise<SellerAccessResponse> => {
      if (!isAuthenticated || !fid) {
        throw new Error("User must be authenticated and have a valid FID to check seller access");
      }

      try {
        const res = await get(`/api/sellers/${fid}`);
        if (!res.success) {
          throw new Error(res.error || res.message || "Failed to fetch seller access");
        }
        return res.data;
      } catch (error: any) {
        console.error("Seller access query error:", error);
        throw new Error(error.message || "Error fetching seller access");
      }
    },
    enabled: isAuthenticated && !!fid,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

export function useGrantSellerAccess() {
  const { post, isAuthenticated } = useAuthenticatedAPI();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ fid, code }: { fid: number; code: string }): Promise<SellerAccessResponse> => {
      if (!isAuthenticated) {
        throw new Error("User must be authenticated to grant seller access");
      }

      try {
        const res = await post(`/api/sellers/${fid}`, { code });
        if (!res.success) {
          throw new Error(res.error || res.message || "Failed to grant seller access");
        }
        return res.data;
      } catch (error: any) {
        console.error("Grant seller access error:", error);
        throw new Error(error.message || "Error granting seller access");
      }
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch the seller access query
      queryClient.invalidateQueries({ queryKey: ["seller-access", variables.fid] });
    },
    onError: (error) => {
      console.error("Grant seller access mutation error:", error);
    },
  });
}
