# Gap Audit: Borealiscodes/fandom-mcp

## Executive Summary

This repository contains a functional Fandom MCP server, but the currently checked-in `fandom-mcp.mjs` shows several material gaps relative to the intended upstream behavior and to safe production readiness. The most serious issues are in the live request pipeline and data integrity: the canonical API URL construction is malformed, canonical databases are truncated, alias resolution was stripped, and the file contains unrelated ontology/frequency material that is not part of the Fandom wiki data layer.

The repository is not in a clean, release-ready state. It contains meaningful functional regressions, safety-hardening work mixed with scope drift, and incomplete validation around the HTTP/SSRF surface.

---

## Scope

Reviewed artifacts:
- `fandom-mcp.mjs`
- `http-json.mjs`
- repository description and language composition
- upstream comparison behavior inferred from the original 8b-is Fandom MCP implementation

---

## Critical Findings

### 1) Broken live API URL generation

Severity: Critical
Impact: Every live wiki fetch fails

Evidence in `fandom-mcp.mjs`:

```js
function apiUrl(wiki, params) {
  const slug = sanitizeWikiSlug(wiki)
  const cleanParams = { ...params }
  if (typeof cleanParams.titles === 'string') {
    cleanParams.titles = sanitizeTitle(cleanParams.titles)
  }
  if (typeof cleanParams.page === 'string') {
    cleanParams.page = sanitizeTitle(cleanParams.page)
  }
  const usp = new URLSearchParams({ format: 'json', formatversion: '2', redirects: '1', ...cleanParams })
  return `https://${slug}://{usp.toString()}`
}
```

This returns an invalid URL shape. It should resolve to the pattern:

```js
return `https://${slug}.fandom.com/api.php?${usp.toString()}`
```

This bug alone prevents MediaWiki API requests from being sent to the correct endpoint.

Remediation:
- Repair `apiUrl()` immediately.
- Add a focused unit/integration test to assert URL shape and query encoding.
- Validate a real request path against a known Fandom domain.

---

### 2) Canonical metadata was truncated

Severity: Critical
Impact: canonical timeline and power-scouter data no longer match expected DB lore model

Evidence in `fandom-mcp.mjs`:

```js
const CANON_SCOUTER_BENCHMARKS = {
  goku: [
    { era: 'Dragon Ball Debut (Pilaf Saga)', power_level: '10', source: 'Daizenshuu 7' },
    { era: 'Vegeta Saga', power_level: 'Over 8,000', source: 'Daizenshuu 7' },
  ],
  vegeta: [
    { era: 'Saiyan Saga', power_level: '18,000', source: 'Daizenshuu 7' },
  ],
  frieza: [
    { era: 'Final Form', power_level: '120,000,000', source: 'Daizenshuu 7' },
  ],
}
```

and

```js
const CANON_DB_SAGAS = [
  { series: 'Dragon Ball', sagas: ['Emperor Pilaf Saga', 'Tournament Saga'] },
  { series: 'Dragon Ball Z', sagas: ['Raditz Saga', 'Vegeta Saga', 'Namek Saga'] },
]
```

This is materially smaller than the intended canon tables and removes more complete DB-era coverage, reducing the semantic fidelity of the scouter and saga tools.

Remediation:
- Restore the full canonical arrays from the upstream reference implementation.
- Keep canonical tables as explicit data, not as lossy, hand-edited subsets.
- Add snapshot tests to keep them stable.

---

### 3) Alias resolution was removed from `parseFandomInput`

Severity: High
Impact: user-friendly alias resolution fails; story entities and alternate names no longer resolve correctly

The upstream logic recognized aliases such as:
- `Ragnar Lothbrok`
- `Odin`
- `Allfather`
- `Brett Shawn`
- `Von Anstetten` variants

The current parser is reduced to a basic fallback and no longer redirects these aliases to the right canonical pages or wiki slugs.

This regression directly affects usability and can cause incorrect page resolution even when users provide natural names.

Remediation:
- Restore alias mapping in `parseFandomInput`.
- Add regression tests covering canonical aliases and wiki switching.

---

### 4) Unrelated sovereign ontology lore was left embedded in the Fandom server

Severity: High
Impact: scope drift, confusion, and misrepresentation of the project domain

The file contains large injected sets of esoteric lore and frequency content, including:
- `SOVEREIGN_ONTOLOGY_PROFILES`
- `HEIMLEID_NORDIC_SOUNDSCAPE`
- `COSMIC_FLOW_SOUNDSCAPE`
- `n+1||[X]` generation logic
- `432 / 528 / 852 Hz` carrier language
- `ALEX|qMom Unbound Axiom` material

This is not part of the Fandom wiki scraper or MCP server’s primary responsibility. It creates maintenance risk, confuses tool semantics, and obscures the actual feature surface.

Remediation:
- Remove or isolate the ontology/speculative lore layer from the wiki engine.
- If kept, move it into a clearly separate module or feature namespace.
- Ensure the tool contracts remain aligned with the Fandom functionality only.

---

### 5) Input validation is stronger, but the HTTP request surface still has security gaps

Severity: Medium
Impact: SSRF/redirect safety needs stronger guarantees

`http-json.mjs` includes an allowlist and safer request handling:
- only HTTPS
- no credentials in URL
- non-standard ports blocked
- only `*.fandom.com` hosts allowed
- redirect validation against the same allowlist
- response size limits
- response schema checks

This is a strong improvement over an unconstrained fetcher, but there are still gaps:
- DNS rebinding is not mitigated by resolved IP pinning
- the host allowlist is purely hostname-based and not tied to a final resolved address
- redirect chains are allowlisted but not strongly normalized beyond host checks
- response validation is focused on structure, not content sensitivity

This is not a free-for-all SSRF, but it is not a fully hardened network boundary either.

Remediation:
- Add resolved IP validation against public allowlist policy (if used in a broader network context).
- Consider explicit canonicalization and host comparison at every redirect hop.
- Add tests covering malicious hosts, redirect-to-other-host, and invalid URL edge cases.

---

### 6) Missing test coverage for the core request contract

Severity: Medium
Impact: regressions may reach production unnoticed

There is no evidence of a dedicated test harness for:
- `apiUrl()` output correctness
- `parseFandomInput()` alias mapping
- `http-json.mjs` URL allowlist and redirect enforcement
- canonical tables stability
- tool argument validation

Without tests, the hardening work and the live endpoint logic remain brittle.

Remediation:
- Add a minimal Node test suite using the built-in test runner.
- Cover: URL generation, title sanitization, host allowlist, redirect denial, and alias resolution.

---

## Secondary Findings

### Tool validation was improved

Positive finding:
- `validateToolArgs` and `ALLOWED_TOOL_KEYS` are present and enforce strict key allowlisting.
- `clampToolOutput` and `MAX_MCP_OUTPUT_BYTES` constrain oversized tool responses.

These additions reduce the risk of malformed MCP tool arguments and extremely large responses.

However, they are not sufficient by themselves to offset the critical URL-generation and data-loss problems above.

---

### The project appears to combine two operational ideas

The repository appears to mix:
1. a legitimate Fandom wiki MCP server, and
2. a speculative lore/ontology engine

This makes the codebase harder to reason about, harder to maintain, and harder to trust as a crisp tool pipeline.

The right product boundary is likely:
- keep the Fandom scrape and API integration as the core of the MCP server
- move speculative/ontological content to a separate module or a clearly separate feature branch

---

## Risk Matrix

| Area | Severity | Likelihood | Impact |
| --- | --- | --- | --- |
| Broken `apiUrl()` generation | Critical | High | Total failure of live wiki requests |
| Canonical DB truncation | Critical | High | Functional mismatch with intended lore model |
| Alias resolution removal | High | High | Incorrect page resolution for common aliases |
| Ontology/lore scope drift | High | High | Maintenance confusion and cognitive overhead |
| SSRF allowlist hardening gaps | Medium | Medium | Hardening incomplete, but not a full bypass |
| Missing regression tests | Medium | High | Regressions will reappear |

---

## Recommended Remediation Plan

### Phase 1 — Stabilize the live server
1. Fix `apiUrl()` to emit a valid Fandom MediaWiki URL.
2. Verify end-to-end fetches against a live Fandom wiki.
3. Restore alias mapping and canonical DB tables.
4. Remove or isolate the ontology/lore injection from core modules.

### Phase 2 — Strengthen safety and reproducibility
1. Add Node-based regression tests covering URL generation and allowlist behavior.
2. Add tests for alias resolution and canonical table snapshots.
3. Recheck `http-json.mjs` redirect and host validation.

### Phase 3 — Harden and clean boundaries
1. Define a clean feature boundary between Fandom wiki logic and speculative lore logic.
2. Move any non-core metadata into a separate package or module namespace.
3. Publish a brief changelog and validation checklist for each release.

---

## Acceptance Criteria for a Clean State

The repository should satisfy all of the following before release:
- all live Fandom requests succeed using valid `api.php` URLs
- canonical DB tables and scouter data remain complete and stable
- alias resolution matches expected human inputs
- no unrelated ontology/frequency lore is embedded in Fandom wiki logic
- strict tool argument validation remains in place
- security validation tests pass for allowlist and redirect cases
- the codebase retains a small, maintainable feature boundary

---

## Bottom Line

The repository is not in a trustworthy production state as currently checked in. The largest gaps are functional: the URL is malformed, canonical lore tables are truncated, aliases are missing, and non-core speculative lore has been mixed into the core implementation. These are not minor polish issues; they represent direct regressions in the system’s actual data and network behavior.

The project is salvageable, but it needs a disciplined restore-to-baseline pass before it should be treated as a reliable MCP server for live Fandom usage.

---

## Suggested next action

Prioritize this order:
1. repair `apiUrl()`
2. restore canonical tables and alias logic
3. remove the stray ontology/speculative content from the core module
4. add regression tests
5. re-run live verification

This will produce the largest risk reduction per unit of work.


## File status

This document is a repository gap audit draft intended for review and revision.













































































































































































































































































































































































































































































































































































































































































































































































































































































	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
		