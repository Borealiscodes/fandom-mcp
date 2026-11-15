# 🔬 Scraper & Parser Architecture Options Audit

**Target Repository:** `Borealiscodes/fandom-mcp`  
**Scope:** MediaWiki / Fandom Extraction Layer (`stripWikitextMarkup` & `extractQuoteAndInfobox`)  
**Constraint:** Zero-Dependency Node.js ESM (`.mjs` / `node --test`)

---

## 1. Root-Cause Diagnosis of Upstream's Scraper

Upstream currently fetches raw wikitext via `action=query&prop=revisions&rvprop=content` and parses it locally using flat regular expressions and a manual character-depth loop. That approach introduces four recurring failure modes:

1. **Unexpanded Lua/Template Logic:** Modern Fandom wikis compute infobox stats via Lua modules (`{{#invoke:...}}`). Raw wikitext only exposes the unexecuted `#invoke` directive rather than the rendered character attributes.
2. **Hardcoded Infobox Allowlists:** `extractQuoteAndInfobox` only matches ~20 hardcoded template names (`Infobox`, `Character`, `Attack`, plus specific localized names). Any Fandom wiki using a custom template name silently returns `{}`.
3. **Case-Sensitive Field Lookups:** Downstream handlers check exact capitalized keys like `box.Race` or `box.JapName`. When wiki editors use lowercase or snake_case keys (`race`, `japanese_name`), lookups fall back to `'Unknown'`.
4. **Monolithic Coupling:** Static lore datasets (`SOVEREIGN_ONTOLOGY_PROFILES`), regex markup strippers, and the JSON-RPC stdio server all reside inside a single 1,000+ line file (`fandom-mcp.mjs`).

---

## 2. Comparison of Zero-Dependency Scraper & Parser Options

| Option | Upstream API / Mechanism | Zero-Dependency? | Pros | Cons |
| :--- | :--- | :--- | :--- | :--- |
| **Option A: MediaWiki Rendered HTML (`action=parse&prop=text`)** | Ask MediaWiki to expand all templates and Lua modules server-side, then extract `<aside class="portable-infobox">` tags. | **Yes** (tag scanner on standardized Fandom `<aside>` HTML) | Expands all Lua templates automatically; works universally across Fandom wikis regardless of template name. | Larger upstream HTML payloads (bounded by the `2 MiB` response ceiling). |
| **Option B: Fandom Nirvana / Portable Infobox API** | Query Fandom's `api/v1/Articles/Details` or `PortableInfobox` endpoints alongside MediaWiki `action=query`. | **Yes** (`fetchJson` with allowlist) | Returns pre-structured JSON key-value pairs for Portable Infoboxes with zero wikitext parsing. | Unofficial Fandom REST endpoints can change schema without notice. |
| **Option C: Hardened Wikitext Tokenizer (In-Place Upgrade)** | Keep `rvprop=content`, but replace the flat regex loop with a stack-based tokenizer (`{{`, `[[`, `<nowiki>`, `<!--`) and case-insensitive key maps. | **Yes** (pure JS state machine) | Lowest network payload size; preserves exact offline behavior for existing unit tests. | Still cannot evaluate server-side `#invoke:` Lua templates. |
| **Option D: Hybrid (`action=parse` HTML for Infobox + `extracts` for Prose)** | Use `prop=extracts&explaintext=1` for clean lead summaries and `prop=text` only for `<aside class="portable-infobox">`. | **Yes** | MediaWiki strips all markup for prose natively; `<aside>` yields clean structured infobox fields. | Requires querying both `extracts` and `parse` properties. |

---

## 3. Recommended Upgrade Path (Phase 5)

Adopting **Option D (Hybrid MediaWiki Native Extracts + Portable Infobox `<aside>` Parser)** alongside **data modularization** delivers reliable cross-wiki extraction with zero external dependencies:

1. **Use MediaWiki's Native Plain-Text Extractor for Prose:**
   - Query `prop=extracts&exintro=1&explaintext=1` in `fandomPage` and `fandomInfobox`. MediaWiki's server-side parser strips all templates, `<ref>` citations, and Lua invocations cleanly before returning JSON.
2. **Parse `<aside class="portable-infobox">` Instead of Guessing Template Names:**
   - Fandom renders infoboxes inside standardized `<aside class="portable-infobox">` containers with `<h3 class="pi-data-label">` and `<div class="pi-data-value">` tags. Extracting label/value pairs from `<aside>` works universally across *Dragon Ball*, *One Piece*, *Naruto*, *Star Wars*, and custom wikis without hardcoded template allowlists.
3. **Normalize Infobox Keys to Lowercase `snake_case`:**
   - Store all extracted infobox fields in a normalized lowercase dictionary (e.g., `box.race`, `box.allegiance`, `box.japname`) so field lookups remain resilient across wikis.
4. **Extract Static Lore Data into `data/ontology_profiles.mjs`:**
   - Move `SOVEREIGN_ONTOLOGY_PROFILES` and `CANON_SCOUTER_BENCHMARKS` out of `fandom-mcp.mjs` into `data/ontology_profiles.mjs`. This keeps `fandom-mcp.mjs` focused on MCP protocol handling and lets you cherry-pick upstream lore profiles cleanly without touching parser or transport code.
