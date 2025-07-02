import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthenticatedAPI } from "@/lib/hooks/use-authenticated-fetch";
import type { PaginatedResponse, ApiResponse } from "@/lib/types/api";
import type { Product } from "@/lib/types/product";

// Type for a single comment
export type ProductComment = Product["comments"][number];

// GET: Fetch comments for a product (public)
export function useGetProductComments(productId: string, page: number = 1, limit: number = 10) {
    return useQuery({
        queryKey: ["product-comments", productId, page, limit],
        queryFn: async () => {
            const res = await fetch(`/api/products/${productId}/comments?page=${page}&limit=${limit}`);
            if (!res.ok) throw new Error("Failed to fetch comments");
            const response: PaginatedResponse<ProductComment> = await res.json();
            return response;
        },
        enabled: !!productId,
    });
}

// POST: Add a comment to a product (protected)
export function useAddProductComment(productId: string) {
    const { post, isAuthenticated } = useAuthenticatedAPI();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (comment: string) => {
            if (!isAuthenticated) throw new Error("User not authenticated");
            const response: ApiResponse<ProductComment> = await post(`/api/products/${productId}/comments`, { comment });
            if (!response.success) throw new Error(response.error || "Failed to add comment");
            return response.data;
        },
        onSuccess: () => {
            // Invalidate and refetch comments for this product
            queryClient.invalidateQueries({ queryKey: ["product-comments", productId] });
        },
    });
}
