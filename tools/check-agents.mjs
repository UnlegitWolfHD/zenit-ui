#!/usr/bin/env node
/**
 * Checks the Claude Code subagents in `.claude/agents/` and the skills in
 * `.claude/skills/`, because Claude Code silently drops a file whose
 * frontmatter does not parse, and the agent is then simply missing.
 *
 *   node tools/check-agents.mjs
 *
 * Per file: the frontmatter block exists, every line is `key: value`, an
 * unquoted value contains no further `: ` (which YAML reads as a nested
 * mapping and rejects), `name` matches the file or folder name, `description`
 * is set, and for agents `model`, `effort` and `maxTurns` hold known values
 * and every tool is a built-in tool or an `mcp__angular-cli__` tool of
 * `.mcp.json`. Repository paths in backticks in the body must exist.
 *
 * Plain Node, no dependencies. Every problem is listed; the exit code is 1 if
 * there was at least one.
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const WURZEL = join(dirname(fileURLToPath(import.meta.url)), '..');
const MODELLE = ['sonnet', 'opus', 'fable', 'haiku', 'inherit'];
const MODELL_ID = /^claude-(sonnet|opus|fable|haiku)-[0-9a-z-]+$/;
const AUFWAND = ['low', 'medium', 'high', 'xhigh', 'max'];
const WERKZEUGE = [
  'Read',
  'Edit',
  'Write',
  'MultiEdit',
  'Grep',
  'Glob',
  'Bash',
  'WebFetch',
  'WebSearch',
  'NotebookEdit',
  'Agent',
  'Task',
  'TodoWrite',
  'SendMessage',
  'Skill',
];
const MCP =
  /^mcp__angular-cli__(ai_tutor|devserver_start|devserver_stop|devserver_wait_for_build|get_best_practices|list_projects|onpush_zoneless_migration|run_target|search_documentation)$/;
// Paths the body names in backticks that live in the repository.
const PFAD = /`((?:\.claude|projects|spec|tools|docs|e2e)\/[^`*<>\s]+)`/g;

const fehler = [];

function pruefe(datei, name, istAgent) {
  const rel = datei.slice(WURZEL.length + 1);
  const text = readFileSync(datei, 'utf8').replace(/\r\n/g, '\n');
  const block = /^---\n([\s\S]*?)\n---\n/.exec(text);
  if (!block) {
    fehler.push(`${rel}: no frontmatter between --- lines`);
    return;
  }
  const felder = {};
  for (const [n, zeile] of block[1].split('\n').entries()) {
    const treffer = /^([A-Za-z][\w-]*):\s*(.*)$/.exec(zeile);
    if (!treffer) {
      fehler.push(`${rel}:${n + 2}: not a "key: value" line`);
      continue;
    }
    const [, schluessel, wert] = treffer;
    if (!/^["']/.test(wert) && /:\s/.test(wert))
      fehler.push(
        `${rel}:${n + 2}: "${schluessel}" contains ": ", which YAML rejects; quote it or rephrase`,
      );
    felder[schluessel] = wert.replace(/^["'](.*)["']$/, '$1');
  }
  if (felder.name !== name) fehler.push(`${rel}: name "${felder.name}" should be "${name}"`);
  if (!felder.description) fehler.push(`${rel}: description is missing`);

  if (istAgent) {
    const modell = felder.model;
    if (!modell) fehler.push(`${rel}: model is missing`);
    else if (!MODELLE.includes(modell) && !MODELL_ID.test(modell))
      fehler.push(`${rel}: unknown model "${modell}"`);
    if (felder.effort && !AUFWAND.includes(felder.effort))
      fehler.push(`${rel}: effort must be one of ${AUFWAND.join(', ')}`);
    if (felder.maxTurns && !/^[1-9]\d*$/.test(felder.maxTurns))
      fehler.push(`${rel}: maxTurns must be a positive integer`);
    for (const werkzeug of (felder.tools ?? '')
      .split(',')
      .map((w) => w.trim())
      .filter(Boolean)) {
      if (!WERKZEUGE.includes(werkzeug) && !MCP.test(werkzeug))
        fehler.push(`${rel}: unknown tool "${werkzeug}"`);
    }
  }

  for (const [, pfad] of text.slice(block[0].length).matchAll(PFAD)) {
    if (!existsSync(join(WURZEL, pfad.replace(/[.,:;)]+$/, ''))))
      fehler.push(`${rel}: names \`${pfad}\`, which does not exist`);
  }
}

const AGENTS = join(WURZEL, '.claude/agents');
const agents = existsSync(AGENTS) ? readdirSync(AGENTS).filter((d) => d.endsWith('.md')) : [];
for (const d of agents) pruefe(join(AGENTS, d), basename(d, '.md'), true);

const SKILLS = join(WURZEL, '.claude/skills');
const skills = existsSync(SKILLS) ? readdirSync(SKILLS) : [];
for (const s of skills) {
  const datei = join(SKILLS, s, 'SKILL.md');
  if (existsSync(datei)) pruefe(datei, s, false);
  else fehler.push(`.claude/skills/${s}: SKILL.md is missing`);
}

for (const f of fehler) console.log(f);
console.log(
  fehler.length
    ? `${fehler.length} problem(s) in ${agents.length} agents and ${skills.length} skills`
    : `${agents.length} agents and ${skills.length} skills OK`,
);
process.exit(fehler.length ? 1 : 0);
