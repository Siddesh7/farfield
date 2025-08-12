import { useQuery } from "@tanstack/react-query";
import { CategoriesType } from "../lib/types/global";

export function useGetProducts(page: number = 1, limit: number = 10, category?: string) {
    return useQuery({
        queryKey: ["products", page, limit, category],
        queryFn: getProducts,
    });
}

const getProducts = async ({ queryKey }: { queryKey: [string, number, number, string?] }) => {
    const [, page, limit, category] = queryKey;
    try {
        let url = `/api/products?page=${page}&limit=${limit}`;
        if (category && category !== "All") {
            url += `&category=${encodeURIComponent(category)}`;
        }
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch products");
        const response = await res.json();
        return response.data;
    } catch (error) {
        throw new Error(`Error fetching products: ${error}`);
    }
};