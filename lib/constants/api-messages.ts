export const API_MESSAGES = {
  // User messages
  USER_CREATED_SUCCESS: "User created successfully",
  USER_NOT_FOUND: "User not found",
  USER_ALREADY_EXISTS: "User with this Privy ID already exists",
  FARCASTER_USER_EXISTS: "User with this Farcaster FID already exists",
  USERNAME_EXISTS: "User with this username already exists",

  // Validation messages
  MISSING_REQUIRED_FIELD: "Missing required field",
  INVALID_FARCASTER_FID: "farcasterFid must be a number",
  INVALID_FID_FORMAT: "Invalid farcasterFid format",
  INVALID_PAGE: "Page must be greater than 0",
  INVALID_LIMIT: "Limit must be between 1 and 100",
  INVALID_SORT_ORDER: "Sort order must be 'asc' or 'desc'",

  // Generic messages
  INTERNAL_SERVER_ERROR: "Internal server error",
  VALIDATION_ERROR: "Validation error",
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;
