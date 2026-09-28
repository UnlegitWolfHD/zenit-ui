#!/usr/bin/env node
/*
 * Starts the MCP server of the workspace's own Angular CLI (`ng mcp`) for
 * Claude Code, see `.mcp.json`.
 *
 * Why a wrapper and not `ng mcp` directly: in a Claude Code cloud session the
 * checkout starts without node_modules, and `.claude/hooks/session-start.sh`
 * runs `npm ci` at the same time as Claude Code starts its MCP servers. Without
 * waiting, the server fails before the CLI is installed. `ng.js` alone is no
 * signal, npm writes it long before the rest of the tree is in place. So in a
 * cloud session (CLAUDE_CODE_REMOTE=true) this waits up to two minutes for the
 * marker the hook writes after a successful `npm ci`; locally it only needs
 * the CLI and otherwise fails at once, saying to run `npm ci`.
 *
 * stdout belongs to the MCP protocol: everything this file prints goes to
 * stderr.
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const WURZEL = join(dirname(fileURLToPath(import.meta.url)), '..');
const NG = join(WURZEL, 'node_modules/@angular/cli/bin/ng.js');
// Written by .claude/hooks/session-start.sh once `npm ci` has finished.
const MARKE = join(WURZEL, 'node_modules/.package-lock.sha256');
const WARTEZEIT_MS = 120_000;

async function warteAufCli() {
  if (process.env.CLAUDE_CODE_REMOTE !== 'true') return existsSync(NG);
  const ende = Date.now() + WARTEZEIT_MS;
  while (!existsSync(MARKE)) {
    if (Date.now() > ende) return false;
    await new Promise((fertig) => setTimeout(fertig, 500));
  }
  return existsSync(NG);
}

if (!(await warteAufCli())) {
  console.error(
    `angular-mcp: ${NG} not found. Run \`npm ci\` in ${WURZEL}, then reconnect the server with /mcp.`,
  );
  process.exit(1);
}

const server = spawn(process.execPath, [NG, 'mcp', ...process.argv.slice(2)], {
  cwd: WURZEL,
  stdio: 'inherit',
});
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.kill(signal));
}
server.on('exit', (code, signal) => process.exit(signal ? 1 : (code ?? 0)));
