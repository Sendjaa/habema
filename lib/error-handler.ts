// Error handling utilities for client-side error management
import React from 'react';

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public userMessage: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, userMessage: string = 'Terjadi kesalahan pada database. Silakan coba lagi.') {
    super(message, 'DATABASE_ERROR', userMessage);
    this.name = 'DatabaseError';
  }
}

export class NetworkError extends AppError {
  constructor(message: string, userMessage: string = 'Koneksi internet bermasalah. Silakan periksa koneksi Anda.') {
    super(message, 'NETWORK_ERROR', userMessage);
    this.name = 'NetworkError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, userMessage: string = 'Data yang dimasukkan tidak valid.') {
    super(message, 'VALIDATION_ERROR', userMessage);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string, userMessage: string = 'Anda harus login untuk mengakses fitur ini.') {
    super(message, 'AUTH_ERROR', userMessage);
    this.name = 'AuthenticationError';
  }
}

export class PermissionError extends AppError {
  constructor(message: string, userMessage: string = 'Anda tidak memiliki izin untuk melakukan aksi ini.') {
    super(message, 'PERMISSION_ERROR', userMessage);
    this.name = 'PermissionError';
  }
}

// Error handler function
export function handleError(error: unknown): AppError {
  // Log error for debugging (in production, send to error service)
  console.error('Error handled:', error);

  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    // Handle specific error types based on error message
    const message = error.message.toLowerCase();
    
    if (message.includes('column') && message.includes('not found')) {
      return new DatabaseError(
        error.message,
        'Terjadi kesalahan sistem. Silakan coba lagi dalam beberapa saat.'
      );
    }
    
    if (message.includes('network') || message.includes('fetch')) {
      return new NetworkError(error.message);
    }
    
    if (message.includes('unauthorized') || message.includes('authentication')) {
      return new AuthenticationError(error.message);
    }
    
    if (message.includes('permission') || message.includes('forbidden')) {
      return new PermissionError(error.message);
    }
    
    if (message.includes('validation') || message.includes('invalid')) {
      return new ValidationError(error.message);
    }

    // Default error
    return new AppError(
      error.message,
      'UNKNOWN_ERROR',
      'Terjadi kesalahan yang tidak terduga. Silakan coba lagi.'
    );
  }

  // Handle non-Error objects
  return new AppError(
    String(error),
    'UNKNOWN_ERROR',
    'Terjadi kesalahan yang tidak terduga. Silakan coba lagi.'
  );
}

// Safe async function wrapper
export async function safeAsync<T>(
  asyncFn: () => Promise<T>,
  errorMessage?: string
): Promise<[T | null, AppError | null]> {
  try {
    const result = await asyncFn();
    return [result, null];
  } catch (error) {
    const appError = handleError(error);
    if (errorMessage) {
      appError.userMessage = errorMessage;
    }
    return [null, appError];
  }
}

// Error logging utility
export function logError(error: AppError, context?: Record<string, any>) {
  const logData = {
    timestamp: new Date().toISOString(),
    error: {
      name: error.name,
      code: error.code,
      message: error.message,
      userMessage: error.userMessage,
      statusCode: error.statusCode,
    },
    context,
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
    url: typeof window !== 'undefined' ? window.location.href : 'server',
  };

  console.error('Error logged:', logData);

  // In production, send to error reporting service
  if (process.env.NODE_ENV === 'production') {
    // Example: sendToErrorService(logData);
  }
}

// React hook for error handling
export function useErrorHandler() {
  const [error, setError] = React.useState<AppError | null>(null);

  const handleErrorWithState = React.useCallback((error: unknown) => {
    const appError = handleError(error);
    logError(appError);
    setError(appError);
    return appError;
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  const safeAsyncWrapper = React.useCallback(
    async <T>(asyncFn: () => Promise<T>, errorMessage?: string) => {
      const [result, error] = await safeAsync(asyncFn, errorMessage);
      if (error) {
        setError(error);
      }
      return [result, error] as const;
    },
    []
  );

  return {
    error,
    handleError: handleErrorWithState,
    clearError,
    safeAsync: safeAsyncWrapper,
  };
}
