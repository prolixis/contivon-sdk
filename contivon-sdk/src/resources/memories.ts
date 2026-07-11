import type { HttpClient } from "../client";
import type {
  AddMemoryParams,
  ListMemoryParams,
  Memory,
  SearchMemoryParams,
  SearchResult,
} from "../types";

export class MemoriesResource {
  constructor(private readonly http: HttpClient) {}

  /** Store a new memory. */
  async add(params: AddMemoryParams): Promise<{ id: string }> {
    return this.http.request("/memory-store", {
      method: "POST",
      body: {
        content: params.content,
        namespace: params.userId,
        memory_type: params.memoryType ?? "chat",
        importance: params.importance ?? 3,
        metadata: params.metadata ?? {},
      },
    });
  }

  /** Semantic search across a user's memories. */
  async search(params: SearchMemoryParams): Promise<SearchResult[]> {
    const res = await this.http.request<{ results: SearchResult[] }>("/memory-search", {
      method: "POST",
      body: {
        q: params.query,
        namespace: params.userId,
        limit: params.limit ?? 5,
        min_importance: params.minImportance ?? 1,
      },
    });
    return res.results ?? [];
  }

  /** List memories for a user. */
  async list(params: ListMemoryParams): Promise<Memory[]> {
    const res = await this.http.request<{ memories: Memory[] }>("/memory-list", {
      method: "GET",
      query: {
        namespace: params.userId,
        limit: params.limit ?? 50,
        offset: params.offset ?? 0,
      },
    });
    return res.memories ?? [];
  }

  /** Get a single memory by ID. */
  async get(id: string): Promise<Memory> {
    return this.http.request<Memory>(`/memory/${encodeURIComponent(id)}`);
  }

  /** Delete a memory by ID. */
  async delete(id: string): Promise<void> {
    await this.http.request(`/memory/${encodeURIComponent(id)}`, { method: "DELETE" });
  }
}
