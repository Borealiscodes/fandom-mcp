# 🌌 fandom‑mcp

Dragon Ball Universe Coherence Engine — Ontology, Clustering, and Multiversal Runtime Physics

The **fandom‑mcp** project is a zero-dependency Node.js ESM open-source runtime engine designed to stabilize fictional universe canon (focusing on Dragon Ball and Fandom wikis) using deterministic graph invariants, exact rational arithmetic, and the A0–A10 altitude stack.

---

## ⚠️ Verification & Live Testing Status

- **Baseline Runtime:** Zero-dependency Node.js ESM server (`fandom-mcp.mjs`), JSON-RPC 2.0 stdio transport, CLI flags (`--scouter`, `--ontology`, `--page`, `--infobox`, `--search`, `--saga`, `--category`, `--random`), MediaWiki parser, and Sovereign Library Ontology profiles are live and operational.
- **Phases 1–4 Upgrades (Offline Verified):** SSRF-hardened MediaWiki client (`http-json.mjs`), deterministic canon engine (`toolkit/canon_engine.mjs`), `fandom_canon_audit` MCP tool, and output clamping have passed offline unit tests (`node --test test-http.mjs test-canon.mjs` and `scripts/verify.sh`), **but are untested against live Fandom endpoints**.

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
- **MCP Server & CLI (`fandom-mcp.mjs`):** JSON-RPC 2.0 over stdio and direct CLI tool inspection.
- **SSRF-Hardened Client (`http-json.mjs`):** Enforces HTTPS-only `*.fandom.com` allowlists, 2 MiB payloads, 8000ms timeouts, jitter-free retries, and title sanitization.
- **Canon & Saga DAG Engine (`toolkit/canon_engine.mjs`):**
  - **Cycle-Checked Timeline DAG:** Topological sort with DFS back-edge detection (`ErrTimelineCycle`).
  - **Exact `BigInt` Rational Multipliers (`p/q`):** Stacks power/transformation multipliers without floating-point loss.
  - **Discrete Holonomy Detector:** Flags cross-source attribute conflicts (`HolonomyConflict`).
  - **Deterministic Jaccard Clustering:** Integer-scaled similarity with tie-breaking.
- **Protocol Hardening:** Strict key allowlists (`ALLOWED_TOOL_KEYS`), limit clamping, and a 32 KiB output ceiling.

### Architecture Overview
```text
fandom-mcp/
├── fandom-mcp.mjs           # Zero-dependency MCP stdio server & CLI
├── http-json.mjs            # SSRF-proof MediaWiki HTTPS client
├── package.json             # ESM package manifest & scripts
├── toolkit/canon_engine.mjs # DAG, BigInt rationals, holonomy & Jaccard clustering
├── scripts/verify.sh        # Offline syntax, unit test, & verifier suite
├── test-http.mjs, test-canon.mjs, test.mjs, test-stdio.mjs, test-live.mjs
└── docs/                    # Engineering roadmaps, tiles, audits, & formal algebra
```

---

## 🚀 Quickstart & Verification

```bash
# Run offline verification suite (syntax, unit tests, CLI schema dump, stdio handshake)
bash scripts/verify.sh
node --test test-http.mjs test-canon.mjs

# CLI usage examples
node fandom-mcp.mjs --scouter "Goku" --compare "Vegeta"
node fandom-mcp.mjs --ontology "Ultra Instinct"
node fandom-mcp.mjs --dump-schemas
```

### Exposed MCP Tools
- `fandom_dbz_scouter`, `fandom_dbz_saga`, `fandom_search`, `fandom_page`, `fandom_infobox`, `fandom_sections`, `fandom_category`, `fandom_random`, `fandom_sovereign_ontology`, `fandom_canon_audit`.

---

## 🔮 Future Paths: A8 → A9 → A10
- **A8 Congruence & A8C Complex Adapters:** Narrative/emotional congruence and complex-valued embeddings for divine forms/god ki.
- **A9 Quantum-Inspired Runtime:** Quantum-holonomy modeling for timeline superposition and multiversal branching.
- **A10 Conceptual Quantum Operator Runtime:** High-altitude conceptual physics and non-local saga coherence.

## 🤝 Collaboration
Contributions welcome in zero-dependency ESM/Rust tooling, graph theory, ontology design, and A8–A10 research. See `docs/tiles/8BResonanceExplainer_Tile.md` and `docs/ENGINEERING_UPGRADE_ROADMAP.md`.
