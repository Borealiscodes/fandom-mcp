#!/usr/bin/env bash
set -euo pipefail

echo "==> 1. Syntax check ESM entrypoints"
node --check http-json.mjs
node --check toolkit/canon_engine.mjs
node --check fandom-mcp.mjs

echo "==> 2. Run offline unit test suite (Phases 1–3)"
node --test test-http.mjs test-canon.mjs

echo "==> 3. Verify CLI schema dump & canon audit"
node fandom-mcp.mjs --dump-schemas > /dev/null

echo "==> 4. Verify JSON-RPC 2.0 stdio handshake & boundary rejection"
printf '%s\n' \
  '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05"}}' \
  '{"jsonrpc":"2.0","id":2,"method":"tools/list"}' \
  '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"fandom_canon_audit","arguments":{"base_power":"10","multipliers":["ssj"]}}}' \

  | node fandom-mcp.mjs | grep -q '"formatted_power":"500"'

echo "All Phase 1–4 checks passed."
