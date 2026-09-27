#!/usr/bin/env node
/**
 * Prints the CHANGELOG.md section of one version, without its heading.
 *
 *   node tools/release-notes.mjs 0.2.0 > notes.md
 *
 * Used as the body of the GitHub release and by check-release.mjs, which
 * refuses a version without a section. Exit code 1 when the section is
 * missing or empty.
 */

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** The body of `## [<version>]` up to the next `## ` heading, trimmed; null if absent or empty. */
export function releaseNotes(
  version,
  changelog = readFileSync(resolve(ROOT, 'CHANGELOG.md'), 'utf8'),
) {
  const lines = changelog.split(/\r?\n/);
  const start = lines.findIndex((l) => l.startsWith(`## [${version}]`));
  if (start < 0) return null;
  const end = lines.findIndex((l, i) => i > start && l.startsWith('## '));
  const body = lines
    .slice(start + 1, end < 0 ? undefined : end)
    .join('\n')
    .trim();
  return body || null;
}

if (process.argv[1]?.endsWith('release-notes.mjs')) {
  const version = process.argv[2];
  if (!version) {
    console.error('usage: node tools/release-notes.mjs <version>');
    process.exit(1);
  }
  const notes = releaseNotes(version);
  if (!notes) {
    console.error(`release-notes: CHANGELOG.md has no section "## [${version}]" with content`);
    process.exit(1);
  }
  process.stdout.write(notes + '\n');
}
