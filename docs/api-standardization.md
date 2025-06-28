## Overview

Our API standardization system provides:

- ✅ **Consistent Response Format**: All APIs return standardized JSON responses
- ✅ **Type Safety**: Full TypeScript support with proper types
- ✅ **Validation**: Request body and parameter validation
- ✅ **Error Handling**: Centralized error handling with proper HTTP status codes
- ✅ **Middleware Support**: CORS, logging, rate limiting, authentication
- ✅ **Developer Experience**: Easy-to-use utilities and helpers

## Quick Start

```typescript
import { ApiResponseBuilder, withErrorHandling, RequestValidator } from "@/lib";

async function handler(request: Request) {
  const validator = new RequestValidator();
  // ... validation logic

  return ApiResponseBuilder.success(data, "Success message");
}

export const POST = withErrorHandling(handler);
```

## Response Format

All API responses follow this standardized format:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}
```

### Examples

**Success Response:**

```json
{
  "success": true,
  "data": { "id": 1, "name": "John" },
  "message": "User created successfully",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Error Response:**

```json
{
  "success": false,
  "error": "User not found",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Paginated Response:**

```json
{
  "success": true,
  "data": [...],
  "message": "Data retrieved successfully",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

## ApiResponseBuilder

Use `ApiResponseBuilder` to create standardized responses:

```typescript
import { ApiResponseBuilder } from "@/lib";

// Success response
ApiResponseBuilder.success(data, "Optional message", 200);

// Error response
ApiResponseBuilder.error("Error message", 400);

// Specific error types
ApiResponseBuilder.notFound("User not found");
ApiResponseBuilder.unauthorized("Invalid token");
ApiResponseBuilder.forbidden("Access denied");
ApiResponseBuilder.conflict("User already exists");

// Paginated response
ApiResponseBuilder.paginated(items, page, limit, total, "Message");

// Validation error
ApiResponseBuilder.validationError(validationErrors, "Custom message");
```

## Request Validation

Use `RequestValidator` for robust input validation:

```typescript
import { RequestValidator, parseAndValidateBody } from "@/lib";

async function handler(request: Request) {
  const body = await parseAndValidateBody(request);

  const validator = new RequestValidator();
  validator
    .required(body.name, "name")
    .string(body.name, "name", 2, 50) // min 2, max 50 chars
    .required(body.email, "email")
    .email(body.email, "email")
    .number(body.age, "age", 18, 120); // min 18, max 120

  if (!validator.isValid()) {
    return validator.getErrorResponse()!;
  }

  // Process valid data...
}
```

### Validation Methods

- `required(value, fieldName)` - Field is required
- `string(value, fieldName, minLength?, maxLength?)` - String validation
- `number(value, fieldName, min?, max?)` - Number validation
- `email(value, fieldName)` - Email format validation
- `array(value, fieldName, minLength?, maxLength?)` - Array validation
- `enum(value, fieldName, allowedValues)` - Enum validation

## Error Handling

Wrap your handlers with `withErrorHandling` for automatic error handling:

```typescript
import { withErrorHandling } from "@/lib";

async function myHandler(request: Request) {
  // Your logic here
  // Any thrown errors will be caught and standardized
}

export const POST = withErrorHandling(myHandler);
```

## Middleware

### CORS

```typescript
import { handleCors } from "@/lib";

const handler = handleCors({
  origin: ["http://localhost:3000", "https://yourdomain.com"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
})(myHandler);

export const GET = handler;
```

### Rate Limiting

```typescript
import { withRateLimit } from "@/lib";

const rateLimitedHandler = withRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
})(myHandler);
```

### Logging

```typescript
import { withLogging } from "@/lib";

const loggedHandler = withLogging(myHandler);
```

### API Key Authentication

```typescript
import { withApiKey } from "@/lib";

const protectedHandler = withApiKey("your-api-key")(myHandler);
// Or use environment variable: withApiKey()(myHandler)
```

### Composing Middleware

```typescript
import {
  compose,
  handleCors,
  withLogging,
  withRateLimit,
  withErrorHandling,
} from "@/lib";

const middlewareStack = compose(
  handleCors({ origin: "*" }),
  withLogging,
  withRateLimit({ windowMs: 60000, maxRequests: 60 }),
  withErrorHandling
);

export const GET = middlewareStack(myHandler);
export const POST = middlewareStack(myPostHandler);
```

## Pagination

For endpoints that return lists, use standardized pagination:

```typescript
import { validatePagination, parseQueryParams } from "@/lib";

async function handler(request: Request) {
  const searchParams = parseQueryParams(request);
  const paginationResult = validatePagination(searchParams);

  if (!paginationResult.isValid) {
    return ApiResponseBuilder.validationError(paginationResult.errors);
  }

  const { page, limit } = paginationResult;

  // Fetch data with pagination
  const { items, total } = await fetchData(page, limit);

  return ApiResponseBuilder.paginated(items, page, limit, total);
}
```

Query parameters:

- `?page=1` - Page number (default: 1)
- `?limit=10` - Items per page (default: 10, max: 100)

## File Upload Example

```typescript
import { ApiResponseBuilder, withErrorHandling, RequestValidator } from "@/lib";
import { FileUploadResponse } from "@/lib";

async function uploadHandler(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  const validator = new RequestValidator();
  validator.required(file, "file");

  if (!validator.isValid()) {
    return validator.getErrorResponse()!;
  }

  // Additional file validation
  if (file!.size > 10 * 1024 * 1024) {
    // 10MB
    return ApiResponseBuilder.error("File size exceeds 10MB limit", 400);
  }

  // Process upload...
  const result: FileUploadResponse = {
    fileKey: "unique-key",
    fileUrl: "https://...",
    originalName: file!.name,
    size: file!.size,
    mimeType: file!.type,
  };

  return ApiResponseBuilder.success(result, "File uploaded successfully", 201);
}

export const POST = withErrorHandling(uploadHandler);
```

## Best Practices

### 1. Always Use Error Handling

```typescript
export const GET = withErrorHandling(handler);
```

### 2. Validate All Inputs

```typescript
const validator = new RequestValidator();
validator.required(value, "fieldName");
```

### 3. Use Appropriate HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request / Validation Error
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `429` - Too Many Requests
- `500` - Internal Server Error

### 4. Consistent Response Messages

Use constants from `API_MESSAGES`:

```typescript
import { API_MESSAGES } from "@/lib";

return ApiResponseBuilder.error(API_MESSAGES.USER_NOT_FOUND, 404);
```

### 5. Type Your Responses

```typescript
interface UserResponse {
  id: number;
  name: string;
  email: string;
}

return ApiResponseBuilder.success<UserResponse>(userData);
```

### 6. Handle OPTIONS Requests

When using CORS, OPTIONS requests are automatically handled by the `handleCors` middleware.

### 7. Log Important Events

```typescript
console.log(`User ${userId} performed action: ${action}`);
```

## Environment Variables

```env
# Optional: API key for protected endpoints
API_KEY=your-secret-api-key

# Required for file uploads
R2_ENDPOINT=your-r2-endpoint
```

## Migration Guide

To migrate existing APIs to the standardized format:

1. **Replace manual NextResponse creation** with `ApiResponseBuilder`
2. **Add input validation** using `RequestValidator`
3. **Wrap handlers** with `withErrorHandling`
4. **Add middleware** as needed (CORS, rate limiting, etc.)
5. **Update response types** to match the standardized format

### Before

```typescript
export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.name) {
      return NextResponse.json({ error: "Name required" }, { status: 400 });
    }
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
```

### After

```typescript
async function postHandler(request: Request) {
  const body = await parseAndValidateBody(request);

  const validator = new RequestValidator();
  validator.required(body.name, "name");

  if (!validator.isValid()) {
    return validator.getErrorResponse()!;
  }

  return ApiResponseBuilder.success(result);
}

export const POST = withErrorHandling(postHandler);
```

This standardization provides consistency, type safety, and better developer experience across your entire API surface.
