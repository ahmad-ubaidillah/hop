export interface RetryOptions {
  maxRetries: number;
  delay: number;
  backoff?: 'linear' | 'exponential';
  retriesOnStatus?: number[];
}

export interface StepRetryOptions {
  maxRetries: number;
  delay: number;
  backoff: 'linear' | 'exponential';
  backoffMultiplier?: number;
  onRetry?: (attempt: number, maxRetries: number, error: Error) => void;
}

export class RetryManager {
  public async execute<T>(
    operation: (attempt: number) => Promise<T>,
    retryOptions: RetryOptions,
    isRetryableError: (error: Error) => boolean
  ): Promise<T> {
    let attempt = 0;
    const maxAttempts = retryOptions.maxRetries + 1;
    let lastError: Error | null = null;

    while (attempt < maxAttempts) {
      try {
        return await operation(attempt);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt >= maxAttempts - 1 || !isRetryableError(lastError)) throw lastError;
        attempt++;
        await new Promise(resolve => setTimeout(resolve, this.calculateDelay(retryOptions, attempt)));
      }
    }
    throw lastError!;
  }

  private calculateDelay(options: RetryOptions, attempt: number): number {
    const baseDelay = options.delay;
    return options.backoff === 'exponential' 
      ? baseDelay * Math.pow(2, attempt - 1) 
      : baseDelay * attempt;
  }
  
  /**
   * Execute operation with step-level retry
   * Supports @retry(n) syntax parsing
   */
  public async executeWithRetry<T>(
    operation: (attempt: number) => Promise<T>,
    stepText: string,
    defaultOptions: StepRetryOptions
  ): Promise<T> {
    const retryOptions = this.parseRetryAnnotation(stepText) || defaultOptions;
    let attempt = 0;
    const maxAttempts = retryOptions.maxRetries + 1;
    let lastError: Error | null = null;

    while (attempt < maxAttempts) {
      try {
        return await operation(attempt);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt >= maxAttempts - 1) {
          throw lastError;
        }
        
        attempt++;
        const delay = this.calculateStepDelay(retryOptions, attempt);
        
        if (retryOptions.onRetry) {
          retryOptions.onRetry(attempt, retryOptions.maxRetries, lastError);
        }
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError!;
  }
  
  /**
   * Parse @retry(n) or @retry(n, delay) from step text
   */
  private parseRetryAnnotation(stepText: string): StepRetryOptions | null {
    const match = stepText.match(/@retry\((\d+)(?:,\s*(\d+))?\)/i);
    if (!match) return null;
    
    return {
      maxRetries: parseInt(match[1]),
      delay: parseInt(match[2]) || 1000,
      backoff: 'exponential',
    };
  }
  
  private calculateStepDelay(options: StepRetryOptions, attempt: number): number {
    const baseDelay = options.delay;
    const multiplier = options.backoffMultiplier || 2;
    return options.backoff === 'exponential' 
      ? baseDelay * Math.pow(multiplier, attempt - 1) 
      : baseDelay * attempt;
  }
}
