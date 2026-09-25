#!/usr/bin/env node
/**
 * Content gate for the packed library: what `npm pack` wrote into the tarball
 * is exactly the built package and nothing else.
 *
 *   node tools/check-pack.mjs <file.tgz>
 *
 * Reads the tarball itself, not `dist/zenit-ui`, because the tarball is what
 * the publish job uploads. Plain Node (zlib plus a ustar reader), so it runs
 * the same on the Linux runner and on Windows, where `tar` is not the same
 * program in every shell.
 *
 * Fails when
 * - a file lies outside the allowed top-level entries of a built package
 *   (fesm2022, types, styles, schematics, llms*.txt, package.json, README.md),
 * - anything looks like source or tooling: `src/`, a spec, a `.ts` that is not
 *   a declaration, schematic fixtures, `.npmrc`, `.env`, a nested tarball,
 * - a file contains something shaped like a credential,
 * - `package.json` does not carry the expected name (NPM_PACKAGE_NAME, default
 *   `@hosting/zenit-ui`) and the version of projects/zenit-ui/package.json,
 * - the tarball grows past the size limits below.
 */

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Twice the size of 0.1.0 (489 kB packed, 2.0 MB unpacked), so ordinary
 * growth passes and an accidentally packed folder does not.
 */
const MAX_PACKED = 1_000_000;
const MAX_UNPACKED = 4_000_000;

const ALLOWED = [
  /^package\.json$/,
  /^README\.md$/,
  /^llms(-full)?\.txt$/,
  /^fesm2022\/zenit-ui\.mjs(\.map)?$/,
  /^types\/[^/]+\.d\.ts$/,
  /^styles\/.+\.css$/,
  /^schematics\//,
];

const FORBIDDEN = [
  /(^|\/)src\//,
  /\.spec\./,
  /(^|\/)fixtures\//,
  /(?<!\.d)\.ts$/,
  /(^|\/)\.npmrc$/,
  /(^|\/)\.env(\.|$)/,
  /\.tgz$/,
  /(^|\/)node_modules\//,
];

/** Token formats of GitLab, npm and GitHub, auth lines of an .npmrc, private keys. */
const SECRETS = [
  /\bgl(pat|dt|cbt|ptt|rt|oas)-[\w-]{20,}/,
  /\bnpm_[A-Za-z0-9]{36}\b/,
  /\bgh[pousr]_[A-Za-z0-9]{36}\b/,
  /_authToken\s*=/,
  /(^|\s)_auth\s*=/m,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
];

/** Entries of a ustar archive as npm writes it, with pax `path` records honoured. */
function entries(tar) {
  const found = [];
  let paxPath;
  for (let at = 0; at + 512 <= tar.length;) {
    const header = tar.subarray(at, at + 512);
    if (header.every((b) => b === 0)) break;
    const text = (from, len) => header.toString('utf8', from, from + len).replace(/\0.*$/s, '');
    const size = parseInt(text(124, 12).trim() || '0', 8);
    const type = text(156, 1) || '0';
    const prefix = text(345, 155);
    const body = tar.subarray(at + 512, at + 512 + size);
    at += 512 + Math.ceil(size / 512) * 512;
    if (type === 'x') {
      paxPath = /\d+ path=([^\n]*)\n/.exec(body.toString('utf8'))?.[1];
      continue;
    }
    const path = paxPath ?? (prefix ? `${prefix}/${text(0, 100)}` : text(0, 100));
    paxPath = undefined;
    if (type === '0') found.push({ path, body });
  }
  return found;
}

const file = process.argv[2];
if (!file) {
  console.error('usage: node tools/check-pack.mjs <file.tgz>');
  process.exit(2);
}

const packed = readFileSync(file);
const files = entries(gunzipSync(packed));
const problems = [];

let unpacked = 0;
for (const { path, body } of files) {
  unpacked += body.length;
  if (!path.startsWith('package/')) {
    problems.push(`${path}: outside package/`);
    continue;
  }
  const rel = path.slice('package/'.length);
  if (!ALLOWED.some((re) => re.test(rel))) problems.push(`${rel}: not part of a built package`);
  if (FORBIDDEN.some((re) => re.test(rel))) problems.push(`${rel}: source, tooling or config`);
  const content = body.toString('utf8');
  for (const re of SECRETS) {
    if (re.test(content)) problems.push(`${rel}: matches the credential pattern ${re}`);
  }
}

const manifest = files.find((f) => f.path === 'package/package.json');
const expectedName = process.env.NPM_PACKAGE_NAME || '@hosting/zenit-ui';
const expectedVersion = JSON.parse(
  readFileSync(resolve(ROOT, 'projects/zenit-ui/package.json'), 'utf8'),
).version;
if (!manifest) {
  problems.push('package.json: missing');
} else {
  const { name, version } = JSON.parse(manifest.body.toString('utf8'));
  if (name !== expectedName) problems.push(`package.json: name ${name}, expected ${expectedName}`);
  if (version !== expectedVersion) {
    problems.push(`package.json: version ${version}, expected ${expectedVersion}`);
  }
}
for (const needed of ['fesm2022/zenit-ui.mjs', 'styles/tokens.css', 'schematics/collection.json']) {
  if (!files.some((f) => f.path === `package/${needed}`)) problems.push(`${needed}: missing`);
}

if (packed.length > MAX_PACKED) problems.push(`packed ${packed.length} B > ${MAX_PACKED} B`);
if (unpacked > MAX_UNPACKED) problems.push(`unpacked ${unpacked} B > ${MAX_UNPACKED} B`);

const kb = (n) => `${(n / 1000).toFixed(1)} kB`;
console.log(
  `${file}: ${files.length} files, ${kb(packed.length)} packed, ${kb(unpacked)} unpacked`,
);
if (problems.length) {
  for (const p of problems) console.error(`  ${p}`);
  console.error(`check-pack: ${problems.length} problem(s)`);
  process.exit(1);
}
console.log('check-pack: ok');
