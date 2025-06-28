import { User } from "@/models/user";
import connectDB from "@/lib/db/connect";
import {
  ApiResponseBuilder,
  withErrorHandling,
  RequestValidator,
  API_MESSAGES,
} from "@/lib";
import { PublicUserResponse, UserSearchQuery } from "@/lib/types/user";

// GET /api/users/search - Search users with advanced filtering
async function searchUsersHandler(request: Request) {
  await connectDB();

  const url = new URL(request.url);
  const query: UserSearchQuery = {
    query: url.searchParams.get("query") || undefined,
    farcasterFid: url.searchParams.get("farcasterFid")
      ? parseInt(url.searchParams.get("farcasterFid")!)
      : undefined,
    username: url.searchParams.get("username") || undefined,
    displayName: url.searchParams.get("displayName") || undefined,
    page: parseInt(url.searchParams.get("page") || "1"),
    limit: parseInt(url.searchParams.get("limit") || "10"),
    sortBy: (url.searchParams.get("sortBy") as any) || "createdAt",
    sortOrder: (url.searchParams.get("sortOrder") as any) || "desc",
  };

  const validator = new RequestValidator();

  // Validate pagination parameters
  validator.number(query.page, "page", 1).number(query.limit, "limit", 1, 100);

  // Validate FID if provided
  if (query.farcasterFid !== undefined) {
    validator.number(query.farcasterFid, "farcasterFid", 1);
  }

  // Validate sort parameters
  const validSortFields = [
    "createdAt",
    "updatedAt",
    "farcasterFid",
    "displayName",
  ];
  const validSortOrders = ["asc", "desc"];

  if (!validSortFields.includes(query.sortBy!)) {
    return ApiResponseBuilder.error(
      `sortBy must be one of: ${validSortFields.join(", ")}`,
      400
    );
  }

  if (!validSortOrders.includes(query.sortOrder!)) {
    return ApiResponseBuilder.error(
      `sortOrder must be one of: ${validSortOrders.join(", ")}`,
      400
    );
  }

  if (!validator.isValid()) {
    return validator.getErrorResponse()!;
  }

  // Build search filter
  const filter: any = {};

  // Text search across multiple fields
  if (query.query) {
    filter.$or = [
      { "farcaster.displayName": { $regex: query.query, $options: "i" } },
      { "farcaster.username": { $regex: query.query, $options: "i" } },
      { "farcaster.bio": { $regex: query.query, $options: "i" } },
    ];
  }

  // Exact match filters
  if (query.farcasterFid !== undefined) {
    filter.farcasterFid = query.farcasterFid;
  }

  if (query.username) {
    filter["farcaster.username"] = { $regex: query.username, $options: "i" };
  }

  if (query.displayName) {
    filter["farcaster.displayName"] = {
      $regex: query.displayName,
      $options: "i",
    };
  }

  // Calculate pagination
  const skip = (query.page! - 1) * query.limit!;

  // Build sort object
  const sort: any = {};
  if (query.sortBy === "displayName") {
    sort["farcaster.displayName"] = query.sortOrder === "asc" ? 1 : -1;
  } else {
    sort[query.sortBy!] = query.sortOrder === "asc" ? 1 : -1;
  }

  // Execute search with pagination
  const [users, total] = await Promise.all([
    User.find(filter).sort(sort).skip(skip).limit(query.limit!).exec(),
    User.countDocuments(filter),
  ]);

  // Transform to public user data
  const publicUsers: PublicUserResponse[] = users.map((user: any) => {
    const publicUser = user.toPublicJSON();

    // Find primary wallet or use first wallet for public display
    const primaryWallet =
      publicUser.wallets.find((w: any) => w.isPrimary) || publicUser.wallets[0];

    return {
      ...publicUser,
      wallets: primaryWallet
        ? [
            {
              address: primaryWallet.address,
              chainType: primaryWallet.chainType,
            },
          ]
        : [],
    };
  });

  const totalPages = Math.ceil(total / query.limit!);

  return ApiResponseBuilder.paginated(
    publicUsers,
    query.page!,
    query.limit!,
    total,
    "Search completed successfully"
  );
}

export const GET = withErrorHandling(searchUsersHandler);
