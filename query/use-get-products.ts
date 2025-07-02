import { useQuery } from "@tanstack/react-query";

export function useGetProducts(page: number = 1, limit: number = 10) {
    return useQuery({
        queryKey: ["products", page, limit],
        queryFn: getProducts,
    });
}

const getProducts = async ({ queryKey }: { queryKey: [string, number, number] }) => {
    const [, page, limit] = queryKey;
    try {
        const res = await fetch(`/api/products?page=${page}&limit=${limit}`);
        if (!res.ok) throw new Error("Failed to fetch products");
        const response = await res.json();
        return response.data;
    } catch (error) {
        throw new Error(`Error fetching products: ${error}`);
    }
};