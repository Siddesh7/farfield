import { useQuery } from "@tanstack/react-query";
import { useAuthenticatedAPI } from "@/lib/hooks/use-authenticated-fetch";

// Types for the product access response
export interface ProductAccessResponse {
  productId: string;
  productTitle: string;
  hasAccess: boolean;
  isCreator: boolean;
  hasPurchased: boolean;
  purchaseDetails: {
    purchaseId: string;
    purchasedAt: string;
    pricePaid: number;
    transactionHash: string;
  } | null;
  access: {
    canDownload: boolean;
    canView: boolean;
    canEdit: boolean;
  };
  downloadUrls: Array<{
    fileName: string;
    url: string;
    fileSize: number;
  }> | null;
  externalLinks: Array<{
    name: string;
    url: string;
    type: string;
  }> | null;
  previewFiles: Array<{
    fileName: string;
    url: string;
    fileSize: number;
  }> | null;
  previewLinks: Array<{
    name: string;
    url: string;
    type: string;
  }> | null;
  images: string[];
  creator: {
    fid: number;
    name: string;
    username: string;
    pfp: string | null;
    isSubscribed: boolean;
  } | null;
}

// Hook to check if the authenticated user has access to a product
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
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// // Convenience hook that returns just the access status
// export function useHasProductAccess(productId: string) {
//   const { data, isLoading, error } = useProductAccess(productId);
  
//   return {
//     hasAccess: data?.hasAccess ?? false,
//     isCreator: data?.isCreator ?? false,
//     hasPurchased: data?.hasPurchased ?? false,
//     canDownload: data?.access?.canDownload ?? false,
//     canView: data?.access?.canView ?? false,
//     canEdit: data?.access?.canEdit ?? false,
//     isLoading,
//     error,
//   };
// }
