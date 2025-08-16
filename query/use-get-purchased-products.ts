import { useQuery } from "@tanstack/react-query";
import { useAuthenticatedAPI } from "@/lib/hooks";

// Types for purchase history response
export interface PurchasedProduct {
    productId: string;
    price: number;
    product: {
        name: string;
        description: string;
        thumbnail: string | null;
        hasFiles: boolean;
    } | null;
}

export interface PurchaseHistoryItem {
    purchaseId: string;
    status: "pending" | "completed" | "failed" | "expired";
    totalAmount: number;
    platformFee: number;
    createdAt: string;
    completedAt?: string;
    expiresAt?: string;
    transactionHash?: string;
    items: PurchasedProduct[];
}

export interface PurchaseHistoryResponse {
    purchases: PurchaseHistoryItem[];
}

export function useGetPurchasedProducts({
    page = 1,
    limit = 10,
    status,
}: {
    page?: number;
    limit?: number;
    status?: "completed" | "pending" | "failed" | "expired";
} = {}) {
    const { get, isAuthenticated } = useAuthenticatedAPI();

    return useQuery<PurchaseHistoryItem[]>({
        queryKey: ["purchased-products", page, limit, status],
        enabled: isAuthenticated,
        queryFn: async () => {
            if (!isAuthenticated) {
                throw new Error("You must be logged in to view your purchased products.");
            }
            try {
                const params = new URLSearchParams({
                    page: String(page),
                    limit: String(limit),
                });
                if (status) params.append("status", status);
                const res = await get(`/api/purchase/history?${params.toString()}&status=completed`);
                if (!res.success) {
                    throw new Error(res.error || res.message || "Failed to fetch purchased products");
                }
                return res.data.purchases;
            } catch (error: any) {
                throw new Error(error.message || "Error fetching purchased products");
            }
        },
        retry: false,
    });
}
