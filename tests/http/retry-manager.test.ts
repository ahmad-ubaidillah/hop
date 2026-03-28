import { describe, test, expect, beforeEach } from 'bun:test';
import { RetryManager, type RetryOptions, type StepRetryOptions } from '../../src/http/retry-manager';

describe('RetryManager', () => {
  let retryManager: RetryManager;

  beforeEach(() => {
    retryManager = new RetryManager();
  });

  describe('execute', () => {
    test('should return result on first successful attempt', async () => {
      const operation = async () => 'success';
      
      const result = await retryManager.execute(
        operation,
        { maxRetries: 3, delay: 10 },
        () => true
      );
      
      expect(result).toBe('success');
    });

    test('should retry on retryable error', async () => {
      let attempts = 0;
      const operation = async () => {
        attempts++;
        if (attempts < 3) throw new Error('Network error');
        return 'success';
      };
      
      const result = await retryManager.execute(
        operation,
        { maxRetries: 3, delay: 10 },
        (err) => err.message.includes('Network')
      );
      
      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });

    test('should not retry on non-retryable error', async () => {
      let attempts = 0;
      const operation = async () => {
        attempts++;
        throw new Error('Non-retryable error');
      };
      
      await expect(
        retryManager.execute(
          operation,
          { maxRetries: 3, delay: 10 },
          (err) => !err.message.includes('Non-retryable')
        )
      ).rejects.toThrow('Non-retryable error');
      
      expect(attempts).toBe(1);
    });

    test('should throw after max retries exceeded', async () => {
      let attempts = 0;
      const operation = async () => {
        attempts++;
        throw new Error('Always fails');
      };
      
      await expect(
        retryManager.execute(
          operation,
          { maxRetries: 2, delay: 10 },
          () => true
        )
      ).rejects.toThrow('Always fails');
      
      expect(attempts).toBe(3); // initial + 2 retries
    });

    test('should use linear backoff', async () => {
      const delays: number[] = [];
      let lastTime = Date.now();
      let attempts = 0;
      
      const operation = async () => {
        attempts++;
        if (attempts < 3) {
          const now = Date.now();
          if (attempts > 1) {
            delays.push(now - lastTime);
          }
          lastTime = now;
          throw new Error('Retry');
        }
        return 'success';
      };
      
      await retryManager.execute(
        operation,
        { maxRetries: 3, delay: 50, backoff: 'linear' },
        () => true
      );
      
      // Linear backoff: delay * attempt
      // First retry: 50 * 1 = 50ms
      // Second retry: 50 * 2 = 100ms
      expect(delays.length).toBeGreaterThan(0);
    });

    test('should use exponential backoff', async () => {
      let attempts = 0;
      
      const operation = async () => {
        attempts++;
        if (attempts < 3) throw new Error('Retry');
        return 'success';
      };
      
      const result = await retryManager.execute(
        operation,
        { maxRetries: 3, delay: 10, backoff: 'exponential' },
        () => true
      );
      
      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });

    test('should pass attempt number to operation', async () => {
      const attempts: number[] = [];
      
      const operation = async (attempt: number) => {
        attempts.push(attempt);
        if (attempt < 2) throw new Error('Retry');
        return 'success';
      };
      
      await retryManager.execute(
        operation,
        { maxRetries: 3, delay: 10 },
        () => true
      );
      
      expect(attempts).toEqual([0, 1, 2]);
    });
  });

  describe('executeWithRetry', () => {
    const defaultOptions: StepRetryOptions = {
      maxRetries: 2,
      delay: 10,
      backoff: 'exponential',
    };

    test('should return result on first successful attempt', async () => {
      const operation = async () => 'success';
      
      const result = await retryManager.executeWithRetry(
        operation,
        'step without retry',
        defaultOptions
      );
      
      expect(result).toBe('success');
    });

    test('should parse @retry(n) annotation from step text', async () => {
      let attempts = 0;
      const operation = async () => {
        attempts++;
        if (attempts < 3) throw new Error('Retry');
        return 'success';
      };
      
      const result = await retryManager.executeWithRetry(
        operation,
        'step with @retry(3, 10)', // 3 retries with 10ms delay
        defaultOptions
      );
      
      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });

    test('should parse @retry(n, delay) annotation from step text', async () => {
      let attempts = 0;
      const operation = async () => {
        attempts++;
        if (attempts < 3) throw new Error('Retry');
        return 'success';
      };
      
      const result = await retryManager.executeWithRetry(
        operation,
        'step with @retry(3, 50)',
        defaultOptions
      );
      
      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });

    test('should use default options when no annotation', async () => {
      let attempts = 0;
      const operation = async () => {
        attempts++;
        if (attempts < 3) throw new Error('Retry');
        return 'success';
      };
      
      const result = await retryManager.executeWithRetry(
        operation,
        'step without retry annotation',
        { maxRetries: 2, delay: 10, backoff: 'linear' }
      );
      
      expect(result).toBe('success');
      expect(attempts).toBe(3); // initial + 2 retries
    });

    test('should call onRetry callback', async () => {
      const retryCalls: { attempt: number; maxRetries: number; error: string }[] = [];
      let attempts = 0;
      
      const operation = async () => {
        attempts++;
        if (attempts < 3) throw new Error('Retry');
        return 'success';
      };
      
      const options: StepRetryOptions = {
        maxRetries: 3,
        delay: 10,
        backoff: 'exponential',
        onRetry: (attempt, maxRetries, error) => {
          retryCalls.push({ attempt, maxRetries, error: error.message });
        },
      };
      
      await retryManager.executeWithRetry(operation, 'step', options);
      
      expect(retryCalls.length).toBe(2);
      expect(retryCalls[0].attempt).toBe(1);
      expect(retryCalls[0].maxRetries).toBe(3);
      expect(retryCalls[0].error).toBe('Retry');
    });

    test('should throw after max retries exceeded', async () => {
      const operation = async () => {
        throw new Error('Always fails');
      };
      
      await expect(
        retryManager.executeWithRetry(operation, 'step', { ...defaultOptions, delay: 10 })
      ).rejects.toThrow('Always fails');
    });

    test('should use custom backoff multiplier', async () => {
      let attempts = 0;
      const operation = async () => {
        attempts++;
        if (attempts < 3) throw new Error('Retry');
        return 'success';
      };
      
      const result = await retryManager.executeWithRetry(
        operation,
        'step',
        { maxRetries: 3, delay: 10, backoff: 'exponential', backoffMultiplier: 1.5 }
      );
      
      expect(result).toBe('success');
    });
  });

  describe('parseRetryAnnotation', () => {
    test('should parse @retry(3)', () => {
      // Access private method via any
      const result = (retryManager as any).parseRetryAnnotation('step @retry(3)');
      
      expect(result).toBeDefined();
      expect(result.maxRetries).toBe(3);
      expect(result.delay).toBe(1000); // default delay
    });

    test('should parse @retry(5, 500)', () => {
      const result = (retryManager as any).parseRetryAnnotation('step @retry(5, 500)');
      
      expect(result).toBeDefined();
      expect(result.maxRetries).toBe(5);
      expect(result.delay).toBe(500);
    });

    test('should return null for no annotation', () => {
      const result = (retryManager as any).parseRetryAnnotation('step without retry');
      
      expect(result).toBeNull();
    });

    test('should be case insensitive', () => {
      const result = (retryManager as any).parseRetryAnnotation('step @RETRY(3)');
      
      expect(result).toBeDefined();
      expect(result.maxRetries).toBe(3);
    });
  });

  describe('calculateDelay', () => {
    test('should calculate linear delay', () => {
      const options: RetryOptions = { maxRetries: 3, delay: 100, backoff: 'linear' };
      
      expect((retryManager as any).calculateDelay(options, 1)).toBe(100);
      expect((retryManager as any).calculateDelay(options, 2)).toBe(200);
      expect((retryManager as any).calculateDelay(options, 3)).toBe(300);
    });

    test('should calculate exponential delay', () => {
      const options: RetryOptions = { maxRetries: 3, delay: 100, backoff: 'exponential' };
      
      // Formula: baseDelay * 2^(attempt-1)
      expect((retryManager as any).calculateDelay(options, 1)).toBe(100);  // 100 * 2^0 = 100
      expect((retryManager as any).calculateDelay(options, 2)).toBe(200); // 100 * 2^1 = 200
      expect((retryManager as any).calculateDelay(options, 3)).toBe(400); // 100 * 2^2 = 400
    });

    test('should default to linear when backoff not specified', () => {
      const options: RetryOptions = { maxRetries: 3, delay: 100 };
      
      expect((retryManager as any).calculateDelay(options, 1)).toBe(100);
      expect((retryManager as any).calculateDelay(options, 2)).toBe(200);
    });
  });
});
