/**
 * Utility functions for handling API calls with retry logic
 */

interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  timeout?: number;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  timeout: 15000,
};

/**
 * Executes a function with retry logic and exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      // Add timeout to the function call
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Operation timeout after ${opts.timeout}ms`)), opts.timeout);
      });

      const result = await Promise.race([fn(), timeoutPromise]);
      return result;
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on the last attempt
      if (attempt === opts.maxRetries) {
        break;
      }

      // Don't retry for certain types of errors
      if (isNonRetryableError(lastError)) {
        break;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        opts.baseDelay * Math.pow(2, attempt),
        opts.maxDelay
      );

      console.log(`🔄 Retry attempt ${attempt + 1}/${opts.maxRetries + 1} after ${delay}ms delay. Error:`, lastError.message);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/**
 * Checks if an error should not be retried
 */
function isNonRetryableError(error: Error): boolean {
  const message = error.message.toLowerCase();
  
  // Don't retry authentication errors
  if (message.includes('unauthorized') || 
      message.includes('forbidden') || 
      message.includes('invalid token') ||
      message.includes('session expired')) {
    return true;
  }

  // Don't retry client errors (4xx)
  if (message.includes('400') || 
      message.includes('401') || 
      message.includes('403') || 
      message.includes('404')) {
    return true;
  }

  return false;
}

/**
 * Wraps a Supabase query with retry logic
 */
export async function withSupabaseRetry<T>(
  queryFn: () => Promise<{ data: T; error: any }>,
  options: RetryOptions = {}
): Promise<{ data: T; error: any }> {
  return withRetry(async () => {
    const result = await queryFn();
    
    // If there's an error, throw it to trigger retry logic
    if (result.error) {
      throw new Error(`Supabase error: ${result.error.message}`);
    }
    
    return result;
  }, options);
}

/**
 * Wraps a fetch request with retry logic
 */
export async function withFetchRetry(
  url: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = {}
): Promise<Response> {
  return withRetry(async () => {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response;
  }, retryOptions);
}










