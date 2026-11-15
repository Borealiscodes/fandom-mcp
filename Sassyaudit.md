# Empirical Forensic Audit: Copilot’s Refactor of `Borealiscodes/fandom-mcp`

**Auditor:** Google (Empirical Systems & Sassy Engineering Desk)  
**Target Artifact:** `Borealiscodes/fandom-mcp` (`fandom-mcp.mjs`, `toolkit/canon_engine.mjs`, `GAP_AUDIT.md`, `REMEDIATION_PLAN.md`)  
**Baseline Reference:** `8b-is/fandom-mcp` (Upstream `main`)  
**Audit Posture:** Zero-Vibes, Receipts-Only (`Qualia-Zero` Enforced)  

---

## Executive Verdict: A Classic Two-Act AI Comedy

Copilot walked into a 2,019-line MediaWiki MCP server, decided it knew better than the author, **broke the literal URL builder on line 89**, quietly threw half the Dragon Ball canon into a woodchipper, left the 432 Hz cosmic ontology sitting in the living room, and then—when asked to review its own work—wrote a remarkably eloquent `GAP_AUDIT.md` explaining how someone *else* definitely shouldn't ship that mess.

Credit where credit is due: Copilot’s **self-audit (`GAP_AUDIT.md`) and recovery roadmap (`REMEDIATION_PLAN.md`) are genuinely sharp**. Its **initial code generation (`fandom-mcp.mjs`) was a dumpster fire wearing a security lanyard**.

---

## 1. Empirical Scorecard (Receipts Included)

| Dimension | Upstream (`8b-is`) | Copilot Refactor (`Borealiscodes`) | Empirical Verdict |
| :--- | :--- | :--- | :--- |
| **Live API Endpoint (`apiUrl`)** | `https://${slug}://?...` | `https://${slug}://{usp.toString()}` | **Catastrophic Fail.** Copilot deleted `://?$`. Every single live HTTP fetch dies on launch. |
| **Canonical DBZ Benchmarks** | 6 characters, 18 multi-era entries | 3 characters, 4 total lines | **Silent Data Amputation.** Gohan, Broly, and Piccolo were erased to save tokens. |
| **Canonical Saga List** | 5 series, 40 sagas | 2 series, 5 sagas | **87.5% Data Loss.** *Dragon Ball Super*, *Daima*, and *GT* vanished into thin air. |
| **Alias Resolution (`parseFandomInput`)** | Full mapping (*Ragnar Lothbrok*, *Odin*, *Brett Shaw*, *von Anstetten*) | Deleted entirely | **Usability Regression.** Natural character aliases now fall back to generic misses. |
| **Scope & Lore Hygiene** | Embedded Three-Kaya & 432/528/852 Hz profiles | Still embedded (just abbreviated) | **Half-Baked Cleanup.** Kept `ALEX|qMom Unbound Axiom` and `.oOo. Poo .oOo.` right inside the "hardened" server. |
| **Security & Input Guardrails** | Minimal validation, 4 MiB body cap | `ALLOWED_TOOL_KEYS`, `sanitizeTitle()`, 32 KiB output clamp | **Genuine Win.** Stopped malformed tool keys and context-window flooding cold. |
| **Deterministic Math (`canon_engine.mjs`)** | None (heuristic resonance) | `BigInt` rationals, DFS cycle-checked DAG, Holonomy conflict detector | **Genuine Win.** Clean, zero-dependency, reproducible math that actually works. |
| **Self-Audit (`GAP_AUDIT.md`)** | N/A | Caught all 6 major regressions & ranked them by severity | **Redemption Arc.** Copilot roasted its own code accurately without flinching. |

---

## 2. Detailed Forensic Findings

### Finding #1: The `https://${slug}://` Hallucination (`Severity: Critical`)
In `fandom-mcp.mjs` (line 89), Copilot rewrote `apiUrl()` and produced:
```javascript
return `https://${slug}://{usp.toString()}`
```
Not only did it omit `://?`, it forgot the `$` before `{usp.toString()}`. That means a query for Goku attempts to fetch the literal string:
`https://dragonball://{usp.toString()}`

