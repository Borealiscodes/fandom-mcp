# NDH-META-SYSTEMS Engineering Upgrade Roadmap: `Borealiscodes/fandom-mcp`

**Target Repository:** `Borealiscodes/fandom-mcp` (Concurrent Peer-Node Fork of `8b-is/fandom-mcp`)  
**Runtime Stack:** Zero-Dependency Node.js ESM (`.mjs` / `node --test`, `CGO_ENABLED=0` / Zero-NPM-Bloat Edge Compatible)  
**Methodology:** NDH-Meta-Systems (Sealed-Layer Neutral · Math Over Vibes · Qualia-Zero)  
**Canonical Anchor:** [DOI: 10.5281/zenodo.24149283](https://doi.org) · [DOI: 10.5281/zenodo.24240994](https://doi.org)  

---

## 1. Current Baseline Diagnosis

Inspection of the current `fandom-mcp` repository reveals a split between live, runnable ESM MCP server modules and unimplemented architectural scaffolding:

1. **Runtime vs. Documentation Drift:** Root `.mjs` entrypoints (`fandom-mcp.mjs`, `http-json.mjs`, `test.mjs`, `test-http.mjs`, `test-stdio.mjs`, `test-live.mjs`) execute directly via Node's standard library, whereas `README.md` references unbuilt `src/` directories and legacy `AyeOS` / `A9 Quantum-Inspired Runtime` terminology.
2. **External MediaWiki / Fandom Fetch Exposure (`http-json.mjs`):** Outbound queries to Fandom APIs require strict SSRF host allowlists (`*.fandom.com`), HTTPS-only enforcement, hard request timeouts, and bounded response byte ceilings (`<= 2 MiB`) to prevent OOM or SSRF pivots on constrained edge hardware.
3. **Canon Contradiction & Scaling Hazards:** Dragon Ball timeline branching (Future Trunks, Cell's timeline, Goku Black time rings) and exponential transformation multipliers easily trigger graph cycles or IEEE-754 `Infinity` / `NaN` overflow if evaluated with standard floats or unguarded graph traversal.

---

## 2. Four-Phase Bulletproof Upgrade Roadmap

### Phase 1: Transport Hardening & SSRF-Proof MediaWiki Client (`http-json.mjs`)
* **Strict Host Allowlist (`AllowlistGuard`):** Enforce `https:` protocol only and restrict hostnames strictly to `^[a-z0-9-]+\.fandom\.com$` (explicitly blocking IP literals, `localhost`, `.internal`, userinfo `@` tricks, and HTTP redirects to non-allowlisted hosts).
* **Bounded Stream Reader (`MaxResponseBytes = 2 MiB`):** Replace unbounded `.json()` / `.text()` consumption with an incremental `ReadableStream` byte counter that aborts immediately if payloads exceed `2,097,152` bytes, followed by UTF-8 validation.
* **Deterministic Timeout & Retry Envelope:** Enforce `AbortSignal.timeout(8000)` per request with bounded jitter-free backoff (max 2 retries on `429` / `503`) and structured fail-closed error objects (`ErrHostNotAllowed`, `ErrPayloadTooLarge`, `ErrUpstreamTimeout`).
* **Query & Title Sanitization:** Normalize and bound page titles (`<= 256` UTF-8 bytes), strip control characters, and enforce strict JSON schema validation on MediaWiki `query` / `parse` responses.

### Phase 2: Deterministic Canon & Saga DAG Engine (`toolkit/canon_engine.mjs`)
* **Cycle-Checked Saga & Timeline DAG:** Implement Kahn's topological sort + DFS back-edge detection (`ErrTimelineCycle`) across era edges (`DB` → `DBZ` → `DBS` / `Daima` / `GT` / alternate timelines) so paradoxical parent pointers fail closed with exact cycle traces.
* **Exact `BigInt` Rational Multipliers (`p/q`):** Replace `Number` / float scaling with reduced `BigInt` fractions (`{ p: BigInt, q: BigInt }`, `q > 0n`) so stacked transformation multipliers (e.g., `50/1` Super Saiyan × `20/1` Kaioken × `400/1` SSJ3) never overflow to `Infinity` or lose precision.
* **Discrete Holonomy Contradiction Detector:** Evaluate closed `(Character, Form, Era/Timeline)` transport loops across canon sources (manga, anime, databooks); flag non-commuting attribute mutations as structured `HolonomyConflict` diagnostics rather than silent overwrites.
* **Deterministic Spectral / Jaccard Entity Clustering:** Rank related character, technique, and cosmology nodes using integer-scaled dot products and deterministic tie-breaking (lexicographical canonical ID) so query results are 100% reproducible across runs.

### Phase 3: MCP Protocol Hardening & Firewall Integration (`fandom-mcp.mjs` + `A6-Firewall-Companion`)
* **Strict Tool Input Schemas:** Validate every MCP `tools/call` argument (`wiki`, `title`, `query`, `era`, `limit`) at the JSON-RPC boundary, clamping `limit` (`1..50`) and rejecting unknown or oversized fields before touching network or graph state.
* **Bounded Tool Output Ceiling (`32 KiB`):** Clamp every MCP tool response payload to ` All architectural roadmaps, mathematical invariants, and fictional-universe coherence engines documented in this repository are descriptive and entertainment/engineering-focused. They do not activate NDH geometry, consciousness claims, or external governance altitude.
