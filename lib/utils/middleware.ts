import { NextResponse } from "next/server";
import { ApiResponseBuilder } from "./api-response";
import { withErrorHandling } from "./api-response";
import { withAuth } from "../auth/privy-auth";

/**
 * CORS middleware configuration
 */
interface CorsOptions {
  origin?: string | string[];
  methods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
}

const defaultCorsOptions: CorsOptions = {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],
  exposedHeaders: [],
  credentials: false,
  maxAge: 86400, // 24 hours
};

/**
 * Add CORS headers to response
 */
export function addCorsHeaders(
  response: NextResponse | Response,
  options: CorsOptions = {}
): NextResponse | Response {
  const config = { ...defaultCorsOptions, ...options };

  const headers = new Headers(response.headers);

  // Handle origin
  if (config.origin === "*") {
    headers.set("Access-Control-Allow-Origin", "*");
  } else if (Array.isArray(config.origin)) {
    headers.set("Access-Control-Allow-Origin", config.origin.join(", "));
  } else if (config.origin) {
    headers.set("Access-Control-Allow-Origin", config.origin);
  }

  // Set other CORS headers
  headers.set("Access-Control-Allow-Methods", config.methods!.join(", "));
  headers.set(
    "Access-Control-Allow-Headers",
    config.allowedHeaders!.join(", ")
  );

  if (config.exposedHeaders && config.exposedHeaders.length > 0) {
    headers.set(
      "Access-Control-Expose-Headers",
      config.exposedHeaders.join(", ")
    );
  }

  if (config.credentials) {
    headers.set("Access-Control-Allow-Credentials", "true");
  }

  headers.set("Access-Control-Max-Age", config.maxAge!.toString());

  // Create new response with updated headers
  if (response instanceof NextResponse) {
    return NextResponse.json(response.body, {
      status: response.status,
      headers,
    });
  } else {
    return new Response(response.body, {
      status: response.status,
      headers,
    });
  }
}

/**
 * Handle OPTIONS preflight requests
 */
export function handleCors(options: CorsOptions = {}) {
  return function (handler: Function) {
    return async function (request: Request, context?: any) {
      // Handle preflight requests
      if (request.method === "OPTIONS") {
        const response = new NextResponse(null, { status: 200 });
        return addCorsHeaders(response, options);
      }

      // Execute the handler and add CORS headers to response
      const response = await handler(request, context);
      return addCorsHeaders(response, options);
    };
  };
}

/**
 * Request logging middleware
 */
export function withLogging(
  handler: (request: Request, context?: any) => Promise<NextResponse | Response>
) {
  return async (
    request: Request,
    context?: any
  ): Promise<NextResponse | Response> => {
    const start = Date.now();
    const method = request.method;
    const url = request.url;
    const userAgent = request.headers.get("user-agent") || "unknown";

    console.log(
      `[${new Date().toISOString()}] ${method} ${url} - User-Agent: ${userAgent}`
    );

    const response = await handler(request, context);

    const duration = Date.now() - start;
    const status = response.status;

    console.log(
      `[${new Date().toISOString()}] ${method} ${url} - ${status} (${duration}ms)`
    );

    return response;
  };
}

/**
 * Simple rate limiting (in-memory, for development)
 * For production, use Redis or a proper rate limiting service
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  keyGenerator?: (request: Request) => string; // Function to generate rate limit key
}

export function withRateLimit(options: RateLimitOptions) {
  const {
    windowMs,
    maxRequests,
    keyGenerator = (req) => getClientIP(req),
  } = options;

  return function (
    handler: (
      request: Request,
      context?: any
    ) => Promise<NextResponse | Response>
  ) {
    return async (
      request: Request,
      context?: any
    ): Promise<NextResponse | Response> => {
      const key = keyGenerator(request);
      const now = Date.now();

      // Clean up expired entries
      const resetTime = now + windowMs;

      const existing = rateLimitStore.get(key);

      if (!existing || now > existing.resetTime) {
        // New window or expired
        rateLimitStore.set(key, { count: 1, resetTime });
      } else {
        // Within window
        existing.count++;

        if (existing.count > maxRequests) {
          return ApiResponseBuilder.error(
            "Too many requests, please try again later",
            429
          );
        }
      }

      return await handler(request, context);
    };
  };
}

/**
 * Get client IP address
 */
