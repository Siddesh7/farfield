import { useQuery } from "@tanstack/react-query";
import type { ApiResponse } from "@/lib/types/api";
import type { Product } from "@/lib/types/product";

export function useGetProductById(productId: string) {
    return useQuery({
        queryKey: ["product", productId],
        queryFn: async (): Promise<Product> => {
            if (!productId) throw new Error("Product ID is required");
            
            const res = await fetch(`/api/products/${productId}`);
            
            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`Failed to fetch product: ${res.status} ${res.statusText}`);
            }
            
            const response: ApiResponse<Product> = await res.json();
            
            if (!response.success) {
                throw new Error(response.error || "Failed to fetch product");
            }
            
            if (!response.data) {
                throw new Error("No product data received");
            }
            
            return response.data;
        },
        enabled: !!productId,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}
