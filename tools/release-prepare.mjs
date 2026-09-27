#!/usr/bin/env node
/**
 * Prepares a release in one step, so nobody renames CHANGELOG headings by hand.
 *
 *   npm run release:vorbereiten -- patch|minor|major|<x.y.z[-pre]>
 *
 * 1. Raises the version in projects/zenit-ui/package.json.
 * 2. Turns the content of `## [Unreleased]` into `## [<version>] - <today>` and
 *    leaves an empty `## [Unreleased]` above it.
 *
 * Stops without writing anything when `[Unreleased]` is empty (a release
 * without a note is a release nobody can read) or when the target version
 * already has a section. Commits nothing: the change goes through review like
 * any other, and the merge to main publishes it (.github/workflows/publish.yml).
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PKG = resolve(ROOT, 'projects/zenit-ui/package.json');
const LOG = resolve(ROOT, 'CHANGELOG.md');
const SEMVER = /^(\d+)\.(\d+)\.(\d+)(-[0-9A-Za-z.-]+)?$/;

const fail = (message) => {
  console.error(`release-prepare: ${message}`);
  process.exit(1);
};

export function nextVersion(current, bump) {
  const m = SEMVER.exec(current);
  if (!m) throw new Error(`current version "${current}" is not semver`);
  const [maj, min, pat] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (bump === 'major') return `${maj + 1}.0.0`;
  if (bump === 'minor') return `${maj}.${min + 1}.0`;
  if (bump === 'patch') return m[4] ? `${maj}.${min}.${pat}` : `${maj}.${min}.${pat + 1}`;
  if (SEMVER.test(bump)) return bump;
  throw new Error(`"${bump}" is neither patch, minor, major nor a semver version`);
}

export function moveUnreleased(changelog, version, date) {
  const lines = changelog.split('\n');
  const start = lines.findIndex((l) => l.trim() === '## [Unreleased]');
  if (start < 0) throw new Error('CHANGELOG.md has no "## [Unreleased]" heading');
  if (lines.some((l) => l.startsWith(`## [${version}]`)))
    throw new Error(`CHANGELOG.md already has a section for ${version}`);
  const end = lines.findIndex((l, i) => i > start && l.startsWith('## '));
  const body = lines.slice(start + 1, end < 0 ? undefined : end);
  if (!body.join('').trim()) throw new Error('"## [Unreleased]" is empty; write the notes first');
  const rest = end < 0 ? [] : lines.slice(end);
  return [
    ...lines.slice(0, start),
    '## [Unreleased]',
    '',
    `## [${version}] - ${date}`,
    ...body,
    ...rest,
  ].join('\n');
}

if (process.argv[1]?.endsWith('release-prepare.mjs')) {
  const bump = process.argv[2];
  if (!bump) fail('usage: npm run release:vorbereiten -- patch|minor|major|<version>');
  const pkg = JSON.parse(readFileSync(PKG, 'utf8'));
  let version;
  let changelog;
  try {
    version = nextVersion(pkg.version, bump);
    changelog = moveUnreleased(
      readFileSync(LOG, 'utf8'),
      version,
      new Date().toISOString().slice(0, 10),
    );
  } catch (e) {
    fail(e.message);
  }
  const rawPkg = readFileSync(PKG, 'utf8');
  writeFileSync(PKG, rawPkg.replace(`"version": "${pkg.version}"`, `"version": "${version}"`));
  writeFileSync(LOG, changelog);
  console.log(
    `release-prepare: ${pkg.version} -> ${version}. Review, commit, merge to main; the merge publishes.`,
  );
}
