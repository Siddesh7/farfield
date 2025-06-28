import { ValidationError } from "@/lib/types/api";
import { ApiResponseBuilder } from "./api-response";

export class RequestValidator {
  private errors: ValidationError[] = [];

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
 * Parse and validate JSON body
 */
export async function parseAndValidateBody(request: Request): Promise<any> {
  try {
    const body = await request.json();
    return body;
  } catch (error) {
    throw new Error("Invalid JSON body");
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
