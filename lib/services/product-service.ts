import mongoose from "mongoose";
import { Product, IProduct } from "@/models/product";
import { Product as ProductType } from "@/lib/types/product";

export class ProductService {
  // Create a new product
  static async createProduct(
    productData: Omit<ProductType, "_id" | "createdAt" | "updatedAt">
  ): Promise<IProduct> {
    try {
      // Check if slug is provided and if it already exists
      if (productData.slug) {
        const existingProduct = await Product.findOne({
          slug: productData.slug,
        });
        if (existingProduct) {
          throw new Error("Product with this slug already exists");
        }
      }

      const product = new Product(productData);
      await product.save();
      return product;
    } catch (error) {
      if (error instanceof mongoose.Error.ValidationError) {
        throw new Error(`Validation error: ${error.message}`);
      }
      throw error;
    }
  }

  // Get product by ID
  static async getProductById(id: string): Promise<IProduct | null> {
    try {
      return await Product.findById(id);
    } catch (error) {
      throw new Error(`Error fetching product: ${error}`);
    }
  }

  // Get product by slug
  static async getProductBySlug(slug: string): Promise<IProduct | null> {
    try {
      return await Product.findOne({ slug });
    } catch (error) {
      throw new Error(`Error fetching product by slug: ${error}`);
    }
  }

  // Get products by creator FID
  static async getProductsByCreatorFid(
    creatorFid: number
  ): Promise<IProduct[]> {
    try {
      return await Product.find({ creatorFid }).sort({ createdAt: -1 });
    } catch (error) {
      throw new Error(`Error fetching products by creator FID: ${error}`);
    }
  }

  // Get products by category
  static async getProductsByCategory(category: string): Promise<IProduct[]> {
    try {
      return await Product.find({ category }).sort({ ratingsScore: -1 });
    } catch (error) {
      throw new Error(`Error fetching products by category: ${error}`);
    }
  }

  // Get free products
  static async getFreeProducts(): Promise<IProduct[]> {
    try {
      return await Product.find({ isFree: true }).sort({ ratingsScore: -1 });
    } catch (error) {
      throw new Error(`Error fetching free products: ${error}`);
    }
  }

  // Get products in price range
  static async getProductsByPriceRange(
    minPrice: number,
    maxPrice: number
  ): Promise<IProduct[]> {
    try {
      return await Product.find({
        price: { $gte: minPrice, $lte: maxPrice },
      }).sort({ ratingsScore: -1 });
    } catch (error) {
      throw new Error(`Error fetching products by price range: ${error}`);
    }
  }

