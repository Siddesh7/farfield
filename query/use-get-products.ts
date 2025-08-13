import { useQuery } from "@tanstack/react-query";

export function useGetProducts(page: number = 1, limit: number = 10, category?: string) {
    return useQuery({
        queryKey: ["products", page, limit, category],
        queryFn: getProducts,
    });
}

const getProducts = async ({ queryKey }: { queryKey: [string, number, number, string?] }) => {
    const [, page, limit, category] = queryKey;
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
        return response.data;
    } catch (error) {
        throw new Error(`Error fetching products: ${error}`);
    }
};