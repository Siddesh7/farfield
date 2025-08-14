export const API_MESSAGES = {
  // User messages
  USER_CREATED_SUCCESS: "User created successfully",
  USER_UPDATED_SUCCESS: "User updated successfully",
  USER_DELETED_SUCCESS: "User deleted successfully",
  USER_NOT_FOUND: "User not found",
  USER_ALREADY_EXISTS: "User with this Privy ID already exists",
  FARCASTER_USER_EXISTS: "User with this Farcaster FID already exists",
  USERNAME_EXISTS: "User with this username already exists",
  WALLET_ADDRESS_EXISTS: "User with this wallet address already exists",

  // Profile messages
  PROFILE_UPDATED_SUCCESS: "Profile updated successfully",
  FARCASTER_UPDATED_SUCCESS: "Farcaster profile updated successfully",
  FARCASTER_SYNC_SUCCESS: "Farcaster data synced successfully",
  WALLET_UPDATED_SUCCESS: "Wallet updated successfully",
  WALLET_VERIFIED_SUCCESS: "Wallet verified successfully",
  WALLET_VERIFICATION_FAILED: "Wallet verification failed",

  // Authentication messages
  UNAUTHORIZED: "Unauthorized access",
  INVALID_PRIVY_TOKEN: "Invalid Privy token",
  TOKEN_REQUIRED: "Authentication token required",

  // Validation messages
  MISSING_REQUIRED_FIELD: "Missing required field",
  INVALID_FARCASTER_FID: "farcasterFid must be a number",
  INVALID_FID_FORMAT: "Invalid farcasterFid format",
  INVALID_PAGE: "Page must be greater than 0",
  INVALID_LIMIT: "Limit must be between 1 and 100",
  INVALID_SORT_ORDER: "Sort order must be 'asc' or 'desc'",
  INVALID_EMAIL_FORMAT: "Invalid email format",
  INVALID_WALLET_ADDRESS: "Invalid wallet address format",
  INVALID_USER_ID: "Invalid user ID format",

  // Search messages
  USERS_RETRIEVED_SUCCESS: "Users retrieved successfully",
  SEARCH_COMPLETED_SUCCESS: "Search completed successfully",
  NO_USERS_FOUND: "No users found matching the criteria",

  // Notification messages
  NOTIFICATIONS_RETRIEVED_SUCCESS: "Notifications retrieved successfully",
  NOTIFICATIONS_MARKED_READ_SUCCESS: "All notifications marked as read",
  NO_NOTIFICATIONS_FOUND: "No notifications found",
  NOTIFICATION_CREATED_SUCCESS: "Notification created successfully",

  // Generic messages
  INTERNAL_SERVER_ERROR: "Internal server error",
  VALIDATION_ERROR: "Validation error",
  DATABASE_ERROR: "Database operation failed",
  FORBIDDEN: "Access forbidden",
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;
