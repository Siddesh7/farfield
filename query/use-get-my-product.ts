import { useQuery } from "@tanstack/react-query";
import { useAuthenticatedAPI } from "@/lib/hooks";
import type { Product } from "@/lib/types/product";
import type { PaginatedResponse } from "@/lib/types/api";

export function useGetMyProducts({
    page = 1,
    limit = 10,
    status = "all",
    sortBy = "createdAt",
    sortOrder = "desc",
}: {
    page?: number;
    limit?: number;
    status?: "all" | "published" | "draft";
    sortBy?: string;
    sortOrder?: "asc" | "desc";
} = {}) {
    const { get, isAuthenticated } = useAuthenticatedAPI();

    return useQuery<Product[]>({
        queryKey: ["my-products", page, limit, status, sortBy, sortOrder],
        enabled: isAuthenticated,
        queryFn: async () => {
            if (!isAuthenticated) {
                throw new Error("You must be logged in to view your products.");
            }
            try {
                const res = await get(
                    `/api/products/my?page=${page}&limit=${limit}&status=${status}&sort=${sortBy}&order=${sortOrder}`
                );
                if (!res.success) {
                    throw new Error(res.error || res.message || "Failed to fetch products");
                }
                return res.data;
            } catch (error: any) {
                throw new Error(error.message || "Error fetching your products");
            }
        },
        retry: false,
    });
}
