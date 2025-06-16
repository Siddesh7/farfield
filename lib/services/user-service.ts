import mongoose from "mongoose";
import { User, IUser } from "@/models/user";
import { User as UserType } from "@/lib/types/user";

export class UserService {
  // Create a new user
  static async createUser(
    userData: Omit<UserType, "_id" | "createdAt" | "updatedAt">
  ): Promise<IUser> {
    try {
      const existingUser = await User.findOne({ privyId: userData.privyId });
      if (existingUser) {
        throw new Error("User with this Privy ID already exists");
      }

      const existingFarcasterUser = await User.findOne({
        farcasterFid: userData.farcasterFid,
      });
      if (existingFarcasterUser) {
        throw new Error("User with this Farcaster FID already exists");
      }

      const existingUsernameUser = await User.findOne({
        "farcaster.username": userData.farcaster.username,
      });
      if (existingUsernameUser) {
        throw new Error("User with this username already exists");
      }

      const user = new User(userData);
      await user.save();
      return user;
    } catch (error) {
      if (error instanceof mongoose.Error.ValidationError) {
        throw new Error(`Validation error: ${error.message}`);
      }
      throw error;
    }
  }

  // Get user by ID
  static async getUserById(id: string): Promise<IUser | null> {
    try {
      return await User.findById(id);
    } catch (error) {
      throw new Error(`Error fetching user: ${error}`);
    }
  }

  // Get user by Privy ID
  static async getUserByPrivyId(privyId: string): Promise<IUser | null> {
    try {
      return await User.findOne({ privyId });
    } catch (error) {
      throw new Error(`Error fetching user by Privy ID: ${error}`);
    }
  }

  // Get user by Farcaster FID
  static async getUserByFarcasterFid(
    farcasterFid: number
  ): Promise<IUser | null> {
    try {
      return await User.findOne({ farcasterFid });
    } catch (error) {
      throw new Error(`Error fetching user by Farcaster FID: ${error}`);
    }
  }

  // Get user by wallet address
  static async getUserByWalletAddress(address: string): Promise<IUser | null> {
    try {
      return await User.findOne({ "wallet.address": address });
    } catch (error) {
      throw new Error(`Error fetching user by wallet address: ${error}`);
    }
  }

  // Get user by username
  static async getUserByUsername(username: string): Promise<IUser | null> {
    try {
      return await User.findOne({ "farcaster.username": username });
    } catch (error) {
      throw new Error(`Error fetching user by username: ${error}`);
    }
  }

  // Get all users with pagination
  static async getAllUsers(
    page: number = 1,
    limit: number = 10,
    sortBy: string = "createdAt",
    sortOrder: "asc" | "desc" = "desc"
  ): Promise<{ users: IUser[]; total: number; page: number; pages: number }> {
    try {
      const skip = (page - 1) * limit;
      const sortOptions: any = {};
      sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

      const [users, total] = await Promise.all([
        User.find({}).sort(sortOptions).skip(skip).limit(limit).exec(),
        User.countDocuments({}),
      ]);

      const pages = Math.ceil(total / limit);

      return {
        users,
        total,
        page,
        pages,
      };
    } catch (error) {
      throw new Error(`Error fetching users: ${error}`);
    }
  }

  // Update user
  static async updateUser(
    id: string,
    updateData: Partial<Omit<UserType, "_id" | "createdAt" | "updatedAt">>
  ): Promise<IUser | null> {
    try {
      const user = await User.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      );
      return user;
    } catch (error) {
      if (error instanceof mongoose.Error.ValidationError) {
        throw new Error(`Validation error: ${error.message}`);
      }
      throw new Error(`Error updating user: ${error}`);
    }
  }

  // Delete user
  static async deleteUser(id: string): Promise<boolean> {
    try {
      const result = await User.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      throw new Error(`Error deleting user: ${error}`);
    }
  }

  // Check if user exists
  static async userExists(privyId: string): Promise<boolean> {
    try {
      const user = await User.findOne({ privyId });
      return !!user;
    } catch (error) {
      throw new Error(`Error checking user existence: ${error}`);
    }
  }
}
