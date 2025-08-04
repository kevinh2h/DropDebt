import { APIGatewayProxyResult } from 'aws-lambda';
import { ApiResponse, ApiError, ErrorCodes } from '../types';

export class ResponseBuilder {
  static success<T>(data: T, message?: string, statusCode: number = 200): APIGatewayProxyResult {
    const response: ApiResponse<T> = {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString(),
      requestId: this.generateRequestId()
    };

    return {
      statusCode,
      headers: this.getDefaultHeaders(),
      body: JSON.stringify(response)
    };
  }

  static error(
    error: ApiError | string, 
    statusCode: number = 500,
    details?: Record<string, any>
  ): APIGatewayProxyResult {
    const apiError: ApiError = typeof error === 'string' 
      ? { code: ErrorCodes.INTERNAL_ERROR, message: error }
      : error;

    if (details) {
      apiError.details = details;
    }

    const response: ApiResponse = {
      success: false,
      error: apiError,
      timestamp: new Date().toISOString(),
      requestId: this.generateRequestId()
    };

    // Log error for debugging
    console.error('API Error:', {
      error: apiError,
      statusCode,
      timestamp: response.timestamp,
      requestId: response.requestId
    });

    return {
      statusCode,
      headers: this.getDefaultHeaders(),
      body: JSON.stringify(response)
    };
  }

  static validationError(message: string, field?: string): APIGatewayProxyResult {
    return this.error(
      {
        code: ErrorCodes.VALIDATION_ERROR,
        message,
        field
      },
      400
    );
  }

  static notFound(resource: string = 'Resource'): APIGatewayProxyResult {
    return this.error(
      {
        code: ErrorCodes.NOT_FOUND,
        message: `${resource} not found`
      },
      404
    );
  }

  static unauthorized(message: string = 'Unauthorized'): APIGatewayProxyResult {
    return this.error(
      {
        code: ErrorCodes.UNAUTHORIZED,
        message
      },
      401
    );
  }

  static forbidden(message: string = 'Forbidden'): APIGatewayProxyResult {
    return this.error(
      {
        code: ErrorCodes.FORBIDDEN,
        message
      },
      403
    );
  }

  static conflict(message: string): APIGatewayProxyResult {
    return this.error(
      {
        code: ErrorCodes.ARRANGEMENT_CONFLICT,
        message
      },
      409
    );
  }

  static rateLimitExceeded(message: string = 'Rate limit exceeded'): APIGatewayProxyResult {
    return this.error(
      {
        code: ErrorCodes.RATE_LIMIT_EXCEEDED,
        message
      },
      429
    );
  }

  private static getDefaultHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'X-Request-ID': this.generateRequestId()
    };
  }

  private static generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Helper functions for common response patterns
export const successResponse = <T>(data: T, message?: string, statusCode?: number) => 
  ResponseBuilder.success(data, message, statusCode);

export const errorResponse = (error: ApiError | string, statusCode?: number, details?: Record<string, any>) => 
  ResponseBuilder.error(error, statusCode, details);

export const validationErrorResponse = (message: string, field?: string) => 
  ResponseBuilder.validationError(message, field);

export const notFoundResponse = (resource?: string) => 
  ResponseBuilder.notFound(resource);

export const unauthorizedResponse = (message?: string) => 
  ResponseBuilder.unauthorized(message);

export const forbiddenResponse = (message?: string) => 
  ResponseBuilder.forbidden(message);

export const conflictResponse = (message: string) => 
  ResponseBuilder.conflict(message);

// Error handling utilities
export const handleLambdaError = (error: unknown): APIGatewayProxyResult => {
  console.error('Lambda execution error:', error);
  
  if (error instanceof Error) {
    // Handle known error types
    if (error.message.includes('ValidationException')) {
      return validationErrorResponse(error.message);
    }
    
    if (error.message.includes('ConditionalCheckFailedException')) {
      return conflictResponse('Resource conflict or condition not met');
    }
    
    if (error.message.includes('ResourceNotFoundException')) {
      return notFoundResponse();
    }
    
    if (error.message.includes('AccessDenied')) {
      return forbiddenResponse('Access denied');
    }
    
    // Generic error
    return errorResponse(error.message, 500);
  }
  
  // Unknown error type
  return errorResponse('An unexpected error occurred', 500);
};

// Response validation helper
export const validateResponse = <T>(data: T, schema?: any): T => {
  // Add JSON schema validation here if needed
  return data;
};