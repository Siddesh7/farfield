import { Product } from "@/models/product";
import { User } from "@/models/user";
import { Purchase } from "@/models/purchase";
import connectDB from "@/lib/db/connect";
import { ApiResponseBuilder, withErrorHandling, RequestValidator } from "@/lib";
import { PipelineStage } from "mongoose";

// Helper function to get featured products with complete user info
async function getFeaturedProductsWithMetadata(categoryFilter?: string, limit: number = 3) {
  // Build the base match criteria
  const matchCriteria: any = {
    publishedAt: { $ne: null }, // Only published products
  };

  if (categoryFilter) {
    matchCriteria.category = categoryFilter;
  }

  // Aggregation pipeline to get featured products
  const pipeline: PipelineStage[] = [
    {
      $match: matchCriteria,
    },
    {
      // First, prioritize products with ratings, sorted by highest rating
      $addFields: {
        hasRating: { $gt: ["$totalRatings", 0] },
        sortPriority: {
          $cond: [
            { $gt: ["$totalRatings", 0] },
            "$ratingsScore",
            -1, // Unrated products get -1 to sort after rated ones
          ],
        },
      },
    },
    {
      $sort: {
        hasRating: -1, // Rated products first
        sortPriority: -1, // Then by rating score (highest first)
        _id: 1, // For consistent ordering of unrated products
      },
    },
    {
      $limit: limit,
    },
  ];

  const featuredProducts = await Product.aggregate(pipeline);

  // If we have fewer than the desired limit, we need to handle the fallback
  if (featuredProducts.length < limit) {
    // Count total available products to see if we can fill the gap
    const totalCount = await Product.countDocuments(matchCriteria);
    
    if (totalCount > featuredProducts.length) {
      // Get remaining products randomly to fill up to the limit
      const remainingLimit = limit - featuredProducts.length;
      const featuredIds = featuredProducts.map(p => p._id);
      
      const additionalProducts = await Product.aggregate([
        {
          $match: {
            ...matchCriteria,
            _id: { $nin: featuredIds },
          },
        },
        { $sample: { size: remainingLimit } },
      ]);
      
      featuredProducts.push(...additionalProducts);
    }
  }

  // If no products found, return empty array
  if (featuredProducts.length === 0) {
    return [];
  }

  // Transform to public product data (remove sensitive fields)
  const publicProducts = featuredProducts.map((product: any) => {
    delete product.buyer;
    delete product.hasRating;
    delete product.sortPriority;
    return product;
  });

  // Batch fetch creator info for all products
  const uniqueFids = [...new Set(publicProducts.map((p: any) => p.creatorFid))];
  const users = await User.find({ farcasterFid: { $in: uniqueFids } });
  const userMap = new Map(
    users.map((u) => [
      u.farcasterFid,
      {
        fid: u.farcasterFid,
        name: u.farcaster.displayName,
        username: u.farcaster.username,
        pfp: u.farcaster.pfp || null,
        isVerified: u.isVerified,
      },
    ])
  );

  // Attach creator info to each product
  const productsWithCreator = publicProducts.map((product: any) => {
    const creator = userMap.get(product.creatorFid) || null;
    return {
      ...product,
      creator,
    };
  });

  // Collect all commentorFids for preview comments across all products
  const allPreviewComments = productsWithCreator.flatMap((product: any) => {
    const comments = product.comments || [];
    return comments
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3)
      .map((c: any) => ({ ...c, productId: product._id }));
  });
  
  const allCommentorFids = [...new Set(allPreviewComments.map((c: any) => c.commentorFid))];
  const allCommentUsers = await User.find({ farcasterFid: { $in: allCommentorFids } });
  const allCommentUserMap = new Map(
    allCommentUsers.map((u) => [
      u.farcasterFid,
      {
        fid: u.farcasterFid,
        name: u.farcaster.displayName,
        username: u.farcaster.username,
        pfp: u.farcaster.pfp || null,
        isVerified: u.isVerified,
      },
    ])
  );

  // Batch fetch recent buyers for all products
  const productIds = productsWithCreator.map((p: any) => p._id.toString());
  const allCompletedPurchases = await Purchase.find({
    "items.productId": { $in: productIds },
    status: "completed",
    blockchainVerified: true,
  }).sort({ completedAt: -1 });

  // Group purchases by product and get latest 3 buyers per product
  const buyersByProduct = new Map();
  allCompletedPurchases.forEach((purchase) => {
    purchase.items.forEach((item: any) => {
      if (productIds.includes(item.productId)) {
        if (!buyersByProduct.has(item.productId)) {
          buyersByProduct.set(item.productId, []);
        }
        const existingBuyers = buyersByProduct.get(item.productId);
        if (!existingBuyers.find((b: any) => b.buyerFid === purchase.buyerFid)) {
          existingBuyers.push({
            buyerFid: purchase.buyerFid,
            completedAt: purchase.completedAt,
          });
        }
      }
    });
  });

  // Limit to 3 buyers per product and fetch user info
  const allBuyerFids = new Set();
  buyersByProduct.forEach((buyers, productId) => {
    const latestBuyers = buyers.slice(0, 3);
    buyersByProduct.set(productId, latestBuyers);
    latestBuyers.forEach((buyer: any) => allBuyerFids.add(buyer.buyerFid));
  });

  const allBuyerUsers = await User.find({ farcasterFid: { $in: Array.from(allBuyerFids) } });
  const allBuyerUserMap = new Map(
    allBuyerUsers.map((u) => [
      u.farcasterFid,
      {
        fid: u.farcasterFid,
        name: u.farcaster.displayName,
        username: u.farcaster.username,
        pfp: u.farcaster.pfp || null,
        isVerified: u.isVerified,
      },
    ])
  );

  // Attach commentsPreview and buyers to each product
  const productsWithCommentsAndBuyers = productsWithCreator.map((product: any) => {
    const productComments = product.comments || [];
    const latestComments = productComments
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3);
    
    const commentsPreview = latestComments.map((comment: any) => ({
      _id: comment._id,
      commentorFid: comment.commentorFid,
      comment: comment.comment,
      createdAt: comment.createdAt,
      commentor: allCommentUserMap.get(comment.commentorFid) || null,
    }));

    // Get buyers for this product
    const productBuyers = buyersByProduct.get(product._id.toString()) || [];
    const buyers = productBuyers
      .map((buyer: any) => {
        const buyerInfo = allBuyerUserMap.get(buyer.buyerFid);
        return buyerInfo
          ? {
              fid: buyerInfo.fid,
              username: buyerInfo.username,
              pfp: buyerInfo.pfp,
              name: buyerInfo.name,
            }
          : null;
      })
      .filter(Boolean);

    // Remove sensitive fields from product
    const { creatorFid, comments, buyer, ...rest } = product;
    return {
      ...rest,
      commentsPreview,
      buyers,
    };
  });

  return productsWithCommentsAndBuyers;
}

// GET /api/products/category/[category]/featured - Get top 3 featured products within a specific category (Public)
async function getCategoryFeaturedProductsHandler(
  request: Request,
  { params }: { params: Promise<{ category: string }> }
) {
  await connectDB();

  const { category } = await params;

  const validator = new RequestValidator();
  validator.required(category, "category").string(category, "category", 1, 100);

  if (!validator.isValid()) {
    return validator.getErrorResponse()!;
  }

  try {
    // First check if the category exists
    const categoryExists = await Product.countDocuments({
      category: category,
      publishedAt: { $ne: null },
    });

    if (categoryExists === 0) {
      return ApiResponseBuilder.notFound(
        `Category "${category}" not found or has no published products`
      );
    }

    const featuredProducts = await getFeaturedProductsWithMetadata(category);

    return ApiResponseBuilder.success(
      featuredProducts,
      `Featured products in "${category}" category retrieved successfully`
    );
  } catch (error) {
    console.error("Error fetching category featured products:", error);
    return ApiResponseBuilder.error("Failed to fetch featured products", 500);
  }
}

export const GET = withErrorHandling(getCategoryFeaturedProductsHandler);
