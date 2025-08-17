import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthenticatedAPI } from "@/lib/hooks";
import { toast } from "sonner";

export function useDeleteProduct() {
    const { delete: deleteAPI, isAuthenticated } = useAuthenticatedAPI();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (productId: string) => {
            if (!isAuthenticated) {
                throw new Error("You must be logged in to delete a product.");
            }
            
            try {
                const res = await deleteAPI(`/api/products/${productId}`);
                if (!res.success) {
                    throw new Error(res.error || res.message || "Failed to delete product");
                }
                return res.data;
            } catch (error: any) {
                throw new Error(error.message || "Error deleting product");
            }
        },
        onSuccess: (data, productId) => {
            queryClient.invalidateQueries({ queryKey: ["my-products"] });
            queryClient.invalidateQueries({ queryKey: ["products"] });
            toast.success("Product deleted successfully");
        },
        onError: (error: Error) => {
            console.error("Delete product error:", error);
            toast.error(error.message || "Failed to delete product");
        },
    });
}