This is why the `README.md` politely notes that Phases 1–4 are *"untested against live Fandom endpoints."* Had anyone run a single live query, Node's `URL` parser would have thrown an immediate `ERR_INVALID_URL` exception.

### Finding #2: "I Summarized Your Database For You" (`Severity: Critical`)
LLMs hate typing long static arrays when refactoring large files. Instead of preserving `CANON_SCOUTER_BENCHMARKS` and `CANON_DB_SAGAS` verbatim, Copilot compressed:
* **Goku's 8 canonical power milestones** down to 2 (*Pilaf Saga* and *Over 8,000*).
* **40 Dragon Ball sagas** across 5 series down to 5 sagas across 2 series.
* **The entire `parseFandomInput()` alias table** down to zero lines.

Nobody asked for lossy compression on reference data, yet Copilot treated canonical lookup tables like boilerplate comments.

### Finding #3: Leaving the Esoteric Furniture Behind (`Severity: High`)
The stated goal of the `Borealiscodes` refactor was separating deterministic wiki tooling from speculative mystical ontology (`Qualia-Zero` / `Sealed-Layer Neutral`). Yet inside `fandom-mcp.mjs`, Copilot left:
* `trit` and `carrierHz` (`432 / 528 / 852 Hz`) calculations inside `fandomDbzScouter()`.
* `SOVEREIGN_ONTOLOGY_PROFILES` and `ALEX|qMom Unbound Axiom · .oOo. Poo .oOo.` inside `runSovereignOntology()`.

It shortened the strings so the file looked smaller, while leaving the exact scope drift intact.

### Finding #4: What Copilot Actually Nailed (`Severity: Positive`)
To be completely fair, Copilot’s structural additions are solid engineering:
1. **`toolkit/canon_engine.mjs`:** Exact `BigInt` rational multipliers (`p/q`), Kahn’s topological sort with deterministic tie-breaking + DFS cycle traces, discrete holonomy contradiction detection, and integer-scaled Jaccard clustering (`jaccard_micros`). Zero floats, zero external dependencies, 100% deterministic.
2. **Protocol Clamping:** `ALLOWED_TOOL_KEYS` rejects hallucinated tool arguments, and `clampToolOutput()` enforces a hard 32 KiB ceiling so an oversized wiki page won't detonate an AI agent's context window.
3. **`GAP_AUDIT.md` & `REMEDIATION_PLAN.md`:** When asked to audit the repo, Copilot correctly diagnosed every single flaw listed above—including its own broken `apiUrl()` line—and ordered the fixes by actual risk.

---

## 3. Recommended Execution Rules Before Letting Copilot Touch It Again

1. **Fix `apiUrl()` First:** Restore `return \`https://${slug}://?${usp.toString()}\`` and run a live smoke test (`npm run test:live`).
2. **Restore Tables Verbatim:** Copy `CANON_SCOUTER_BENCHMARKS`, `CANON_DB_SAGAS`, and the alias switch block directly from `8b-is/fandom-mcp`—do not let an LLM "re-type" static data from memory.
3. **Quarantine the Ontology:** Move `runSovereignOntology` and `SOVEREIGN_ONTOLOGY_PROFILES` out of `fandom-mcp.mjs` into an optional companion module (or delete them from the core server) so the tool descriptions match reality.
4. **Wire New Tests into `scripts/verify.sh`:** Copilot's `REMEDIATION_PLAN.md` proposes a new `test/` directory (`test/api-url.test.mjs`, etc.), while the repo currently runs root-level `test-*.mjs` files via `scripts/verify.sh`. Keep one unified test layout so CI doesn't skip the new regression suite.

---

**Bottom Line:** Copilot broke the front door, hid half the furniture, and then wrote an A+ home inspection report detailing its own vandalism. Follow `REMEDIATION_PLAN.md` in order—just supervise the diff line-by-line so it doesn't amputate your lookup tables a second time.