function getClientIP(request: Request): string {
  // Check various headers for IP
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  const remoteAddr = request.headers.get("remote-addr");

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  return realIP || remoteAddr || "unknown";
}

/**
 * Validate API key middleware
 */
export function withApiKey(expectedApiKey?: string) {
  const apiKey = expectedApiKey || process.env.API_KEY;

  return function (
    handler: (
      request: Request,
      context?: any
    ) => Promise<NextResponse | Response>
  ) {
    return async (
      request: Request,
      context?: any
    ): Promise<NextResponse | Response> => {
      if (!apiKey) {
        console.warn("API_KEY not configured, skipping API key validation");
        return await handler(request, context);
      }

      const requestApiKey =
        request.headers.get("x-api-key") ||
        request.headers.get("authorization")?.replace("Bearer ", "");

      if (!requestApiKey || requestApiKey !== apiKey) {
        return ApiResponseBuilder.unauthorized("Invalid or missing API key");
      }

      return await handler(request, context);
    };
  };
}

/**
 * Route helper that automatically wraps all exports with necessary middleware
 * Use this ONCE per route file to automatically handle DB + Error handling
 *
 * Usage:
 * const route = createRoute();
 * export const GET = route.public(getHandler);
 * export const POST = route.protected(postHandler);
 * export const PUT = route.protected(updateHandler);
 */
export function createRoute() {
  return {
    // Public routes (no auth needed)
    public: (handler: (request: Request, context?: any) => Promise<Response>) =>
      withErrorHandling(withDatabase(handler)),

    // Protected routes (auth required)
    protected: (
      handler: (
        request: Request,
        authenticatedUser: any,
        context?: any
      ) => Promise<Response>
    ) => withErrorHandling(withDatabase(withAuth(handler))),

    // Custom composition
    custom: (handler: (request: Request, context?: any) => Promise<Response>) =>
      withErrorHandling(withDatabase(handler)),
  };
}

/**
 * Global API wrapper that automatically applies to all routes
 * No need to write withAPI() everywhere - just export your handlers directly
 *
 * Usage:
 * export const GET = getHandler;        // Auto: DB + Error handling
 * export const POST = postHandler;      // Auto: DB + Error handling
 * export const PUT = withAuth(handler); // Auto: DB + Error handling + Auth
 */
export function createAPIHandler(
  handler: (request: Request, context?: any) => Promise<Response>
) {
  return withErrorHandling(withDatabase(handler));
}

/**
 * Global API wrapper for protected routes
 * Automatically handles DB + Error handling + Authentication
 *
 * Usage:
 * export const POST = createProtectedHandler(handler);
 */
export function createProtectedHandler(
  handler: (
    request: Request,
    authenticatedUser: any,
    context?: any
  ) => Promise<Response>
) {
  return withErrorHandling(withDatabase(withAuth(handler)));
}

/**
 * Comprehensive API middleware that handles:
 * - Database connection (automatic, no manual connectDB needed)
 * - Error handling
 * - Can be composed with withAuth
 *
 * Usage:
 * export const GET = withAPI(handler);                    // Public + DB + Error handling
 * export const POST = withAPI(withAuth(handler));         // Protected + DB + Error handling
 */
export function withAPI(
  handler: (request: Request, context?: any) => Promise<Response>
) {
  return withErrorHandling(withDatabase(handler));
}

/**
 * Database connection middleware
 * Automatically ensures database is connected
 * No need to call await connectDB() in your handlers
 */
export function withDatabase(
  handler: (request: Request, context?: any) => Promise<Response>
) {
  return async (request: Request, context?: any): Promise<Response> => {
    try {
      // Import here to avoid circular dependencies
      const connectDB = (await import("@/lib/db/connect")).default;
      await connectDB();
      return handler(request, context);
    } catch (error) {
      console.error("Database connection failed:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Database connection failed",
          timestamp: new Date().toISOString(),
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  };
}

/**
 * Compose multiple middleware functions
 */
export function compose(...middlewares: Function[]) {
  return function (handler: Function) {
    return middlewares.reduceRight((composed, middleware) => {
      return middleware(composed);
    }, handler);
  };
}
