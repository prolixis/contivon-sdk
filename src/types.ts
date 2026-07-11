export interface ContivonClientOptions {
  /** Your Contivon API key (`px_live_...`). */
  apiKey: string;
  /** Override the API base URL. Defaults to `https://api.prolixis.in`. */
  baseUrl?: string;
  /** Request timeout in milliseconds. Defaults to 30_000. */
  timeoutMs?: number;
  /** Max retries on 429/5xx. Defaults to 3. */
  maxRetries?: number;
  /** Custom fetch implementation (defaults to globalThis.fetch). */
  fetch?: typeof fetch;
}

export type MemoryType = "chat" | "document" | "fact" | "preference" | string;

export interface AddMemoryParams {
  /** The end-user this memory belongs to. Ensures multi-tenant isolation. */
  userId: string;
  /** The text to remember. */
  content: string;
  memoryType?: MemoryType;
  /** 1-5. Higher = more important. Defaults to 3. */
  importance?: number;
  metadata?: Record<string, unknown>;
}

export interface Memory {
  id: string;
  content: string;
  memory_type: MemoryType;
  importance: number;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface SearchMemoryParams {
  userId: string;
  query: string;
  limit?: number;
  minImportance?: number;
}

export interface SearchResult extends Memory {
  similarity: number;
}

export interface ListMemoryParams {
  userId: string;
  limit?: number;
  offset?: number;
}

export interface IngestDocumentParams {
  userId: string;
  filename: string;
  /** Raw text extracted from the document. */
  content: string;
  metadata?: Record<string, unknown>;
}

export interface IngestResult {
  chunks_stored: number;
  file_id: string;
  version: number;
}
