// Standardized API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Request validation types
export interface ValidationError {
  field: string;
  message: string;
}

export interface ApiValidationError extends ApiError {
  validationErrors: ValidationError[];
}

// File upload types
export interface FileUploadResponse {
  fileKey: string;
  fileUrl: string;
  originalName: string;
  size: number;
  mimeType: string;
}

// Common route parameters
export interface RouteParams {
  [key: string]: string | string[];
}

// API method types
export type ApiMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export interface ApiRouteHandler {
  method: ApiMethod;
  handler: (request: Request, context?: any) => Promise<Response>;
}
