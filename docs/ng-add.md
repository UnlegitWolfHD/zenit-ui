# `ng add zenit-ui`

The library ships a schematics collection so that the setup from
`projects/zenit-ui/README.md` does not have to be done by hand. One command
registers the stylesheets, sets `z-root`, pulls in `@angular/cdk` and the four
self-hosted fonts and mounts the toast outlet.

```bash
ng add ./zenit-ui-0.1.0.tgz
```

Name the tarball, not the package: `zenit-ui` is unclaimed on the public
registry, see the warning in the package README.

## Guarantees

- **Idempotent.** A second run changes nothing (the CLI prints "Nothing to be
  done"), existing entries are never duplicated, and a wrongly ordered `styles`
  array is put back into the order the README prescribes.
- **A source file is fully patched or untouched.** All changes to one file are
  computed against its original text and applied in one pass. When a file cannot
  be patched safely (see the cases below), nothing in it changes and the final
  log lists the manual step under "left for you". The log only reports a step as
  done when it was done.
- **Only files of the project are written.** Nothing under `node_modules` and
  nothing outside the project root.
- **Line endings are kept.** Inserted text uses the dominant line ending of the
  file it goes into, so a CRLF file stays CRLF.

The Angular CLI formats every file a schematic touched with Prettier when the
workspace has Prettier installed (a fresh `ng new` application does). That can
reindent `index.html` beyond the lines listed here; it is the CLI's doing, not
the schematic's. The init script carries a `<!-- prettier-ignore -->`.

## What it does

1. **`angular.json`** – the `styles` of the project's `build` target (and of the
   `test` target when it already has a `styles` option) get these entries in
   front of the application's own styles:

   ```json
   "styles": [
     "zenit-ui/styles/tokens.css",
     "@angular/cdk/overlay-prebuilt.css",
     "zenit-ui/styles/zenit-ui.css",
     "src/styles.css"
   ]
   ```

   With `--themes` the entry `zenit-ui/styles/themes.css` follows directly after
   `tokens.css`. Existing entries are recognised in both spellings
   (`zenit-ui/styles/tokens.css` and `node_modules/zenit-ui/styles/tokens.css`)
   and in object form; they are moved into place as they are, so
   `{ "input": …, "bundleName": …, "inject": … }` keeps its keys. A `themes.css`
   entry that is already there stays, in its canonical place, also when the
   schematic runs without `--themes`.

   Only `options` is written. `styles` inside a configuration replace the ones
   from `options`; such configurations are left alone and named in the log.

2. **`src/index.html`** – the class `z-root` is merged into the class lists of
   `<html>` and `<body>`. `lang="de"` is only added when `<html>` has no `lang`.
   A fresh `ng new` application has `lang="en"`, which is left as it is; the log
   then says `lang left as "en": set it to your UI language` (the built-in
   labels of zenit-ui are German).

   The file is read with a small tolerant tag scanner, not with a regular
   expression: tags inside comments, `<script>`, `<style>`, `<textarea>` and
   `<title>` are ignored, attribute values may contain `>`, values may be
   double-quoted, single-quoted or unquoted (`class=app` becomes
   `class="app z-root"`), tag names may be upper case and tags may span lines.
   When `<html>` or `<body>` (or, with `--themes`, `<head>`) is missing, the
   file is left alone.

3. **`@angular/cdk`** – added to `dependencies` with the range of the installed
   Angular major (`^22.0.0` for Angular 22) when it is missing, followed by a
   `NodePackageInstallTask`. An existing entry is left alone.

4. **Fonts** – `material-icons`, `@fontsource/inter`, `@fontsource/space-grotesk`
   and `@fontsource/jetbrains-mono` land in `devDependencies`, and their
   `@import` rules are prepended to the project's global stylesheet: the first
   `styles` entry of the build target that is a `.css`, `.scss` or `.less` file
   inside the project. Entries under `node_modules` (such as
   `node_modules/material-icons/iconfont/material-icons.css`), absolute paths
   and paths outside the project root never qualify. Without such an entry the
   log names the manual step. The `layer(schriften)` around Material Icons is
   required, see the README. The same block is valid in SCSS, because every URL
   ends in `.css` and Sass (from 1.71) passes such rules through as plain CSS
   imports.

