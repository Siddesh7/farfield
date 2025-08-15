import { useQuery } from "@tanstack/react-query";
import { useAuthenticatedAPI } from "@/lib/hooks/use-authenticated-fetch";
import { ProductAccessResponse } from "@/lib/types/product";

export function useProductAccess(productId: string) {
  const { get, isAuthenticated } = useAuthenticatedAPI();

  return useQuery({
    queryKey: ["product-access", productId],
    queryFn: async (): Promise<ProductAccessResponse> => {
      if (!isAuthenticated) {
        throw new Error("User not authenticated");
      }
      
      const response = await get(`/api/products/${productId}/access`);
      if (!response.success) {
        throw new Error(response.error || "Failed to fetch product access");
      }
      
      return response.data;
    },
    enabled: !!productId && isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
}