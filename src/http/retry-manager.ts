export interface RetryOptions {
  maxRetries: number;
  delay: number;
  backoff?: 'linear' | 'exponential';
  retriesOnStatus?: number[];
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
}
