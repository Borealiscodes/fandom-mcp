# 🔍 Fork Divergence Audit: `Borealiscodes/fandom-mcp` vs. `8b-is/fandom-mcp`

**Fork Repository:** `Borealiscodes/fandom-mcp`  
**Upstream Reference:** `8b-is/fandom-mcp` (commit `29affd4e527d3d643e526cb376079b9afc3e4125`)  
**Runtime Stack:** Zero-Dependency Node.js ESM (`.mjs` / `node --test`)  
**Status:** Phases 1–4 implemented and verified offline via `node --test`; live Fandom network verification pending.

---

## 1. Executive Summary

While `Borealiscodes/fandom-mcp` preserves full CLI flag compatibility and all 9 original MCP tools from upstream `8b-is/fandom-mcp`, the two repositories have diverged in engineering focus:

- **Upstream (`8b-is/fandom-mcp`):** Focuses on expanding multi-universe Sovereign Library ontology profiles (`mysterious-universe`, `vikings`), constellation triad synthesis (`+++`), and lore commentary, while retaining permissive HTTP fetching (`4 MiB` / `15s`, any HTTPS domain) and unbounded JSON-RPC output.
- **Fork (`Borealiscodes/fandom-mcp`):** Enforces fail-closed SSRF transport boundaries (`*.fandom.com`), bounded memory ceilings (`2 MiB` upstream / `32 KiB` MCP output), strict JSON-RPC argument schemas, and a deterministic canon verification engine (`toolkit/canon_engine.mjs` + `fandom_canon_audit`).

---

## 2. Side-by-Side Architecture & Security Comparison

| Dimension | Upstream (`8b-is/fandom-mcp`) | Fork (`Borealiscodes/fandom-mcp`) | Divergence Rationale |
| :--- | :--- | :--- | :--- |
| **Host Allowlist & SSRF Guard** | Allows any `https:` host; blocks only userinfo credentials (`username`/`password`). | Strict `^[a-z0-9-]+\.fandom\.com$` regex enforced on initial URLs **and** every redirect hop (`ErrHostNotAllowed`). Blocks IP literals, `localhost`, and non-`443` ports. | Prevents SSRF pivots and open-redirect escapes to internal metadata endpoints. |
| **Upstream Payload Ceiling** | `4 MiB` (`4 * 1024 * 1024` bytes) with standard `.toString('utf8')`. | `2 MiB` (`2,097,152` bytes) with fatal UTF-8 decoding (`new TextDecoder('utf-8', { fatal: true })`) (`ErrPayloadTooLarge`). | Prevents OOM spikes on edge runtimes and rejects malformed byte streams. |
| **Timeout & Retry Policy** | Single `15,000 ms` deadline across all hops; zero retry handling. | `8,000 ms` per-attempt timeout (`AbortSignal.timeout`) + up to 2 deterministic jitter-free retries (`250 ms`, `500 ms`) on `429`/`503` (`ErrUpstreamTimeout`). | Bounds tail latency while surviving transient Fandom rate limits deterministically. |
| **Title & Query Sanitization** | Basic wiki slug regex; raw page titles passed to `URLSearchParams`. | `sanitizeTitle()` strips ASCII/C1 control characters, normalizes whitespace, and enforces a `<= 256` UTF-8 byte ceiling (`ErrInvalidTitle`). | Prevents control-character injection and oversized MediaWiki query parameters. |
| **Canon & Power-Level Math** | Static benchmark lookup tables (`CANON_SCOUTER_BENCHMARKS`); no graph or multiplier verification. | `toolkit/canon_engine.mjs` provides cycle-checked Saga DAGs (`ErrTimelineCycle`), exact `BigInt` rational multipliers (`p/q`), discrete holonomy conflict detection, and deterministic Jaccard clustering. | Eliminates IEEE-754 float overflow on stacked multipliers and catches timeline paradoxes. |
| **MCP Tool Surface** | 9 tools (`fandom_dbz_scouter` through `fandom_random`). | 10 tools: preserves all 9 upstream tools and adds **`fandom_canon_audit`**. | Exposes deterministic canon verification directly to MCP agents. |
| **JSON-RPC Input Validation** | Passes `params.arguments` directly into tool handlers. | `validateToolArgs()` enforces strict per-tool key allowlists (`ALLOWED_TOOL_KEYS`), rejects non-objects, and clamps `limit` to `1..50`. | Fails closed on malformed or unexpected MCP client payloads. |
| **MCP Output Ceiling** | Unbounded `JSON.stringify` output over stdio. | `clampToolOutput()` caps serialized tool responses at **`32 KiB`** (`32,768` bytes) with explicit truncation notice. | Protects LLM context windows from oversized wiki page dumps. |

---

## 3. File-Level Divergence Inventory

### Modified Files
- **`http-json.mjs`:** Refactored from a generic HTTPS fetcher into a fail-closed MediaWiki client exporting `fetchJson`, `assertAllowlistedUrl`, `sanitizeTitle`, `validateMediaWikiResponse`, and `HttpClientError`.
- **`fandom-mcp.mjs`:** Wired `http-json.mjs` and `toolkit/canon_engine.mjs`, added `fandom_canon_audit`, enforced `ALLOWED_TOOL_KEYS` boundary checks, and clamped stdio `tools/call` responses to `32 KiB`.
- **`README.md`:** Documented the zero-dependency ESM runtime, offline verification status, and Phase 1–4 security/canon invariants.

### New Files Added in Fork
- **`toolkit/canon_engine.mjs`:** Zero-dependency ESM implementation of Kahn's topological sort + DFS back-edge cycle detection, `BigInt` rational fractions, holonomy contradiction detection, and integer-scaled Jaccard entity ranking.
- **`test-http.mjs`:** Offline unit tests (`node:test`) covering SSRF allowlists, redirect blocks, `2 MiB` payload limits, `429`/`503` retries, title sanitization, and schema validation.
- **`test-canon.mjs`:** Offline unit tests (`node:test`) covering DAG cycles, `BigInt` multipliers, holonomy conflicts, Jaccard tie-breaking, boundary rejection, and `fandom_canon_audit`.
- **`scripts/verify.sh`:** One-command offline verification script running `node --check`, `node --test`, CLI schema dumps, and stdio JSON-RPC handshake checks.
- **`docs/ENGINEERING_UPGRADE_ROADMAP.md`:** Four-phase architectural specification guiding the fork's hardening.

---

## 4. Upstream Sync & Cherry-Pick Policy

1. **Do Not Blind-Merge Upstream:** Upstream `http-json.mjs` and `fandom-mcp.mjs` lack SSRF allowlists, `32 KiB` output caps, and strict argument validation. Merging directly would regress security boundaries.
2. **Selective Lore Cherry-Picks Only:** New entries added to upstream `SOVEREIGN_ONTOLOGY_PROFILES` or `CANON_SCOUTER_BENCHMARKS` are pure data objects and can be cherry-picked safely into `fandom-mcp.mjs` without altering transport or protocol guards.
3. **Verification Gate:** Any upstream cherry-pick must pass `bash scripts/verify.sh` and `node --test test-http.mjs test-canon.mjs` before commit.
