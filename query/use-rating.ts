import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthenticatedAPI } from "@/lib/hooks";
import { toast } from "sonner";

interface RatingResponse {
  averageRating: number;
  totalRatings: number;
  ratingsBreakdown: Record<string, number>;
  userRating: number;
}

export function useSubmitRating() {
  const { post, isAuthenticated } = useAuthenticatedAPI();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, rating }: { productId: string; rating: number }) => {
      if (!isAuthenticated) {
        throw new Error("You must be logged in to rate a product.");
      }

      if (rating < 1 || rating > 5) {
        throw new Error("Rating must be between 1 and 5.");
      }

      try {
        const res = await post(`/api/products/${productId}/ratings`, {
          rating,
        });

        if (!res.success) {
          throw new Error(res.error || res.message || "Failed to submit rating");
        }

        return res.data as RatingResponse;
      } catch (error: any) {
        throw new Error(error.message || "Error submitting rating");
      }
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ["product", variables.productId] });
      queryClient.invalidateQueries({ queryKey: ["product-ratings", variables.productId] });
      queryClient.invalidateQueries({ queryKey: ["products"] }); // This will invalidate all product lists
      
      toast.success("Thank you for your rating!");
    },
    onError: (error: Error) => {
      console.error("Submit rating error:", error);
      toast.error(error.message || "Failed to submit rating");
    },
  });
}
