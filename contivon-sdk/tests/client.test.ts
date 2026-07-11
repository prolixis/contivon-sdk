import { describe, expect, it, vi } from "vitest";
import { Contivon, ContivonAuthError, ContivonAPIError } from "../src";

function mockFetch(response: {
  status?: number;
  body?: unknown;
  headers?: Record<string, string>;
}) {
  return vi.fn(async (_url: string, _init?: RequestInit) => {
    return new Response(JSON.stringify(response.body ?? {}), {
      status: response.status ?? 200,
      headers: { "Content-Type": "application/json", ...(response.headers ?? {}) },
    });
  });
}

describe("Contivon client", () => {
  it("requires an apiKey", () => {
    // @ts-expect-error missing apiKey
    expect(() => new Contivon({})).toThrow();
  });

  it("sends Authorization header and correct body on memories.add", async () => {
    const fetchMock = mockFetch({ body: { id: "mem_123" } });
    const c = new Contivon({ apiKey: "px_live_test", fetch: fetchMock as unknown as typeof fetch });

    const res = await c.memories.add({ userId: "u1", content: "hello" });
    expect(res.id).toBe("mem_123");

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe("https://api.prolixis.in/memory-store");
    expect(init?.method).toBe("POST");
    const headers = init?.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer px_live_test");
    const body = JSON.parse(init?.body as string);
    expect(body).toMatchObject({ content: "hello", namespace: "u1", memory_type: "chat", importance: 3 });
  });

  it("returns results array on memories.search", async () => {
    const fetchMock = mockFetch({
      body: { results: [{ id: "m1", content: "x", similarity: 0.9, memory_type: "chat", importance: 3, metadata: {}, created_at: "" }] },
    });
    const c = new Contivon({ apiKey: "k", fetch: fetchMock as unknown as typeof fetch });
    const results = await c.memories.search({ userId: "u", query: "q" });
    expect(results).toHaveLength(1);
    expect(results[0].similarity).toBe(0.9);
  });

  it("throws ContivonAuthError on 401", async () => {
    const fetchMock = mockFetch({ status: 401, body: { error: "invalid key" } });
    const c = new Contivon({ apiKey: "bad", fetch: fetchMock as unknown as typeof fetch, maxRetries: 0 });
    await expect(c.memories.add({ userId: "u", content: "x" })).rejects.toBeInstanceOf(ContivonAuthError);
  });

  it("throws ContivonAPIError on 400 with the server message", async () => {
    const fetchMock = mockFetch({ status: 400, body: { error: "bad input" } });
    const c = new Contivon({ apiKey: "k", fetch: fetchMock as unknown as typeof fetch, maxRetries: 0 });
    await expect(c.memories.search({ userId: "u", query: "q" })).rejects.toMatchObject({
      name: "ContivonAPIError",
      status: 400,
      message: "bad input",
    });
  });

  it("does not hit real network — mock is called", async () => {
    const fetchMock = mockFetch({ body: {} });
    const c = new Contivon({ apiKey: "k", fetch: fetchMock as unknown as typeof fetch });
    await c.memories.add({ userId: "u", content: "x" });
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});
