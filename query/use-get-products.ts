import { useQuery, useInfiniteQuery } from "@tanstack/react-query";

// Keep the original hook for backward compatibility
export function useGetProducts(page: number = 1, limit: number = 10, category?: string) {
    return useQuery({
        queryKey: ["products", page, limit, category],
        queryFn: getProducts,
        staleTime: 0, // Always refetch when switching categories
        refetchOnMount: true,
    });
}

// New infinite query hook for pagination
export function useGetProductsInfinite(limit: number = 10, category?: string) {
    return useInfiniteQuery({
        queryKey: ["products-infinite", limit, category],
        queryFn: ({ pageParam = 1 }) => getProductsPage(pageParam, limit, category),
        getNextPageParam: (lastPage, allPages) => {
            // If the last page has fewer items than the limit, we've reached the end
            if (lastPage.length < limit) {
                return undefined;
            }
            // Otherwise, return the next page number
            return allPages.length + 1;
        },
        initialPageParam: 1,
    });
}

const getProducts = async ({ queryKey }: { queryKey: [string, number, number, string?] }) => {
    const [, page, limit, category] = queryKey;
    return getProductsPage(page, limit, category);
};

const getProductsPage = async (page: number, limit: number, category?: string) => {
    try {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
        });
        
        if (category && category !== 'All') {
            params.append('category', category);
        }
        
        const res = await fetch(`/api/products?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch products");
        const response = await res.json();
        return response.data || [];
    } catch (error) {
        throw new Error(`Error fetching products: ${error}`);
    }
};