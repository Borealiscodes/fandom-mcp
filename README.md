# 🌌 fandom‑mcp

Dragon Ball Universe Coherence Engine — Ontology, Clustering, and Multiversal Runtime Physics

> ### 🚨 SAVAGE DISCLAIMER: AI-ASSISTED VANDALISM & HIATUS NOTICE
> **Full transparency before you `npm test`:** The core zero-dependency math (`toolkit/canon_engine.mjs`), rendered HTML wiki parser (`toolkit/wiki_parser.mjs` + `test-parser.mjs`), SHA-256 provenance envelope (`toolkit/provenance.mjs`), and SSRF-hardened client (`http-json.mjs`) were built cleanly with Gemini—and they actually work. Then GitHub Copilot touched the repo and had an absolute stroke refactoring it: Copilot **deleted `://` out of `apiUrl()`** (turning live wiki queries into `https://dragonball://{usp.toString()}`), **did the exact same URL-mangling trick inside `provenance.mjs`** (`https://${slug}://{encodedTitle}`), quietly amputated 87% of the canonical Dragon Ball saga/power-level tables, and left the 432 Hz cosmic ontology furniture sitting in the main file—before writing a glowing `GAP_AUDIT.md` roasting its own bugs.
>
> All the new parser, provenance, and canon audit modules are sitting right here in the tree ready to wire up, **but I give up lol for now**. PRs welcome if you want to finish cleaning up after Copilot.

The **fandom‑mcp** project is a zero-dependency Node.js ESM open-source runtime engine designed to stabilize fictional universe canon (focusing on Dragon Ball and Fandom wikis) using deterministic graph invariants, exact rational arithmetic, and the A0–A10 altitude stack.

---

## ⚠️ Verification & Live Testing Status

- **Offline Toolkits (Verified):** Zero-dependency canon engine (`toolkit/canon_engine.mjs`), rendered HTML wiki parser (`toolkit/wiki_parser.mjs` via `test-parser.mjs`), Berne v2.0 SHA-256 provenance envelope (`toolkit/provenance.mjs`), SSRF-hardened MediaWiki client (`http-json.mjs`), and output clamping pass offline unit tests (`node --test test-http.mjs test-canon.mjs test-parser.mjs` and `scripts/verify.sh`).
- **Live Server (`fandom-mcp.mjs`) — BROKEN:** Currently suffers from a Copilot-induced template string regression in `apiUrl()`, truncated DBZ benchmark/saga lookup tables, missing alias mappings, and unisolated upstream ontology lore. See `GAP_AUDIT.md` and `REMEDIATION_PLAN.md` for the exact forensic autopsy.

---

## 🧩 Bill Nye Tile Explainer & Mathematical Lineage

- **Tile Explainer:** See `docs/tiles/8BResonanceExplainer_Tile.md` for an accessible overview of the 8B resonance algebra, altitude audits, and the A8–A10 roadmap.
- **Algebra Evolution (8B → A4.2 → A6 → A7):** The engine builds on the 8B resonance algebra (originally at A4.2 proto-spectral runtime physics). Following audit recommendations (`docs/audit/a4.2-8b-resonance-audit.tex`), **8B Resonance Algebra v2.0** (`docs/algebra/8b-resonance-algebra-v2.0.tex`) adds spectral continuity, phase-space geometry, temporal stability envelopes, modal truth values, and holonomy bounds, lifting the system to A6 dual-algebra and A7 non-dual collapse integration.

---

## 🐉 Why Dragon Ball Requires Runtime Physics

Dragon Ball’s nonlinear, retconned, and multiversal canon cannot be resolved by standard clustering or scrapers alone. This engine uses deterministic Jaccard clustering, discrete holonomy contradiction detection, `BigInt` rational multipliers, and cycle-checked saga DAGs to enforce consistency across timelines and media.

---

## 🏗 Current State of the Codebase