  // Search products
  static async searchProducts(
    query: string,
    filters: {
      category?: string;
      isFree?: boolean;
      minPrice?: number;
      maxPrice?: number;
      tags?: string[];
    } = {}
  ): Promise<IProduct[]> {
    try {
      const searchQuery: any = {};

      // Text search
      if (query) {
        searchQuery.$text = { $search: query };
      }

      // Apply filters
      if (filters.category) {
        searchQuery.category = filters.category;
      }

      if (filters.isFree !== undefined) {
        searchQuery.isFree = filters.isFree;
      }

      if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
        searchQuery.price = {};
        if (filters.minPrice !== undefined) {
          searchQuery.price.$gte = filters.minPrice;
        }
        if (filters.maxPrice !== undefined) {
          searchQuery.price.$lte = filters.maxPrice;
        }
      }

      if (filters.tags && filters.tags.length > 0) {
        searchQuery.tags = { $in: filters.tags };
      }

      const sortOptions: any = {};
      if (query) {
        sortOptions.score = { $meta: "textScore" };
      } else {
        sortOptions.ratingsScore = -1;
      }

      return await Product.find(searchQuery).sort(sortOptions);
    } catch (error) {
      throw new Error(`Error searching products: ${error}`);
    }
  }

  // Get all products with pagination
  static async getAllProducts(
    page: number = 1,
    limit: number = 10,
    sortBy: string = "createdAt",
    sortOrder: "asc" | "desc" = "desc",
    filters: {
      category?: string;
      isFree?: boolean;
      creatorFid?: number;
    } = {}
  ): Promise<{
    products: IProduct[];
    total: number;
    page: number;
    pages: number;
  }> {
    try {
      const skip = (page - 1) * limit;
      const sortOptions: any = {};
      sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

      // Build filter query
      const filterQuery: any = {};
      if (filters.category) {
        filterQuery.category = filters.category;
      }
      if (filters.isFree !== undefined) {
        filterQuery.isFree = filters.isFree;
      }
      if (filters.creatorFid) {
        filterQuery.creatorFid = filters.creatorFid;
      }

      const [products, total] = await Promise.all([
        Product.find(filterQuery)
          .sort(sortOptions)
          .skip(skip)
          .limit(limit)
          .exec(),
        Product.countDocuments(filterQuery),
      ]);

      const pages = Math.ceil(total / limit);

      return {
        products,
        total,
        page,
        pages,
      };
    } catch (error) {
      throw new Error(`Error fetching products: ${error}`);
    }
  }

  // Update product
  static async updateProduct(
    id: string,
    updateData: Partial<Omit<ProductType, "_id" | "createdAt" | "updatedAt">>
  ): Promise<IProduct | null> {
    try {
      // Check if slug is being updated and if it already exists
      if (updateData.slug) {
        const existingProduct = await Product.findOne({
          slug: updateData.slug,
          _id: { $ne: id },
        });
        if (existingProduct) {
          throw new Error("Product with this slug already exists");
        }
      }

      const product = await Product.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      );
      return product;
    } catch (error) {
      if (error instanceof mongoose.Error.ValidationError) {
        throw new Error(`Validation error: ${error.message}`);
      }
      throw new Error(`Error updating product: ${error}`);
    }
  }

  // Delete product
  static async deleteProduct(id: string): Promise<boolean> {
    try {
      const result = await Product.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      throw new Error(`Error deleting product: ${error}`);
    }
  }

  // Add comment to product
  static async addComment(
    productId: string,
    commentorFid: number,
    comment: string
  ): Promise<IProduct | null> {
    try {
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error("Product not found");
      }

      await product.addComment(commentorFid, comment);
      return product;
    } catch (error) {
      throw new Error(`Error adding comment: ${error}`);
    }
  }

  // Add rating to product
  static async addRating(
    productId: string,
    rating: number
  ): Promise<IProduct | null> {
    try {
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error("Product not found");
      }

      if (rating < 1 || rating > 5) {
        throw new Error("Rating must be between 1 and 5");
      }

      await product.addRating(rating);
      return product;
    } catch (error) {
      throw new Error(`Error adding rating: ${error}`);
    }
  }

  // Record purchase
  static async recordPurchase(
    productId: string,
    buyerFid: number
  ): Promise<IProduct | null> {
    try {
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error("Product not found");
      }

      await product.recordPurchase(buyerFid);
      return product;
    } catch (error) {
      throw new Error(`Error recording purchase: ${error}`);
    }
  }

  // Check if user has purchased product
  static async hasUserPurchased(
    productId: string,
    userFid: number
  ): Promise<boolean> {
    try {
      const product = await Product.findById(productId);
      if (!product) {
        return false;
      }

      return product.buyer.some((b: any) => b.fid === userFid);
    } catch (error) {
      throw new Error(`Error checking purchase status: ${error}`);
    }
  }

  // Get trending products (high ratings and recent sales)
  static async getTrendingProducts(limit: number = 10): Promise<IProduct[]> {
    try {
      return await Product.find({})
        .sort({
          ratingsScore: -1,
          totalSold: -1,
          createdAt: -1,
        })
        .limit(limit);
    } catch (error) {
      throw new Error(`Error fetching trending products: ${error}`);
    }
  }

  // Get recently added products
  static async getRecentProducts(limit: number = 10): Promise<IProduct[]> {
    try {
      return await Product.find({}).sort({ createdAt: -1 }).limit(limit);
    } catch (error) {
      throw new Error(`Error fetching recent products: ${error}`);
    }
  }

  // Check if product exists
  static async productExists(id: string): Promise<boolean> {
    try {
      const product = await Product.findById(id);
      return !!product;
    } catch (error) {
      throw new Error(`Error checking product existence: ${error}`);
    }
  }
}
