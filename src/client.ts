import {
  ContivonAPIError,
  ContivonAuthError,
  ContivonRateLimitError,
  ContivonTimeoutError,
} from "./errors";
import type { ContivonClientOptions } from "./types";

const DEFAULT_BASE_URL = "https://api.prolixis.in";
const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_MAX_RETRIES = 3;

export interface RequestOptions {
  method?: "GET" | "POST" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | undefined>;
}

export class HttpClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly fetchImpl: typeof fetch;

  constructor(options: ContivonClientOptions) {
    if (!options.apiKey || typeof options.apiKey !== "string") {
      throw new Error("Contivon: `apiKey` is required.");
    }
    this.apiKey = options.apiKey;
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;

    const resolved = options.fetch ?? globalThis.fetch;
    if (!resolved) {
      throw new Error(
        "Contivon: no global `fetch` available. Pass `fetch` in options or run on Node.js >= 18.",
      );
    }
    // Bind so calls don't lose `this` in some runtimes.
    this.fetchImpl = resolved.bind(globalThis);
  }

  async request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
    const url = new URL(this.baseUrl + path);
    if (opts.query) {
      for (const [k, v] of Object.entries(opts.query)) {
        if (v !== undefined) url.searchParams.set(k, String(v));
      }
    }

    let attempt = 0;
    let lastError: unknown;

    while (attempt <= this.maxRetries) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);
      try {
        const res = await this.fetchImpl(url.toString(), {
          method: opts.method ?? "GET",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
            "User-Agent": "contivon-sdk/1.0.0",
          },
          body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
          signal: controller.signal,
        });

        if (res.ok) {
          if (res.status === 204) return undefined as T;
          const text = await res.text();
          return (text ? JSON.parse(text) : undefined) as T;
        }

        // Error path
        const bodyText = await res.text();
        let parsed: unknown = bodyText;
        try {
          parsed = bodyText ? JSON.parse(bodyText) : undefined;
        } catch {
          /* keep as text */
        }
        const message = extractErrorMessage(parsed) ?? `HTTP ${res.status}`;

        if (res.status === 401 || res.status === 403) {
          throw new ContivonAuthError(res.status, message, parsed);
        }
        if (res.status === 429) {
          const retryAfter = parseRetryAfter(res.headers.get("retry-after"));
          if (attempt < this.maxRetries) {
            await sleep(retryAfter ?? backoff(attempt));
            attempt++;
            continue;
          }
          throw new ContivonRateLimitError(res.status, message, parsed, retryAfter);
        }
        if (res.status >= 500 && attempt < this.maxRetries) {
          await sleep(backoff(attempt));
          attempt++;
          continue;
        }
        throw new ContivonAPIError(res.status, message, parsed);
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") {
          if (attempt < this.maxRetries) {
            attempt++;
            lastError = new ContivonTimeoutError(this.timeoutMs);
            continue;
          }
          throw new ContivonTimeoutError(this.timeoutMs);
        }
        // Re-throw our own errors; retry only network errors.
        if (
          err instanceof ContivonAPIError ||
          err instanceof ContivonAuthError ||
          err instanceof ContivonRateLimitError
        ) {
          throw err;
        }
        if (attempt < this.maxRetries) {
          lastError = err;
          await sleep(backoff(attempt));
          attempt++;
          continue;
        }
        throw err;
      } finally {
        clearTimeout(timer);
      }
    }
    throw lastError ?? new Error("Contivon: request failed");
  }
}

function backoff(attempt: number): number {
  const base = Math.min(1000 * 2 ** attempt, 8000);
  return base + Math.floor(Math.random() * 250);
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function parseRetryAfter(header: string | null): number | undefined {
  if (!header) return undefined;
  const secs = Number(header);
  if (!Number.isNaN(secs)) return secs * 1000;
  const date = Date.parse(header);
  if (!Number.isNaN(date)) return Math.max(0, date - Date.now());
  return undefined;
}

function extractErrorMessage(body: unknown): string | undefined {
  if (!body || typeof body !== "object") return undefined;
  const b = body as Record<string, unknown>;
  if (typeof b.error === "string") return b.error;
  if (typeof b.message === "string") return b.message;
  return undefined;
}
