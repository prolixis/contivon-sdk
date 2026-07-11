/**
 * Base error class for all Contivon SDK errors.
 */
export class ContivonError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ContivonError";
  }
}

/**
 * Thrown for any non-2xx HTTP response from the Contivon API that is not
 * an auth or rate-limit error.
 */
export class ContivonAPIError extends ContivonError {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.name = "ContivonAPIError";
    this.status = status;
    this.body = body;
  }
}

/**
 * Thrown for 401/403 responses. Usually means the API key is missing,
 * invalid, or revoked.
 */
export class ContivonAuthError extends ContivonAPIError {
  constructor(status: number, message: string, body: unknown) {
    super(status, message, body);
    this.name = "ContivonAuthError";
  }
}

/**
 * Thrown for 429 responses after retries have been exhausted.
 */
export class ContivonRateLimitError extends ContivonAPIError {
  readonly retryAfter?: number;

  constructor(status: number, message: string, body: unknown, retryAfter?: number) {
    super(status, message, body);
    this.name = "ContivonRateLimitError";
    this.retryAfter = retryAfter;
  }
}

/**
 * Thrown when a request exceeds the configured timeout.
 */
export class ContivonTimeoutError extends ContivonError {
  constructor(timeoutMs: number) {
    super(`Request timed out after ${timeoutMs}ms`);
    this.name = "ContivonTimeoutError";
  }
}
