#!/usr/bin/env node
/*
 * PostToolUse hook for Edit, Write and MultiEdit (see .claude/settings.json).
 *
 * 1. Formats the edited file with the workspace's Prettier when `npm run
 *    format:check` covers it (projects/**\/*.{ts,css,html}, minus
 *    .prettierignore), so no agent spends a round on format errors.
 * 2. Refreshes the graphify code graph in the background when there is one,
 *    so `graphify query/explain/path` never answers from a stale graph. A lock
 *    file keeps a single update running; edits made meanwhile are picked up by
 *    the next one.
 *
 * Never fails the tool call: every problem is ignored and the hook exits 0.
 */
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, openSync, closeSync, statSync, unlinkSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const WURZEL = process.env.CLAUDE_PROJECT_DIR || process.cwd();

let eingabe = '';
for await (const teil of process.stdin) eingabe += teil;

let datei;
try {
  datei = JSON.parse(eingabe).tool_input?.file_path;
} catch {
  process.exit(0);
}
if (!datei) process.exit(0);

const pfad = relative(WURZEL, datei).split(sep).join('/');

const PRETTIER = join(WURZEL, 'node_modules/prettier/bin/prettier.cjs');
if (/^projects\/.+\.(ts|css|html)$/.test(pfad) && existsSync(PRETTIER)) {
  // Prettier skips files listed in .prettierignore even when they are named.
  spawnSync(process.execPath, [PRETTIER, '--write', '--log-level=silent', pfad], {
    cwd: WURZEL,
    stdio: 'ignore',
  });
}

const GRAPH = join(WURZEL, 'graphify-out/graph.json');
const SPERRE = join(WURZEL, 'graphify-out/.update.lock');
if (existsSync(GRAPH) && !pfad.startsWith('graphify-out/')) {
  try {
    // A lock older than two minutes belongs to an update that died.
    if (existsSync(SPERRE) && Date.now() - statSync(SPERRE).mtimeMs > 120_000) unlinkSync(SPERRE);
    closeSync(openSync(SPERRE, 'wx'));
    const skript = `graphify update . --no-cluster >/dev/null 2>&1; rm -f "${SPERRE}"`;
    spawn('sh', ['-c', skript], { cwd: WURZEL, detached: true, stdio: 'ignore' }).unref();
  } catch {
    // An update is already running, or graphify/sh is missing.
  }
}
process.exit(0);
