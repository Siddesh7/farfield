import { useQuery } from "@tanstack/react-query";

interface SearchProductsParams {
  query: string;
  page?: number;
  limit?: number;
  category?: string;
  enabled?: boolean;
}

export function useSearchProducts({ 
  query, 
  page = 1, 
  limit = 10, 
  category,
  enabled = true 
}: SearchProductsParams) {
  return useQuery({
    queryKey: ["search-products", query, page, limit, category],
    queryFn: () => searchProducts(query, page, limit, category),
    enabled: enabled && !!query.trim(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

const searchProducts = async (
  query: string, 
  page: number, 
  limit: number, 
  category?: string
) => {
  try {
    const params = new URLSearchParams({
      q: query,
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (category && category !== 'All') {
      params.append('category', category);
    }
    
    const res = await fetch(`/api/products/search?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to search products");
    const response = await res.json();
    return response.data || [];
  } catch (error) {
    throw new Error(`Error searching products: ${error}`);
  }
};
