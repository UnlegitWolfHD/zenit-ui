# `ng add zenit-ui`

The library ships a schematics collection so that the setup from
`projects/zenit-ui/README.md` does not have to be done by hand. One command
registers the stylesheets, sets `z-root`, pulls in `@angular/cdk` and the four
self-hosted fonts and mounts the toast outlet.

```bash
ng add zenit-ui
```

## What it does

Every step is idempotent: running the schematic a second time changes nothing,
existing entries are never duplicated, and an existing but wrongly ordered
`styles` array is put back into the order the README prescribes.

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
   `tokens.css`.

2. **`src/index.html`** – the class `z-root` is merged into the class lists of
   `<html>` and `<body>`. A `lang` attribute is only added (`lang="de"`) when
   the `<html>` tag carries none.

3. **`@angular/cdk`** – added to `dependencies` with the range of the installed
   Angular major (`^22.0.0` for Angular 22) when it is missing, followed by a
   `NodePackageInstallTask`. An existing entry is left alone.

4. **Fonts** – `material-icons`, `@fontsource/inter`, `@fontsource/space-grotesk`
   and `@fontsource/jetbrains-mono` land in `devDependencies`, and their
   `@import` rules are prepended to the project's global stylesheet. The
   `layer(schriften)` around Material Icons is required, see the README. The
   same block is valid in SCSS, because every URL ends in `.css` and Sass
   (from 1.71) passes such rules through as plain CSS imports.

5. **Toast outlet** – `<z-toast-outlet />` is appended to the root component's
   template and `ZToastOutlet` is added to its `imports`. The root component is
   located through the build target's `main.ts` and the `bootstrapApplication()`
   call in it. When that fails, the schematic logs what to do by hand instead of
   guessing.

## Options

| Option | Type | Default | Meaning |
| --- | --- | --- | --- |
| `--project` | string | workspace default | Application to wire up. Without it the first application of the workspace is used. |
| `--themes` | boolean | `false` | Also register `zenit-ui/styles/themes.css`. |
| `--fonts` | boolean | `true` | Add the font packages and their imports. |
| `--toast-outlet` | boolean | `true` | Mount `<z-toast-outlet />` in the root component. |

## Running it against the local tarball

The library is not published, so `ng add` needs a local package:

```bash
ng build zenit-ui
node tools/build-schematics.mjs
cd dist/zenit-ui && npm pack          # zenit-ui-0.1.0.tgz
```

In the application:

```bash
npm i ../path/to/zenit-ui-0.1.0.tgz
ng add zenit-ui
```

`npm i` of a tarball does not run `ng add`, so the second command is needed.
Alternatively the collection can be run straight from `dist` without installing
anything:

```bash
npx schematics /path/to/dist/zenit-ui/schematics/collection.json:ng-add --project my-app
```

## Building and testing

```bash
ng build zenit-ui && node tools/build-schematics.mjs   # = build:lib
node tools/test-schematics.mjs                         # = test:schematics
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
specs; Vitest runs the TypeScript specs directly. The suite has 14 tests in
`projects/zenit-ui/schematics/ng-add/index.spec.ts` and builds its fixtures with
the `workspace` and `application` schematics of `@schematics/angular`.

`ng build zenit-ui` never sees the schematics: `tsconfig.lib.json` only includes
`src/**`, and `ng-package.json` only copies `src/styles`. `ng test zenit-ui`
ignores them for the same reason (`tsconfig.spec.json` includes `src/**` only).

## Limits

- The schematic writes the style entries in the package-specifier form
  (`zenit-ui/styles/tokens.css`) that the README documents. Applications that
  import the stylesheets via `@import` in their own entry stylesheet instead get
  a duplicate registration and have to remove the `angular.json` entries.
- Only the `options` of a target are touched, not per-configuration overrides.
  A project that sets `styles` inside a configuration has to be adjusted by hand.
- The root component is only found for standalone applications bootstrapped
  with `bootstrapApplication()`. For an `NgModule` based application the
  schematic logs the two manual steps.
- Inline templates are only extended when they are written as a template literal
  (backticks). A template in a plain string is left alone with a warning.
- `zenit-ui/styles/themes.css` is not part of the package yet. Use `--themes`
  only once the theming package has landed.
- The font package ranges are pinned in the schematic
  (`projects/zenit-ui/schematics/ng-add/index.ts`, `FONT_PACKAGES`) and have to
  be bumped together with the workspace's own devDependencies.
