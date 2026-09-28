#!/bin/bash
# SessionStart hook: installs the npm dependencies in Claude Code cloud
# sessions, so builds, tests, lint and the Angular MCP server
# (`node node_modules/@angular/cli/bin/ng.js mcp`, see .mcp.json) work.
# It also builds the graphify code graph when graphify is installed. Local
# sessions are left alone.
#
# Runs `npm ci` only when node_modules is missing or package-lock.json changed
# since the last install, so a resumed session starts without delay.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}"

# The Angular CLI 22.1 accepts Node ^22.22.3, ^24.15.0 or >=26.
if ! node -e '
  const [maj, min, pat] = process.versions.node.split(".").map(Number);
  const ok = (maj === 22 && (min > 22 || (min === 22 && pat >= 3))) || (maj === 24 && min >= 15) || maj >= 26;
  process.exit(ok ? 0 : 1);
'; then
  echo "Node $(node --version) is too old for the Angular CLI and its MCP server. Add tools/cloud-setup.sh as the setup script of the cloud environment to get Node 24."
fi

# Code graph for `graphify query/explain/path` (see .claude/agents). Takes about
# 8 seconds, runs in the background so the session does not wait for it, and
# .claude/hooks/after-edit.mjs keeps it current afterwards.
if command -v graphify >/dev/null 2>&1; then
  (graphify update . --no-cluster >/dev/null 2>&1 &)
fi

marker=node_modules/.package-lock.sha256
wanted=$(sha256sum package-lock.json | cut -d' ' -f1)
if [ -d node_modules ] && [ "$(cat "$marker" 2>/dev/null)" = "$wanted" ]; then
  exit 0
fi

npm ci --no-audit --no-fund --loglevel=error >&2
echo "$wanted" > "$marker"
echo "npm ci done with Node $(node --version)."
