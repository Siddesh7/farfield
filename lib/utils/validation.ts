import { ValidationError } from "@/lib/types/api";
import { ApiResponseBuilder } from "./api-response";

export class RequestValidator {
  private errors: ValidationError[] = [];
  public body: any = null;
  private parseSuccess: boolean = true;

  /**
   * STANDARDIZED: Create validator from request with automatic body parsing
   * This is the preferred method for all API endpoints that require request bodies.
   *
   * @param request - The incoming request object
   * @returns Promise<RequestValidator> with parsed body or parsing errors
   *
   * @example
   * ```typescript
   * const validator = await RequestValidator.fromRequest(request);
   * if (!validator.isValid()) {
   *   return validator.getErrorResponse();
   * }
   *
   * const body = validator.body;
   * validator.required(body.field, "field");
   * ```
   */
  static async fromRequest(request: Request): Promise<RequestValidator> {
    const validator = new RequestValidator();

    try {
      // Parse body with validation
      const contentLength = request.headers.get("content-length");
      if (contentLength === "0" || contentLength === null) {
        throw new Error("Request body is empty");
      }

      const contentType = request.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Content-Type must be application/json");
      }

      const body = await request.json();

      if (
        !body ||
        (typeof body === "object" && Object.keys(body).length === 0)
      ) {
        throw new Error("Request body cannot be empty");
      }

      validator.body = body;
      validator.parseSuccess = true;
    } catch (error) {
      validator.parseSuccess = false;
      validator.errors.push({
        field: "body",
        message:
          error instanceof Error
            ? error.message
            : "Invalid JSON format in request body",
      });
    }

    return validator;
  }

  /**
   * Check if body parsing was successful
   */
  get isBodyValid(): boolean {
    return this.parseSuccess;
  }

  /**
   * Validate required fields
   */
  required(value: any, fieldName: string): this {
    if (value === undefined || value === null || value === "") {
      this.errors.push({
        field: fieldName,
        message: `${fieldName} is required`,
      });
    }
    return this;
  }

  /**
   * Validate string type and optional min/max length
   */
  string(
    value: any,
    fieldName: string,
    minLength?: number,
    maxLength?: number
  ): this {
    if (value !== undefined && value !== null) {
      if (typeof value !== "string") {
        this.errors.push({
          field: fieldName,
          message: `${fieldName} must be a string`,
        });
      } else {
        if (minLength && value.length < minLength) {
          this.errors.push({
            field: fieldName,
            message: `${fieldName} must be at least ${minLength} characters`,
          });
        }
        if (maxLength && value.length > maxLength) {
          this.errors.push({
            field: fieldName,
            message: `${fieldName} must be at most ${maxLength} characters`,
          });
        }
      }
    }
    return this;
  }

  /**
   * Validate number type and optional min/max value
   */
  number(value: any, fieldName: string, min?: number, max?: number): this {
    if (value !== undefined && value !== null) {
      const num = Number(value);
      if (isNaN(num)) {
        this.errors.push({
          field: fieldName,
          message: `${fieldName} must be a number`,
        });
      } else {
        if (min !== undefined && num < min) {
          this.errors.push({
            field: fieldName,
            message: `${fieldName} must be at least ${min}`,
          });
        }
        if (max !== undefined && num > max) {
          this.errors.push({
            field: fieldName,
            message: `${fieldName} must be at most ${max}`,
          });
        }
      }
    }
    return this;
  }

  /**
   * Validate email format
   */
  email(value: any, fieldName: string): this {
    if (value !== undefined && value !== null && value !== "") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        this.errors.push({
          field: fieldName,
          message: `${fieldName} must be a valid email address`,
        });
      }
    }
    return this;
  }

  /**
   * Validate array type and optional min/max length
   */
  array(
    value: any,
    fieldName: string,
    minLength?: number,
    maxLength?: number
  ): this {
    if (value !== undefined && value !== null) {
      if (!Array.isArray(value)) {
        this.errors.push({
          field: fieldName,
          message: `${fieldName} must be an array`,
        });
      } else {
        if (minLength && value.length < minLength) {
          this.errors.push({
            field: fieldName,
            message: `${fieldName} must have at least ${minLength} items`,
          });
        }
        if (maxLength && value.length > maxLength) {
          this.errors.push({
            field: fieldName,
            message: `${fieldName} must have at most ${maxLength} items`,
          });
        }
      }
    }
    return this;
  }

  /**
   * Validate enum values
   */
  enum(value: any, fieldName: string, allowedValues: any[]): this {
    if (value !== undefined && value !== null) {
      if (!allowedValues.includes(value)) {
        this.errors.push({
          field: fieldName,
          message: `${fieldName} must be one of: ${allowedValues.join(", ")}`,
        });
      }
    }
    return this;
  }

  /**
   * Check if validation passed
   */
  isValid(): boolean {
    return this.errors.length === 0;
  }

  /**
   * Get validation errors
   */
  getErrors(): ValidationError[] {
    return this.errors;
  }

  /**
   * Return validation error response if invalid
   */
  getErrorResponse() {
    if (!this.isValid()) {
      return ApiResponseBuilder.validationError(this.errors);
    }
    return null;
  }
}

/**
 * Parse and validate JSON body (DEPRECATED)
 * @deprecated Use safeParseBody instead for consistent error handling
 */
async function parseAndValidateBody(request: Request): Promise<any> {
  try {
    // Check if request has a body
    const contentLength = request.headers.get("content-length");
    if (contentLength === "0" || contentLength === null) {
      throw new Error("Request body is empty");
    }

    // Check content type
    const contentType = request.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Content-Type must be application/json");
    }

    const body = await request.json();

    // Check if body is empty object or null
    if (!body || (typeof body === "object" && Object.keys(body).length === 0)) {
      throw new Error("Request body cannot be empty");
    }

    return body;
  } catch (error) {
    if (error instanceof Error) {
      throw error; // Re-throw our custom errors
    }
    throw new Error("Invalid JSON format in request body");
  }
}

/**
 * DEPRECATED: Use RequestValidator.fromRequest() instead
 * @deprecated Use RequestValidator.fromRequest(request) for integrated parsing and validation
 */
async function safeParseBody(
  request: Request
): Promise<
  { success: true; data: any } | { success: false; response: Response }
> {
  try {
    const body = await parseAndValidateBody(request);
    return { success: true, data: body };
  } catch (error) {
    return {
      success: false,
      response: ApiResponseBuilder.error(
        error instanceof Error ? error.message : "Invalid request body",
        400
      ),
    };
  }
}

/**
 * Parse and validate query parameters
 */
export function parseQueryParams(request: Request): URLSearchParams {
  const url = new URL(request.url);
  return url.searchParams;
}

/**
 * Validate pagination parameters
 */
export function validatePagination(searchParams: URLSearchParams) {
  const validator = new RequestValidator();

  const page = searchParams.get("page");
  const limit = searchParams.get("limit");

  if (page) {
    validator.number(page, "page", 1);
  }

  if (limit) {
    validator.number(limit, "limit", 1, 100);
  }

  return {
    isValid: validator.isValid(),
    errors: validator.getErrors(),
    page: page ? parseInt(page) : 1,
    limit: limit ? parseInt(limit) : 10,
  };
}
