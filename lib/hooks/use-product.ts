import { useQuery } from '@tanstack/react-query';

export function useProduct(queryString: string) {
    return useQuery({
        queryKey: ['products', queryString],
        queryFn: async () => {
            try {
                const res = await fetch(`/api/products?${queryString}`);
                if (!res.ok) throw new Error('Failed to fetch products');
                const response = await res.json();

                return response.data;
            } catch (error) {
                throw new Error(`Error fetching products: ${error}`)
            }
        },
    });
} 