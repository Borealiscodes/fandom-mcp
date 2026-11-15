# Remediation Plan for Borealiscodes/fandom-mcp

## Goal

Restore the repository to a production-safe, reliable Fandom MCP implementation by fixing the broken live API path, restoring canonical data integrity, removing scope drift, and adding regression coverage for the risky areas identified in the gap audit.

## Priority Order

1. Fix broken live Fandom request generation
2. Restore canonical DB and alias behavior
3. Remove or isolate speculative ontology/lore logic from the core Fandom server
4. Add automated regression tests
5. Re-run live validation and tighten HTTP safety checks

---

## Phase 1 — Stabilize the live server

### 1. Repair `apiUrl()` in `fandom-mcp.mjs`

Problem:
- The current URL builder generates an invalid URL structure and prevents MediaWiki API calls from completing.

Fix:
- Replace the malformed template with the correct Fandom MediaWiki endpoint format:

```js
return `https://${slug}.fandom.com/api.php?${usp.toString()}`
```

Acceptance criteria:
- all generated URLs include `https://<slug>.fandom.com/api.php?`
- query parameters are preserved and encoded correctly
- a request to a known Fandom endpoint succeeds end-to-end

### 2. Validate `fetchJson()` and endpoint integration

Tasks:
- verify `apiUrl()` is used consistently across all Fandom requests
- confirm `fetchJson` passes through correct headers and safe validation
- test request/response behavior against a known Fandom subdomain

Acceptance criteria:
- `fandom_search`, `fandom_page`, `fandom_infobox`, `fandom_sections`, and category access all work with valid endpoints
- invalid titles are rejected cleanly
- upstream API errors are surfaced as structured `HttpClientError`s

### 3. Restore the original canonical tables and logic

Problem:
- `CANON_SCOUTER_BENCHMARKS` and `CANON_DB_SAGAS` have been truncated or reduced.

Tasks:
- restore the full DBZ canonical power benchmark array
- restore the full saga series list
- keep canonical data as explicit, reviewed source-of-truth data

Acceptance criteria:
- all major DB saga series are represented
- benchmark entries for key characters and forms are restored
- the `fandom_dbz_scouter` and `fandom_dbz_saga` tools return complete canonical metadata

---

## Phase 2 — Restore alias and resolution behavior

### 4. Restore `parseFandomInput()` alias resolution

Problem:
- the parser currently lacks the alias-resolution behavior that maps common names and alternate names to canonical titles and wikis.

Tasks:
- reintroduce alias mapping for canonical names and common variants
- ensure cases like Odin / Ragnar / Brett Shaw / Von Anstetten variants route correctly
- preserve default wiki fallback behavior

Acceptance criteria:
- alias inputs resolve to the expected title and wiki
- `parseFandomInput` no longer falls back to incorrect or generic pages
- known alternate names produce deterministic canonical results

### 5. Verify title normalization and wiki slug behavior

Tasks:
- test `sanitizeWikiSlug()` edge cases
- verify URL parsing for Fandom wiki URLs
- validate special-character handling for names, underscores, and URL-encoded page titles

Acceptance criteria:
- slug sanitization remains stable and safe
- canonical page titles preserve user intent without malformed output

---

## Phase 3 — Remove scope drift from the Fandom core

### 6. Separate speculative ontology/lore content from the wiki server

Problem:
- the core server contains large blocks of lore, frequency, and ontology material unrelated to the Fandom wiki fetcher.

Actions:
- remove the embedded `SOVEREIGN_ONTOLOGY_PROFILES` block from the live Fandom server module
- remove or isolate `HEIMLEID_NORDIC_SOUNDSCAPE`, `COSMIC_FLOW_SOUNDSCAPE`, and related frequency logic
- keep any speculative lore in a separate module or feature package if it is still needed

Acceptance criteria:
- the file focuses on Fandom fetching and tool dispatch
- ontology/lore is not mixed into the core request and parsing logic
- the project boundaries are coherent and maintainable

### 7. Reconcile tool descriptions with actual behavior

Tasks:
- ensure tool descriptions match the real logic and data returned
- remove any references to embedded ontology or non-Fandom speculative entities from the canonical server interface
- keep the tool surface small, clear, and aligned with the project purpose

Acceptance criteria:
- tool names, descriptions, and schemas are truthful
- users do not receive mixed semantics from a single server

---

## Phase 4 — Add automated regression tests

### 8. Add Node-based tests for the critical request path

Create a test suite covering:
- `apiUrl()` output correctness
- `sanitizeTitle()` validation
- `parseFandomInput()` alias resolution
- URL allowlist checks in `http-json.mjs`
- redirect deny rules
- invalid-host rejection
- malformed title rejection
- canonical table stability snapshots

Suggested test files:
- `test/api-url.test.mjs`
- `test/parse-input.test.mjs`
- `test/http-json.test.mjs`
- `test/canon-data.test.mjs`

Acceptance criteria:
- all tests pass locally
- regressions are caught before merge
- canonical tables cannot silently shrink without failing tests

### 9. Add release gating

Tasks:
- run the test suite in CI
- fail PRs when canonical tables are edited without review
- include a smoke test for HTTP fetch flow against a live Fandom URL

Acceptance criteria:
- every PR validates core server behavior
- risky logic cannot regress unnoticed

---

## Phase 5 — Harden HTTP safety and host validation

### 10. Review and tighten `http-json.mjs`

Problem:
- the HTTP allowlist is improved but still not a fully hardened network boundary.

Tasks:
- review redirect handling for all approved URL patterns
- ensure host allowlist and redirect validation are consistent
- consider whether resolved IP enforcement is necessary for the environment in which this code runs
- add tests for malicious hosts and redirect-based host swaps

Acceptance criteria:
- malicious or disallowed hosts are rejected
- redirect chains remain bounded and verified
- the risk model is explicit and test-backed

### 11. Confirm response size and schema constraints

Tasks:
- review `MAX_RESPONSE_BYTES`
- confirm validation logic still rejects invalid or oversized payloads
- verify response handling stops before memory or context blowups

Acceptance criteria:
- payloads above the configured limit are rejected
- malformed JSON or schema-invalid responses are denied cleanly

---

## Execution Timeline

### Week 1 — Stabilization
- fix `apiUrl()`
- restore canonical tables
- restore alias resolution
- validate live fetch behavior

### Week 2 — Cleanup
- remove or isolate ontology/lore drift
- align tool descriptions and schemas
- start regression tests

### Week 3 — Security and hardening
- complete `http-json.mjs` review
- add redirect and host validation tests
- run full verification suite

---

## Definition of Done

The remediation passes when all of the following are true:

- live Fandom API requests succeed for standard wiki operations
- canonical DBZ scouter and saga data are restored and stable
- alias resolution works for expected alternate names
- the server does not mix speculative ontology material into the Fandom scraper core
- tool argument validation and output clamping remain in place
- regression tests cover the high-risk areas
- CI blocks future regressions in the live request flow

---

## Immediate Next Step

Start with the highest-risk fixes in this order:

1. `apiUrl()` repair
2. canonical table restoration
3. alias resolution restore
4. speculative content isolation
5. regression tests

This sequence yields the fastest reduction in risk and the clearest path to a reliable project state.

---

## Summary

This repository is salvageable, but it is not currently release-ready. The most important known issues are not aesthetic—they directly affect functionality, correctness, and trustworthiness. A disciplined remediation pass focused on the live URL pipeline, canonical data, alias resolution, and scope cleanup will restore the project to a stable and maintainable state.

