import { NextResponse } from "next/server";
import {
  ApiResponse,
  ApiError,
  PaginatedResponse,
  ValidationError,
} from "@/lib/types/api";
import { HTTP_STATUS } from "@/lib/constants/api-messages";

export class ApiResponseBuilder {
  /**
   * Create a successful API response
   */
  static success<T>(
    data: T,
    message?: string,
    status: number = HTTP_STATUS.OK
  ): NextResponse {
    const response: ApiResponse<T> = {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response, { status });
  }

  /**
   * Create an error API response
   */
  static error(
    error: string,
    status: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    code?: string,
    details?: any
  ): NextResponse {
    const response: ApiResponse = {
      success: false,
      error,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response, { status });
  }

  /**
   * Create a validation error response
   */
  static validationError(
    validationErrors: ValidationError[],
    message: string = "Validation failed"
  ): NextResponse {
    const response: ApiResponse = {
      success: false,
      error: message,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(
      {
        ...response,
        validationErrors,
      },
      { status: HTTP_STATUS.BAD_REQUEST }
    );
  }

  /**
   * Create a paginated response
   */
  static paginated<T>(
    data: T[],
    page: number,
    limit: number,
    total: number,
    message?: string
  ): NextResponse {
    const totalPages = Math.ceil(total / limit);

    const response: PaginatedResponse<T> = {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString(),
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };

    return NextResponse.json(response);
  }

  /**
   * Create a not found response
   */
  static notFound(message: string = "Resource not found"): NextResponse {
    return this.error(message, HTTP_STATUS.NOT_FOUND);
  }

  /**
   * Create an unauthorized response
   */
  static unauthorized(message: string = "Unauthorized"): NextResponse {
    return this.error(message, 401);
  }

  /**
   * Create a forbidden response
   */
  static forbidden(message: string = "Forbidden"): NextResponse {
    return this.error(message, 403);
  }

  /**
   * Create a conflict response
   */
  static conflict(message: string = "Resource already exists"): NextResponse {
    return this.error(message, HTTP_STATUS.CONFLICT);
  }
}

/**
 * Catch and standardize errors
 */
export function handleApiError(error: unknown): NextResponse {
  console.error("API Error:", error);

  if (error instanceof Error) {
    return ApiResponseBuilder.error(
      error.message,
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }

  return ApiResponseBuilder.error(
    "An unexpected error occurred",
    HTTP_STATUS.INTERNAL_SERVER_ERROR
  );
}

/**
 * Wrapper for API route handlers with standardized error handling
 */
export function withErrorHandling(
  handler: (request: Request, context?: any) => Promise<NextResponse | Response>
) {
  return async (
    request: Request,
    context?: any
  ): Promise<NextResponse | Response> => {
    try {
      return await handler(request, context);
    } catch (error) {
      return handleApiError(error);
    }
  };
}