5. **Toast outlet** – `<z-toast-outlet />` is appended to the root component's
   template and `ZToastOutlet` is added to its `imports`, together with the
   import statement. The root component is the class passed to
   `bootstrapApplication()` in the build target's main file. It is patched when
   - its template is a `templateUrl` file or an inline `template` written as a
     template literal without `${…}`, in any position relative to `imports`, and
   - `imports` is an array literal (`[RouterOutlet]`, `[]`, `[...SHARED, Other]`)
     or absent, in which case the property is added.

   It is left untouched, with the manual steps in the log, when `imports` is an
   identifier (`imports: SHARED`), a shorthand, a call or a spread-only array,
   when there is neither `templateUrl` nor a template literal, when the template
   file is missing, or when `zenit-ui` is imported as a namespace. The template
   counts as done when it contains the element `<z-toast-outlet`; a comment that
   merely mentions it does not count.

   An **NgModule application** (`bootstrapModule()` in the main file) is not
   changed either. The log then names the right steps: `ZToastOutlet` goes into
   the `imports` of the NgModule that declares the root component, the tag into
   that component's template, and with `--themes` `provideZenitTheme()` into the
   `providers` of the root NgModule.

6. **Theme, only with `--themes`** – three steps that keep a stored colour
   scheme from flashing in the default scheme first (`docs/theming.md`, "No
   flash of the wrong theme"):
   - The output of `zenitThemeInitScript()` goes into `src/index.html` as an
     inline `<script>`, right after `<meta charset>` (which has to stay within
     the first 1024 bytes) or as the first child of `<head>` when there is none.
     It is written in the same pass as `z-root`. It carries the marker comment
     `zenit-theme-init`; a file that already contains the marker gets no second
     script.
   - `optimization.styles.inlineCritical` is set to `false` in the `production`
     configuration of the build target. The CLI otherwise inlines only the CSS
     that matches `index.html` and loads the rest without blocking;
     `[data-theme="light"]` matches nothing there, so the page would still paint
     dark first. An existing `optimization` object keeps its other settings,
     `optimization: false` and `styles: false` are left alone.
   - `provideZenitTheme()` is added to the application config, when the
     `bootstrapApplication()` call and its config can be resolved and no
     `provideZenitTheme(` is there yet. Otherwise the log names the step.

   The script matches the default config. If you pass a config to
   `provideZenitTheme()`, replace the script with the output of
   `zenitThemeInitScript(config)`.

## Options

| Option | Type | Default | Meaning |
| --- | --- | --- | --- |
| `--project` | string | the only application | Application to wire up. It must have `projectType: "application"` and a `build` target whose builder ends in `:application`, `:browser` or `:browser-esbuild`; a library or an unknown name fails with a `SchematicsException` before anything is written. Without the option the workspace must have exactly one application, whose name is logged; with none or several the schematic fails and lists them. |
| `--themes` | boolean | `false` | Also register `zenit-ui/styles/themes.css` and wire the theme without a flash: init script in `index.html`, `provideZenitTheme()`, `inlineCritical: false` for production. |
| `--fonts` | boolean | `true` | Add the font packages and their imports. |
| `--toast-outlet` | boolean | `true` | Mount `<z-toast-outlet />` in the root component. |

## Running it against the local build

The library is not published, so the schematic runs from a local package:

```bash
npm run build:lib                     # ng build zenit-ui + tools/build-schematics.mjs
cd dist/zenit-ui && npm pack          # zenit-ui-0.1.0.tgz
```

In the application, either let `ng add` install the tarball and run the
schematic:

```bash
ng add ../path/to/zenit-ui-0.1.0.tgz --themes
```

or install first and run the schematic on its own. `npm i` of a tarball does not
run it, and this is also the way to run it again later:

```bash
npm i ../path/to/zenit-ui-0.1.0.tgz
ng generate zenit-ui:ng-add --project my-app --themes
```

`ng generate` also takes the path of a collection, which runs the build output
without installing it: `ng generate ../path/to/dist/zenit-ui/schematics/collection.json:ng-add --project my-app`.
Add `--dry-run` to any of them to see the file list without writing.

`npx schematics …` is not one of the supported ways: the name `schematics` on
npm is an unrelated package. The binary of that name belongs to
`@angular-devkit/schematics-cli`, which is not a dependency of this workspace
and was not tested here. If you use it (`npx -p @angular-devkit/schematics-cli
schematics <path>/collection.json:ng-add --project my-app --dry-run=false`), mind
that it defaults to a dry run for a local collection path.

## Building and testing

```bash
npm run build:lib          # ng build zenit-ui && node tools/build-schematics.mjs
npm run test:schematics    # node tools/test-schematics.mjs
```

`tools/build-schematics.mjs` compiles `projects/zenit-ui/schematics` with
`projects/zenit-ui/tsconfig.schematics.json` to CommonJS in
`dist/zenit-ui/schematics`, copies `collection.json` and the `schema.json`
files, and writes a small `schematics/package.json` with `"type": "commonjs"` –
ng-packagr marks the package as `"type": "module"`, which would otherwise make
Node read the compiled factories as ESM.

`tools/test-schematics.mjs` builds first (the schematics engine loads factories
through `require()`, so they must exist as JavaScript) and then runs the specs
with **Vitest**, which is already a devDependency of the workspace. Node's
built-in test runner would need `@types/node` plus a second compile step for the
specs; Vitest runs the TypeScript specs directly. The suite is
`projects/zenit-ui/schematics/ng-add/index.spec.ts`. It builds its fixtures with
the `workspace`, `application` and `library` schematics of `@schematics/angular`
and has one block of regression tests per finding of the consumer review
(property order in the root component, non-literal `imports`, `node_modules`
stylesheets, style entry spellings, `index.html` scanning, project selection,
line endings, NgModule applications, `lang`).

`ng build zenit-ui` never sees the schematics: `tsconfig.lib.json` only includes
`src/**`, and `ng-package.json` only copies `src/styles`. `ng test zenit-ui`
ignores them for the same reason (`tsconfig.spec.json` includes `src/**` only).

## Limits

- Applications that import the library stylesheets via `@import` in their own
  entry stylesheet instead of `angular.json` get a second registration and have
  to remove the `angular.json` entries.
- Only the `options` of a target are written. `styles` inside a configuration
  are reported, not patched.
- The root component is only patched for standalone applications bootstrapped
  with `bootstrapApplication(Component, …)` where `Component` is imported by a
  relative path in the main file. NgModule applications and every case listed
  under "Toast outlet" get manual steps instead.
- An inline template in a plain string (`template: '<router-outlet />'`) or with
  `${…}` is not extended.
- A global stylesheet in the indented `.sass` syntax does not get the font
  imports, the block is not valid there.
- The `index.html` scanner is not an HTML parser. It handles what the list
  above names; it does not know conditional comments, CDATA or a `<html>` that
  only exists after server-side templating.
- `zenit-ui/styles/themes.css` ships with the package (`styles/themes.css` and
  `styles/themes/*.css`). `--themes` writes the init script for the default
  config only and always onto `<html>`; with a custom `target` remove it again.
  The check for an existing provider is textual (`provideZenitTheme(`).
- The font package ranges are pinned in the schematic
  (`projects/zenit-ui/schematics/ng-add/index.ts`, `FONT_PACKAGES`) and have to
  be bumped together with the workspace's own devDependencies.
