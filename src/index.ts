import { HttpClient } from "./client";
import { MemoriesResource } from "./resources/memories";
import { DocumentsResource } from "./resources/documents";
import type { ContivonClientOptions } from "./types";

export class Contivon {
  readonly memories: MemoriesResource;
  readonly documents: DocumentsResource;

  constructor(options: ContivonClientOptions) {
    const http = new HttpClient(options);
    this.memories = new MemoriesResource(http);
    this.documents = new DocumentsResource(http);
  }
}

export {
  ContivonError,
  ContivonAPIError,
  ContivonAuthError,
  ContivonRateLimitError,
  ContivonTimeoutError,
} from "./errors";

export type {
  ContivonClientOptions,
  AddMemoryParams,
  SearchMemoryParams,
  SearchResult,
  Memory,
  MemoryType,
  ListMemoryParams,
  IngestDocumentParams,
  IngestResult,
} from "./types";
