import type { HttpClient } from "../client";
import type { IngestDocumentParams, IngestResult } from "../types";

export class DocumentsResource {
  constructor(private readonly http: HttpClient) {}

  /** Ingest a document. The server chunks and embeds it. */
  async ingest(params: IngestDocumentParams): Promise<IngestResult> {
    return this.http.request<IngestResult>("/document-ingest", {
      method: "POST",
      body: {
        namespace: params.userId,
        filename: params.filename,
        content: params.content,
        metadata: params.metadata ?? {},
      },
    });
  }

  /** Delete a previously ingested document and all its chunks. */
  async delete(fileId: string): Promise<void> {
    await this.http.request(`/document/${encodeURIComponent(fileId)}`, { method: "DELETE" });
  }
}