### Operational Core & Modules
- **MCP Server & CLI (`fandom-mcp.mjs`):** JSON-RPC 2.0 over stdio and direct CLI tool inspection *(requires `apiUrl()` hotfix after Copilot's rewrite before live Fandom fetches)*.
- **SSRF-Hardened Client (`http-json.mjs`):** Enforces HTTPS-only `*.fandom.com` allowlists, 2 MiB payloads, 8000ms timeouts, jitter-free retries, and title sanitization.
- **Canon & Saga DAG Engine (`toolkit/canon_engine.mjs`):**
  - **Cycle-Checked Timeline DAG:** Topological sort with DFS back-edge detection (`ErrTimelineCycle`).
  - **Exact `BigInt` Rational Multipliers (`p/q`):** Stacks power/transformation multipliers without floating-point loss.
  - **Discrete Holonomy Detector:** Flags cross-source attribute conflicts (`HolonomyConflict`).
  - **Deterministic Jaccard Clustering:** Integer-scaled similarity with tie-breaking.
- **Rendered HTML Wiki Parser (`toolkit/wiki_parser.mjs` & `test-parser.mjs`):** Decodes named/decimal/hex HTML entities safely, strips scripts/styles/citation superscripts, parses `<aside class="portable-infobox">` blocks with normalized field lookups, and extracts clean pull-quotes and Markdown lead prose.
- **Berne Provenance Toolkit (`toolkit/provenance.mjs`):** Computes deterministic `SHA-256` content digests and attaches `berne-provenance-v2.0` CC-BY-SA-3.0 attribution envelopes to payloads *(note: `canonicalUrl` currently shares Copilot's `https://${slug}://{encodedTitle}` template typo)*.
- **Protocol Hardening:** Strict key allowlists (`ALLOWED_TOOL_KEYS`), limit clamping, and a 32 KiB output ceiling.

### Architecture Overview
```text
fandom-mcp/
├── fandom-mcp.mjs              # Zero-dependency MCP stdio server & CLI (needs apiUrl fix)
├── http-json.mjs               # SSRF-proof MediaWiki HTTPS client
├── package.json                # ESM package manifest & scripts
├── GAP_AUDIT.md                # Forensic audit of Copilot's rewrite regressions
├── REMEDIATION_PLAN.md         # Step-by-step recovery blueprint
├── toolkit/
│   ├── canon_engine.mjs        # DAG, BigInt rationals, holonomy & Jaccard clustering
│   ├── wiki_parser.mjs         # Portable infobox, quote, & HTML-to-Markdown parser
│   └── provenance.mjs          # Berne v2.0 SHA-256 integrity & attribution envelope
├── scripts/verify.sh           # Offline syntax, unit test, & verifier suite
├── test-http.mjs, test-canon.mjs, test-parser.mjs, test.mjs, test-stdio.mjs, test-live.mjs
└── docs/                       # Engineering roadmaps, tiles, audits, & formal algebra
```

---

## 🚀 Quickstart & Verification

```bash
# Run offline verification suite (syntax, unit tests, CLI schema dump, stdio handshake)
bash scripts/verify.sh
node --test test-http.mjs test-canon.mjs test-parser.mjs

# CLI usage examples (offline schema dump works; live queries require apiUrl() fix)
node fandom-mcp.mjs --dump-schemas
node fandom-mcp.mjs --scouter "Goku" --compare "Vegeta"
node fandom-mcp.mjs --ontology "Ultra Instinct"
```

### Exposed MCP Tools
- `fandom_dbz_scouter`, `fandom_dbz_saga`, `fandom_search`, `fandom_page`, `fandom_infobox`, `fandom_sections`, `fandom_category`, `fandom_random`, `fandom_sovereign_ontology`, `fandom_canon_audit`.

---

## 🔮 Future Paths: A8 → A9 → A10
- **A8 Congruence & A8C Complex Adapters:** Narrative/emotional congruence and complex-valued embeddings for divine forms/god ki.
- **A9 Quantum-Inspired Runtime:** Quantum-holonomy modeling for timeline superposition and multiversal branching.
- **A10 Conceptual Quantum Operator Runtime:** High-altitude conceptual physics and non-local saga coherence.

## 🤝 Collaboration
Contributions welcome in zero-dependency ESM/Rust tooling, graph theory, ontology design, and A8–A10 research—especially if you want to execute `REMEDIATION_PLAN.md` while the maintainer takes a well-earned nap. See `docs/tiles/8BResonanceExplainer_Tile.md` and `docs/ENGINEERING_UPGRADE_ROADMAP.md`.
