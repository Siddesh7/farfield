import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthenticatedAPI } from "@/lib/hooks/use-authenticated-fetch";

interface ConfirmPurchaseRequest {
  purchaseId: string;
  transactionHash: string;
}

interface ConfirmPurchaseResponse {
  purchaseId: string;
  status: "completed";
  transactionHash: string;
  completedAt: string;
  items: Array<{
    productId: string;
    price: number;
  }>;
  totalAmount: number;
  platformFee: number;
  blockchain: {
    blockchainTimestamp: number;
    verified: boolean;
  };
}

export function usePurchaseConfirm() {
  const { post, isAuthenticated } = useAuthenticatedAPI();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ConfirmPurchaseRequest): Promise<ConfirmPurchaseResponse> => {
      if (!isAuthenticated) {
        throw new Error("User not authenticated");
      }
      
      const response = await post('/api/purchase/confirm', data);
      
      if (!response.success) {
        throw new Error(response.error || "Failed to confirm purchase");
      }
      
      return response.data;
    },
    onSuccess: () => {
      // Invalidate all product access queries after successful purchase confirmation
      queryClient.invalidateQueries({
        queryKey: ["product-access"]
      });
      
      // Invalidate purchased products queries to show new purchases
      queryClient.invalidateQueries({
        queryKey: ["purchased-products"]
      });
      
      // Invalidate products queries to refresh the product list
      queryClient.invalidateQueries({
        queryKey: ["products"]
      });
      queryClient.invalidateQueries({
        queryKey: ["products-infinite"]
      });
    },
  });
}
