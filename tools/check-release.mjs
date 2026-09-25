#!/usr/bin/env node
/**
 * Release gate, run on a tag before anything is published.
 *
 *   CI_COMMIT_TAG=v0.1.0 NPM_REGISTRY_URL=<url> node tools/check-release.mjs
 *
 * 1. The tag is `v<version>` or `<version>` of projects/zenit-ui/package.json, and that
 *    version is semver. A tag that says something else than the package would
 *    publish is a mistake in one of the two, so nothing goes out.
 * 2. That version of NPM_PACKAGE_NAME (default `@hosting/zenit-ui`) does not
 *    exist yet in NPM_REGISTRY_URL, so a used version stops the tag pipeline
 *    before the upload instead of at it.
 *
 * Authentication comes from the npm user config the job wrote. Any answer of
 * the registry other than "found" or "not found" fails the gate: a version
 * that could not be looked up is not known to be free.
 *
 * The one answer this cannot tell apart: GitLab answers 404, not 401, to a
 * caller without read access, so a missing or wrong token looks like a free
 * version here. The GitLab npm registry itself refuses a second upload of the
 * same version, which catches that case.
 */

import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SEMVER = /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/;

const fail = (message) => {
  console.error(`check-release: ${message}`);
  process.exit(1);
};

const { version } = JSON.parse(
  readFileSync(resolve(ROOT, 'projects/zenit-ui/package.json'), 'utf8'),
);
const tag = process.env.CI_COMMIT_TAG ?? '';
const name = process.env.NPM_PACKAGE_NAME || '@hosting/zenit-ui';
const registry = process.env.NPM_REGISTRY_URL;

if (!SEMVER.test(version))
  fail(`projects/zenit-ui/package.json has version "${version}", not semver`);
// v0.1.0 or 0.1.0: a GitHub release created in the browser often has the tag without the v.
if (tag !== `v${version}` && tag !== version) {
  fail(
    `tag "${tag}" does not match projects/zenit-ui/package.json version ${version} (expected v${version} or ${version})`,
  );
}
if (!registry) fail('NPM_REGISTRY_URL is not set');

// npm is npm.cmd on Windows, which spawn only finds through a shell.
const view = spawnSync(
  'npm',
  ['view', `${name}@${version}`, 'version', '--json', '--registry', registry],
  {
    encoding: 'utf8',
    shell: process.platform === 'win32',
  },
);
const out = view.stdout.trim();
if (view.status === 0 && out)
  fail(`${name}@${version} already exists in ${registry}; raise the version`);
if (view.status !== 0 && !/E404/.test(view.stdout + view.stderr)) {
  fail(`could not look up ${name}@${version} in ${registry}:\n${view.stderr || view.stdout}`);
}
console.log(`check-release: tag ${tag} matches, ${name}@${version} is not in ${registry} yet`);
