import { NextResponse } from "next/server";
import { ApiResponseBuilder } from "./api-response";

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
 * Compose multiple middleware functions
 */
export function compose(...middlewares: Function[]) {
  return function (handler: Function) {
    return middlewares.reduceRight((composed, middleware) => {
      return middleware(composed);
    }, handler);
  };
}
