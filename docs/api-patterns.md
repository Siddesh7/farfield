# API Standardization Patterns

**Rule**: When we create a better pattern, we refactor ALL existing code to use it immediately. No mixing patterns.

## 📝 Request Body Validation (STANDARDIZED)

### ✅ ALWAYS Use This Pattern

```typescript
import { RequestValidator, ApiResponseBuilder, withErrorHandling } from "@/lib";

async function myHandler(request: Request) {
  // 1. Parse body AND validate in one integrated step
  const validator = await RequestValidator.fromRequest(request);
  if (!validator.isValid()) {
    return validator.getErrorResponse()!;
  }

  const body: MyRequestType = validator.body;

  // 2. Continue field validation with same validator
  validator
    .required(body.field1, "field1")
    .string(body.field1, "field1", 1, 100)
    .required(body.field2, "field2");

  if (!validator.isValid()) {
    return validator.getErrorResponse()!;
  }

  // 3. Business logic
  // ...

  return ApiResponseBuilder.success(result, "Success message");
}

export const POST = withErrorHandling(myHandler);
```

### ❌ NEVER Use These Anti-Patterns

```typescript
// ❌ DON'T: Manual try-catch for body parsing
try {
  const body = await request.json();
} catch (error) {
  return NextResponse.json({ error: "Bad JSON" });
}

// ❌ DON'T: Using deprecated functions
const body = await parseAndValidateBody(request);
const bodyResult = await safeParseBody(request);

// ❌ DON'T: Manual NextResponse
return NextResponse.json({ success: true, data: result });

// ❌ DON'T: Separate parsing and validation steps
const bodyResult = await safeParseBody(request);
const validator = new RequestValidator();
```

## 🔧 Standard API Response Patterns

### Success Responses

```typescript
// Simple success
ApiResponseBuilder.success(data, "Message");

// Success with custom status
ApiResponseBuilder.success(data, "Created", 201);

// Paginated response
ApiResponseBuilder.paginated(items, page, limit, total, "Message");
```

### Error Responses

```typescript
// Validation errors (handled automatically by RequestValidator)
validator.getErrorResponse();

// Business logic errors
ApiResponseBuilder.error("Custom error message", 400);
ApiResponseBuilder.notFound("Resource not found");
ApiResponseBuilder.unauthorized("Token required");
ApiResponseBuilder.conflict("Resource already exists");
```

## 🔐 Authentication Patterns

### Protected Routes

Use the `withAuth` higher-order function for protected endpoints:

```typescript
import { withAuth, AuthenticatedUser } from "@/lib/auth/privy-auth";

// For protected endpoints (all /api/users/me/* routes)
async function myHandler(
  request: Request,
  authenticatedUser: AuthenticatedUser
) {
  const privyId = authenticatedUser.privyId;
  // ... rest of handler logic
}

// Export with authentication wrapper
export const POST = withErrorHandling(withAuth(myHandler));
```

### Public Routes

Skip authentication for public endpoints (user lookup routes):

```typescript
// For public endpoints like /api/users/[id], /api/users/username/[username], etc.
// No authentication needed
```

### Frontend Integration

```typescript
// Use authentication hook for automatic token handling
import { useAuthenticatedAPI } from "@/lib/hooks/use-authenticated-fetch";

const { get, post, put, delete: del } = useAuthenticatedAPI();
const response = await get("/api/users/me");
```

## 🗄️ Database Query Patterns

### User Model Static Methods

```typescript
// ✅ ALWAYS use static methods with type casting
const user = await(User as any).findByPrivyId(privyId);
const user = await(User as any).findByFarcasterFid(fid);
const user = await(User as any).findByUsername(username);
const user = await(User as any).findByWalletAddress(address);
```

### Database Connection

```typescript
// ✅ ALWAYS use default import
import connectDB from "@/lib/db/connect";

async function handler(request: Request) {
  await connectDB();
  // ... rest of handler
}
```

## 📋 Complete Endpoint Template

```typescript
import { ModelName } from "@/models/model-name";
import connectDB from "@/lib/db/connect";
import {
  ApiResponseBuilder,
  withErrorHandling,
  RequestValidator,
  API_MESSAGES,
} from "@/lib";
import { ResponseType, RequestType } from "@/lib/types/model-name";
import { withAuth, AuthenticatedUser } from "@/lib/auth/privy-auth";

// HTTP_METHOD /api/route/path - Description (Protected Route)
async function handlerName(
  request: Request,
  authenticatedUser: AuthenticatedUser
) {
  await connectDB();

  // Authentication is handled automatically by withAuth
  const privyId = authenticatedUser.privyId;

  // Body parsing AND validation (if needed)
  const validator = await RequestValidator.fromRequest(request);
  if (!validator.isValid()) {
    return validator.getErrorResponse()!;
  }

  const body: RequestType = validator.body;

  // Additional field validation
  validator.required(body.field, "field").string(body.field, "field", 1, 100);

  if (!validator.isValid()) {
    return validator.getErrorResponse()!;
  }

  // Business logic
  const result = await someBusinessLogic();

  return ApiResponseBuilder.success(result, API_MESSAGES.SUCCESS_MESSAGE);
}

// For protected routes
export const POST = withErrorHandling(withAuth(handlerName));

// For public routes (no authentication needed)
export const GET = withErrorHandling(publicHandlerName);
```

## 🚫 Deprecated Patterns

These patterns are deprecated and should not be used:

- `parseAndValidateBody()` - Use `RequestValidator.fromRequest()` instead
- `safeParseBody()` - Use `RequestValidator.fromRequest()` instead
- Manual try-catch for body parsing - Use `RequestValidator.fromRequest()`
- `NextResponse.json()` - Use `ApiResponseBuilder` methods
- Manual error responses - Use standardized error methods
- Separate parsing and validation steps - Use integrated `RequestValidator.fromRequest()`

## 🎯 Benefits of Standardization

1. **Consistency** - All endpoints follow same patterns
2. **Maintainability** - Easy to understand and modify
3. **Error Handling** - Comprehensive, consistent error messages
4. **Type Safety** - Full TypeScript support
5. **Developer Experience** - Clear patterns, less cognitive load
6. **Testing** - Predictable response formats

## 🔄 Migration Process

When introducing new patterns:

1. **Create** the new standardized utility/pattern
2. **Refactor** ALL existing code to use it immediately
3. **Deprecate** old patterns with clear warnings
4. **Document** the new standard
5. **Remove** old patterns after refactoring
6. **Update** this guide
