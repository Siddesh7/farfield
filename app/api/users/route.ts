import { User } from "@/models/user";
import connectDB from "@/lib/db/connect";
import {
  ApiResponseBuilder,
  withErrorHandling,
  RequestValidator,
  API_MESSAGES,
} from "@/lib";
import { PublicUserResponse, UserListQuery } from "@/lib/types/user";

// GET /api/users - List users with pagination and filtering
async function getUsersHandler(request: Request) {
  await connectDB();

  const url = new URL(request.url);
  const query: UserListQuery = {
    page: parseInt(url.searchParams.get("page") || "1"),
    limit: parseInt(url.searchParams.get("limit") || "10"),
    sortBy: (url.searchParams.get("sortBy") as any) || "createdAt",
    sortOrder: (url.searchParams.get("sortOrder") as any) || "desc",
    chainType: url.searchParams.get("chainType") || undefined,
  };

  const validator = new RequestValidator();

  // Validate pagination parameters
  validator.number(query.page, "page", 1).number(query.limit, "limit", 1, 100);

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

  // Build filter object
  const filter: any = {};

  // Filter by chain type (check primary wallet)
  if (query.chainType) {
    filter["wallets"] = {
      $elemMatch: {
        isPrimary: true,
        chainType: query.chainType,
      },
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

  // Execute query with pagination
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
    "Users retrieved successfully"
  );
}

export const GET = withErrorHandling(getUsersHandler);
