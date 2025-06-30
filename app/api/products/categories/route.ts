import { Product } from "@/models/product";
import connectDB from "@/lib/db/connect";
import { ApiResponseBuilder, withErrorHandling } from "@/lib";

// GET /api/products/categories - Get all product categories with counts (Public)
async function getCategoriesHandler(request: Request) {
  await connectDB();

  try {
    // Aggregate categories with product counts (only published products)
    const categoryAggregation = await Product.aggregate([
      {
        $match: {
          publishedAt: { $ne: null }, // Only published products
        },
      },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          totalProducts: { $sum: 1 },
          freeProducts: {
            $sum: {
              $cond: [{ $eq: ["$isFree", true] }, 1, 0],
            },
          },
          paidProducts: {
            $sum: {
              $cond: [{ $eq: ["$isFree", false] }, 1, 0],
            },
          },
          averagePrice: {
            $avg: {
              $cond: [{ $eq: ["$isFree", false] }, "$price", null],
            },
          },
          averageRating: { $avg: "$ratingsScore" },
        },
      },
      {
        $project: {
          _id: 0,
          category: "$_id",
          count: 1,
          totalProducts: 1,
          freeProducts: 1,
          paidProducts: 1,
          averagePrice: { $round: ["$averagePrice", 2] },
          averageRating: { $round: ["$averageRating", 1] },
        },
      },
      {
        $sort: { count: -1 }, // Sort by product count (most popular first)
      },
    ]);

    // Get total product count for percentage calculations
    const totalProducts = await Product.countDocuments({
      publishedAt: { $ne: null },
    });

    // Add percentage to each category
    const categoriesWithPercentages = categoryAggregation.map((cat) => ({
      ...cat,
      percentage:
        totalProducts > 0 ? Math.round((cat.count / totalProducts) * 100) : 0,
    }));

    // Get some additional stats
    const stats = {
      totalCategories: categoryAggregation.length,
      totalProducts,
      categories: categoriesWithPercentages,
    };

    return ApiResponseBuilder.success(
      stats,
      "Product categories retrieved successfully"
    );
  } catch (error) {
    console.error("Error fetching categories:", error);
    return ApiResponseBuilder.error("Failed to fetch categories", 500);
  }
}

export const GET = withErrorHandling(getCategoriesHandler);
