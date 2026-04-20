// ✅ FIX: Add HTTP status mapping for better error handling

export class ApiError extends Error {
  constructor(code, status = null, original = null) {
    super(code);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.original = original;
  }

  /**
   * Get user-friendly message based on HTTP status code
   */
  getUserMessage() {
    if (this.status) {
      switch (this.status) {
        case 400:
          return "Invalid request. Please check your input.";
        case 401:
          return "Your session has expired. Please login again.";
        case 403:
          return "You don't have permission to access this resource.";
        case 404:
          return "The requested resource was not found.";
        case 409:
          return "This operation conflicts with existing data.";
        case 429:
          return "Too many requests. Please try again later.";
        case 500:
        case 502:
        case 503:
        case 504:
          return "Server error. Please try again later.";
        default:
          return this.message || "Something went wrong. Please try again.";
      }
    }
    return this.message || "An error occurred.";
  }

  /**
   * Check if error is retryable
   */
  isRetryable() {
    if (!this.status) return true;
    return [408, 429, 500, 502, 503, 504].includes(this.status);
  }

  /**
   * Check if error requires logout
   */
  requiresLogout() {
    return [401, 403].includes(this.status);
  }
}

// Factory methods for common errors
ApiError.unauthorized = (message = "Unauthorized") => {
  return new ApiError(message, 401);
};

ApiError.forbidden = (message = "Forbidden") => {
  return new ApiError(message, 403);
};

ApiError.notFound = (message = "Not found") => {
  return new ApiError(message, 404);
};

ApiError.conflict = (message = "Conflict") => {
  return new ApiError(message, 409);
};

ApiError.tooManyRequests = (message = "Too many requests") => {
  return new ApiError(message, 429);
};

ApiError.serverError = (message = "Internal server error") => {
  return new ApiError(message, 500);
};

ApiError.networkError = (message = "Network error") => {
  return new ApiError(message, null);
};

ApiError.timeout = (message = "Request timeout") => {
  return new ApiError(message, 408);
};
