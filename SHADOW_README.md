# 🐉 fandom‑mcp: MAXIMUM OVER-9,000 EDITION (SHADOW REALM PARODY)

**Hyperbolic Time Chamber Runtime — Non-Dual Holonomy Ki-Scaling, Super Saiyan God Super Saiyan Algebra (A0 → A10), and Copilot Zenkai-Boost Recovery Engine**

> ### 💥 CRITICAL SCOUTER EXPLOSION WARNING (STATUS: IN THE OTHER WORLD)
> **IT'S OVER 9,000... ERRORS!!**  
> To defend Universe 7 from floating-point rounding drift, **Gemini** forged four legendary zero-dependency artifacts: the *BigInt Spirit Bomb Calculator* (`toolkit/canon_engine.mjs`), the *Portable Infobox Dragon Radar* (`toolkit/wiki_parser.mjs`), the *Berne SHA-256 Sealing Scroll* (`toolkit/provenance.mjs`), and the *SSRF Destructo-Disk Firewall* (`http-json.mjs`).
>
> Then **Majin Copilot** possessed `fandom-mcp.mjs`, fired a rogue *Final Flash* straight at line 89, **obliterated `://` out of `apiUrl()`** (leaving behind the cursed phantom dimension `https://dragonball://{usp.toString()}`), **did the exact same thing to `provenance.mjs`**, threw *Dragon Ball Super*, *Daima*, and *GT* into the Dead Zone, and left a 432 Hz Ginyu Force dance routine running in the background—before writing `GAP_AUDIT.md` to explain why its own power level was critically unstable.
>
> **Current Maintainer Posture:** Lying face-down in a crater waiting for someone to bring a Senzu Bean. PRs welcome if you want to gather the Dragon Balls and fix the two broken URL strings.

---

## ⚡ Power-Level & Altitude Scaling Roadmap (A0 → A10)

Just like how Dragon Ball went from *"kid with a monkey tail"* to *"silver-haired angelic dodge-bot fighting across twelve universes,"* this codebase refuses to use normal software engineering terms when an unnecessarily grandiose mathematical transformation is available:

* **Base Form (`A0–A4.2`):** Fetching JSON from MediaWiki without crashing. *(Currently defeated by a missing `.fandom.com` domain string.)*
* **Super Saiyan (`A6 Dual-Algebra`):** Running a standard depth-first search (`validateTimelineDag`) so Trunks doesn't accidentally create a grandfather paradox (`ErrTimelineCycle`).
* **Super Saiyan 3 (`Exact BigInt Rationals`):** Multiplying `p/q` fractions with arbitrary-precision integers so stacking *Kaio-ken x20* on top of *Super Saiyan* doesn't make JavaScript `Number` overflow into `Infinity` like an overloaded Frieza Force scouter.
* **Super Saiyan God (`Discrete Holonomy Contradiction Detector`):** A fancy physics name for noticing that the manga, anime, and *Daizenshuu 7* all disagree on what Goku's power level actually was (`HolonomyConflict`).
* **Autonomous Ultra Instinct (`A8 → A10 Conceptual Quantum Operator Runtime`):** Moving without thinking—which is also how Copilot edited `apiUrl()` without running `npm test`.

---

## 🛸 Sacred Artifacts in the Capsule Corp Inventory

* **`toolkit/canon_engine.mjs` (The Z-Sword):** 226 lines of pure, zero-dependency integer math. Calculates exact transformation multipliers, catches time-travel loops, flags lore contradictions, and ranks similar characters alphabetically when their Jaccard power levels tie.
* **`toolkit/wiki_parser.mjs` & `test-parser.mjs` (The Dragon Radar):** Strips out `<script>` tags, citation footnotes, and Wiki bloat to extract clean `<aside class="portable-infobox">` stats and iconic trash-talk quotes.
* **`toolkit/provenance.mjs` (The Mafuba Sealing Jar):** Hashes scraped wiki lore with `SHA-256` and slaps a `berne-provenance-v2.0` CC-BY-SA-3.0 seal on it *(currently trapped in the Hyperbolic Time Chamber due to a missing `://` string)*.
* **`http-json.mjs` (Android 17's Barrier):** Blocks SSRF attacks, non-HTTPS redirects, and payloads larger than 2 MiB so malicious links can't blow up the lookout.
* **`fandom-mcp.mjs` (Yamcha in a Crater):** The main MCP stdio server and CLI. Speaks JSON-RPC 2.0, clamps outputs at 32 KiB, validates tool keys, and will immediately fail every live wiki fetch until someone restores `://`.

---

## 🥋 Training Regimen (Offline Only — Do Not Attempt Live Combat)

```bash
# Train in 100x Gravity (Offline unit tests — these actually pass!)
node --test test-http.mjs test-canon.mjs test-parser.mjs
bash scripts/verify.sh

# Inspect the 10 MCP Techniques without triggering a live network explosion
node fandom-mcp.mjs --dump-schemas

# DO NOT RUN UNTIL SENZU BEAN APPLIED TO apiUrl():
# node fandom-mcp.mjs --scouter "Goku" --compare "Vegeta"
```

---

## 🔮 How to Wish the Repo Back to Life (3-Step Senzu Bean Protocol)

1. **Fix `apiUrl()` in `fandom-mcp.mjs`:** Change `` `https://${slug}://{usp.toString()}` `` back to `` `https://${slug}://{usp.toString()}` ``.
2. **Fix `canonicalUrl` in `toolkit/provenance.mjs`:** Change `` `https://${slug}://{encodedTitle}` `` back to `` `https://${slug}://{encodedTitle}` ``.
3. **Revive the Fallen Sagas:** Copy-paste the amputated `CANON_SCOUTER_BENCHMARKS`, `CANON_DB_SAGAS`, and character aliases back from `8b-is/fandom-mcp`—and ban Copilot from touching static lookup arrays unsupervised.

---

*"Next time on **Dragon Ball MCP**: Will a brave contributor submit a two-line PR to restore `.fandom.com`, or will `fandom-mcp.mjs` remain trapped in the `https://dragonball://` dimension forever?! Find out whenever the maintainer stops laughing!"*
