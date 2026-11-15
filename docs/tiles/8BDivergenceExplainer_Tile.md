# 🧪 Science Tile: Why Our Fork Took a Different Path!

**Topic:** Upstream (`8b-is/fandom-mcp`) vs. Hardened Fork (`Borealiscodes/fandom-mcp`)  
**Audience:** Contributors, curious readers, and Dragon Ball lore engineers  
**Status:** Phases 1–4 Verified Offline (`node --test`); Live Fandom Integration Pending

---

## 🔬 The Big Idea: Lore Library vs. Bulletproof Laboratory

Imagine two teams building a machine to explore the Dragon Ball Universe!

- **Team Upstream (`8b-is/fandom-mcp`)** is building a giant, cosmic library! They are adding new shelves every day—Dragon Ball, One Piece, Vikings, Mysterious Universe, and poetic resonance profiles. It is creative, sprawling, and full of lore.
- **Our Fork (`Borealiscodes/fandom-mcp`)** is building a **bulletproof physics laboratory** around that library! Before we let an AI agent pull books off the shelf or calculate Super Saiyan multipliers, we want to be 100% sure the floor won't collapse, the calculator won't overflow, and nobody can trick our server into wandering off into dangerous parts of the internet.

**Both speak the exact same language (all 9 original MCP tools and CLI flags still work!),** but our lab added four major safety and math upgrades under the hood.

---

## 🛡️ Experiment #1: The Bouncer at the Front Door (SSRF & Redirect Guards)

### What Happens in Upstream?
Upstream's HTTP fetcher checks that a web address starts with `https://`, and then trusts *any* domain on the internet—even if a sneaky redirect tries to bounce the server to a private internal IP address (`127.0.0.1` or cloud metadata servers).

### How Our Fork Fixes It!
In **`http-json.mjs`**, we put a strict bouncer at the door:
1. **Strict Allowlist:** The host name *must* match `*.fandom.com`. No IP addresses, no `localhost`, no weird ports, and no secret passwords hidden in the URL.
2. **Every Hop Checked:** Even if Fandom sends a `302 Redirect`, our bouncer checks the *new* destination before following it. If it leaves `*.fandom.com`, the connection slams shut immediately (`ErrHostNotAllowed`).

---

## 🪣 Experiment #2: No Overflowing Buckets (2 MiB & 32 KiB Ceilings)

### What Happens in Upstream?
Upstream allows a single web response up to **4 MiB** and prints the entire JSON result straight back to your AI assistant with no size limit. One giant wiki page can flood an AI's context window or spike memory on small edge devices!

### How Our Fork Fixes It!
We installed **two automatic overflow valves**:
1. **The Upstream Valve (`2 MiB`):** While downloading bytes from Fandom, `http-json.mjs` counts every single byte as it arrives. The instant a stream crosses `2,097,152` bytes, it cuts the wire (`ErrPayloadTooLarge`) and checks that the text is valid UTF-8.
2. **The Context Window Valve (`32 KiB`):** Right before `fandom-mcp.mjs` hands an answer back to an AI agent over stdio, `clampToolOutput()` checks the byte size. If it exceeds **32 KiB**, it cleanly trims the excess and stamps a clear truncation notice at the bottom.

---

## 🧮 Experiment #3: Math That Never Breaks (`BigInt` & Time-Loop Detectors)

### What Happens in Upstream?
Dragon Ball power scaling gets wild—fast! If you stack a base power level with *Super Saiyan* ($\times 50$), *Kaioken x20* ($\times 20$), and *Super Saiyan 3* ($\times 400$) using standard JavaScript numbers, floating-point math eventually loses precision or hits `Infinity`. Plus, time travel (Future Trunks, Cell's timeline, Goku Black) can accidentally create infinite loops!

### How Our Fork Fixes It!
We built **`toolkit/canon_engine.mjs`** and wired it into a brand-new 10th tool called **`fandom_canon_audit`**:
- **Exact `BigInt` Fractions ($p / q$):** Every multiplier is stored as an exact integer fraction (`{ p: BigInt, q: BigInt }`). You can stack transformations to the edge of the observable universe without ever losing a single digit!
- **Cycle-Checked Timeline Graphs (DAGs):** Using Kahn's topological sort and depth-first back-edge tracing, the engine checks timeline arrows (`DB → DBZ → DBS`). If someone creates a grandfather paradox (`A → B → A`), it stops and prints the exact loop (`ErrTimelineCycle`).
- **Contradiction Radar (Discrete Holonomy):** When the manga, anime, and databooks disagree on a character's stats in the same era, our detector flags a structured `HolonomyConflict` instead of silently overwriting one source with another.

---

## 🧭 Summary Table: At a Glance

| Feature | Upstream (`8b-is`) | Our Fork (`Borealiscodes`) | Why It Matters |
| :--- | :--- | :--- | :--- |
| **Allowed Websites** | Any `https://` site | Only `*.fandom.com` (every hop) | Stops SSRF & redirect attacks |
| **Max Download / Timeout** | 4 MiB / 15 seconds | 2 MiB / 8s + 2 clean retries | Faster recovery, zero memory spikes |
| **Max AI Tool Output** | Unlimited | **32 KiB** hard cap | Keeps AI context windows clean |
| **Power-Level Math** | Static text notes | Exact `BigInt` fractions ($p/q$) | Zero `Infinity` or rounding bugs |
| **Timeline Checking** | None | Cycle-checked DAG + Holonomy | Catches time loops & canon clashes |

---

## 🔭 What's Next?
Right now, upstream is rapidly adding new universe profiles while going through some architectural growing pains. By keeping our core modules clean, zero-dependency, and verified with `node --test`, we can **let upstream explore freely** and safely cherry-pick any cool new character profiles later—without ever giving up our lab's safety shields!
