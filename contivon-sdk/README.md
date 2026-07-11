# contivon

[![npm version](https://img.shields.io/npm/v/contivon.svg)](https://www.npmjs.com/package/contivon)
[![CI](https://github.com/prolixis/contivon-sdk/actions/workflows/ci.yml/badge.svg)](https://github.com/prolixis/contivon-sdk/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

Official TypeScript SDK for the [Contivon](https://contivon.com) memory API — long-term memory for AI agents and LLM apps.

## Install

```bash
npm install contivon
```

## Quickstart

```ts
import { Contivon } from "contivon";

const client = new Contivon({ apiKey: process.env.CONTIVON_API_KEY! });

await client.memories.add({
  userId: "user_123",
  content: "User prefers dark mode and lives in Lucknow",
});

const results = await client.memories.search({
  userId: "user_123",
  query: "what does the user prefer?",
  limit: 5,
});
```

## Methods

| Method | Description |
| --- | --- |
| `memories.add({ userId, content, memoryType?, importance?, metadata? })` | Store a memory. |
| `memories.search({ userId, query, limit?, minImportance? })` | Semantic search. |
| `memories.list({ userId, limit?, offset? })` | List memories for a user. |
| `memories.get(id)` | Get one memory. |
| `memories.delete(id)` | Delete one memory. |
| `documents.ingest({ userId, filename, content, metadata? })` | Ingest a document — server chunks + embeds. |
| `documents.delete(fileId)` | Delete a document and its chunks. |

## Errors

`ContivonAuthError` (401/403) · `ContivonRateLimitError` (429 after retries) · `ContivonAPIError` (everything else, carries `status` + `body`) · `ContivonTimeoutError`.

## Docs

Full docs: <https://contivon.com/sdk> · REST reference: <https://contivon.com/docs>

## License

MIT
