# Veröffentlichen

Die Library wird über die GitLab-CI (`.gitlab-ci.yml`) als npm-Paket veröffentlicht, standardmäßig in die npm-Registry des GitLab-Projekts `hosting/zenit-ui`. Veröffentlicht wird nur ein geschützter Tag `v<version>`. Ohne Freigabe des Owners gibt es keinen Push, keinen Tag und kein Publish.

## Paketname

Im Repo heißt das Paket weiter `zenit-ui`. Erst der Job `pack` setzt im gebauten `dist/zenit-ui/package.json` den Namen aus `NPM_PACKAGE_NAME` (Standard `@hosting/zenit-ui`, `npm pkg set name=…`) und packt danach.

Warum nicht im Repo umbenennen: Der Name `zenit-ui` ist zugleich der Importpfad. Die Schematics erzeugen `import … from 'zenit-ui'` und tragen `zenit-ui/styles/…` in die `angular.json` ein, `llms.txt`, README und alle Leitfäden zeigen `from 'zenit-ui'`, und `ui-demo` und `beispiel-app` importieren `zenit-ui` über `paths`. Eine Umbenennung hätte all das geändert und jeden Consumer gezwungen, seine Importe umzuschreiben. Der Scope `@hosting` ist dagegen nur eine Frage der Registry: npm leitet nur Pakete mit Scope an eine eigene Registry weiter, und der Instanz-Endpunkt von GitLab verlangt den Root-Namespace als Scope.

Deshalb installiert ein Consumer das Paket unter einem npm-Alias und behält `zenit-ui` als Importpfad (siehe unten). Das ist Pflicht: Ohne Alias liegt das Paket unter `node_modules/@hosting/zenit-ui`, und was die Schematics erzeugen, löst nicht auf.

## Release-Ablauf

1. Version in `projects/zenit-ui/package.json` heben (semver, Vorabversionen als `0.2.0-rc.1`).
2. In `CHANGELOG.md` den Abschnitt `[Unreleased]` in `## [0.2.0] - JJJJ-MM-TT` umbenennen und einen neuen leeren `[Unreleased]` darüber anlegen.
3. Lokal unter Windows `npm run check`, `npm run e2e` und `npm run e2e:beispiel` grün. Die Screenshot-Tests laufen in der GitLab-CI nicht (Begründung am Anfang von `.gitlab-ci.yml`), sie sind hier die einzige Prüfung.
4. Committen, per MR nach `main` mergen.
5. Auf `main` taggen und den Tag pushen: `git tag -a v0.2.0 -m "zenit-ui 0.2.0"`, `git push origin v0.2.0`.
6. Die Tag-Pipeline prüft alles noch einmal und veröffentlicht. Vorabversionen bekommen den dist-tag `next`, alle anderen `latest`.

Eine Version wird nie zweimal veröffentlicht. Ist sie schon in der Registry, bricht die Pipeline ab; dann Version heben und neu taggen.

## Jobs

| Job | Stage | Wann | Was |
|---|---|---|---|
| `lint` | check | immer | `lint`, `lint:css`, `format:check`, `check:themes`, `check:snippets`, `check:order` |
| `verify-release` | check | Tag | `tools/check-release.mjs`: Tag ist `v` + Version aus `projects/zenit-ui/package.json`, und diese Version gibt es in der Ziel-Registry noch nicht (`npm view`). Kann die Registry nicht befragt werden, ist das ebenfalls rot. |
| `build-lib` | build | immer | `build:lib` (llms, Library, Schematics), `check:llms`, `check:bundle`; `dist/zenit-ui` als Artefakt |
| `unit` | test | immer | `ng test zenit-ui`, `ng test beispiel-app`, `test:beispiel:jit`, `test:schematics` |
| `apps` | test | immer | `ng build ui-demo`, `ng build beispiel-app`, `check:ssr` |
| `pack` | package | immer | Namen setzen, `npm pack`, `tools/check-pack.mjs` über den Tarball; `pack/*.tgz` als Artefakt |
| `dry-run` | release | MR | `npm publish --dry-run` des Tarballs gegen die Ziel-Registry |
| `publish` | release | geschützter Tag `v<semver>` | nach allen Jobs oben: `check-release` noch einmal, dann `npm publish` des geprüften Tarballs |

`tools/check-pack.mjs` liest den Tarball selbst und bricht ab bei Dateien außerhalb von `fesm2022/`, `types/`, `styles/`, `schematics/`, `llms*.txt`, `package.json` und `README.md`, bei `src/`, Specs, `.ts` außer `.d.ts`, Fixtures, `.npmrc`, `.env`, bei Token-Mustern (GitLab, npm, GitHub, `_authToken`, private Schlüssel), bei falschem Namen oder falscher Version und über 1 MB gepackt oder 4 MB entpackt (0.1.0: 489 kB und 2,0 MB).

Die npm-Konfiguration der Registry-Jobs entsteht im Job in einer temporären Datei außerhalb des Checkouts und enthält nur `${NPM_TOKEN}`, das npm beim Lesen einsetzt. Eine `.npmrc` liegt nie im Repo.

## Registry umschalten

Drei CI/CD-Variablen, alle optional:

| Variable | Standard |
|---|---|
| `NPM_REGISTRY_URL` | `${CI_API_V4_URL}/projects/${CI_PROJECT_ID}/packages/npm/`, die Registry dieses Projekts |
| `NPM_TOKEN` | `CI_JOB_TOKEN`, aber nur, solange `NPM_REGISTRY_URL` leer ist |
| `NPM_PACKAGE_NAME` | `@hosting/zenit-ui` (in `.gitlab-ci.yml`) |

`NPM_REGISTRY_URL` als protected anlegen, `NPM_TOKEN` als masked und protected und mit dem Umgebungsbereich `npm-registry`. Protected allein reicht nicht: Geschützte Variablen gehen an jeden Job auf einem geschützten Ref, auch an `npm ci`. Die Umgebung `npm-registry` haben nur `verify-release` und `publish`, also sieht nur deren Code das Token. Wer mehr will, schützt die Umgebung zusätzlich (Settings > CI/CD > Protected environments).

`CI_JOB_TOKEN` geht nie an eine fremde Registry. Sieht ein Job `NPM_REGISTRY_URL`, aber kein `NPM_TOKEN`, fragen `npm view` und der Dry-Run anonym, und `publish` bricht ab. Im MR sieht der Dry-Run keine der beiden geschützten Variablen und prüft deshalb gegen die Registry des Projekts.

npmjs.org geht mit derselben Pipeline (`NPM_REGISTRY_URL=https://registry.npmjs.org/`, Token dieses Kontos, ein Name oder Scope, der diesem Konto gehört), aber **nur nach Freigabe durch Kian**. Das Paket ist `UNLICENSED`, und ein Paket mit Scope ist auf npmjs ohne `--access public` privat und kostenpflichtig; beides wäre vorher zu entscheiden. Außerdem vorher `sourceMap` (oder zumindest `sourcesContent`) im Library-Build abschalten, denn `fesm2022/zenit-ui.mjs.map` enthält den vollständigen TypeScript-Quelltext.

## Einbindung beim Consumer

Die `.npmrc` im Consumer-Projekt (ohne Token, der kommt aus der Umgebung):

```ini
@hosting:registry=https://git.zenit-hosting.de/api/v4/groups/<gruppen-id>/-/packages/npm/
//git.zenit-hosting.de/api/v4/groups/<gruppen-id>/-/packages/npm/:_authToken=${ZENIT_UI_NPM_TOKEN}
```

Installation unter dem Alias, damit der Importpfad `zenit-ui` bleibt:

```bash
npm install zenit-ui@npm:@hosting/zenit-ui@0.2.0
```

Das ergibt in der `package.json` `"zenit-ui": "npm:@hosting/zenit-ui@0.2.0"`, und `import { ZButton } from 'zenit-ui'` sowie `zenit-ui/styles/zenit-ui.css` lösen auf. Die Einrichtung danach mit `ng generate zenit-ui:ng-add` statt `ng add @hosting/zenit-ui`: `ng add` würde das Paket ein zweites Mal ohne Alias eintragen.

## Einmalig einzurichten (Kian)

1. In GitLab das Projekt `hosting/zenit-ui` anlegen, leer, ohne README.
2. Remote setzen und pushen: `git remote add origin git@git.zenit-hosting.de:hosting/zenit-ui.git`, dann `git push -u origin main` und die Branches, die gebraucht werden.
3. Settings > General > Visibility: Package registry aktiv.
4. Settings > Repository > Protected tags: `v*`, Erstellen nur für Maintainer.
5. Nur wenn nicht in die Projekt-Registry mit `CI_JOB_TOKEN` veröffentlicht wird: Settings > CI/CD > Variables `NPM_REGISTRY_URL` (protected) und `NPM_TOKEN` (masked, protected, Umgebung `npm-registry`), bei anderem Namen `NPM_PACKAGE_NAME`.
6. In der Gruppe `hosting` einen Deploy-Token mit Scope `read_package_registry` für die Consumer anlegen. Im Frontend als masked CI/CD-Variable `ZENIT_UI_NPM_TOKEN`, lokal als Umgebungsvariable.
7. Die Gruppen-Id von `hosting` (Gruppenseite, unter dem Namen) notieren; sie steht in der `.npmrc` des Consumers.
8. In der Gruppe `hosting` unter Settings > Packages and registries die Weiterleitung von npm-Anfragen an npmjs.org abschalten. Sonst liefert der Gruppen-Endpunkt ein hier unbekanntes `@hosting/*` von npmjs.org aus, und dort ist der Scope `@hosting` frei. Ist die Einstellung dort gesperrt, muss ein Admin sie unter Admin > Settings > CI/CD > Package Registry abschalten.
9. Prüfen, dass der Runner mit Tag `docker` `KUBERNETES_MEMORY_REQUEST` und `KUBERNETES_MEMORY_LIMIT` überschreiben darf (`allowed_memory_overwrite`), wie beim Frontend.

## Über GitHub Actions (npmjs.org)

`.github/workflows/publish.yml` veröffentlicht `@zenit-hosting/zenit-ui` öffentlich auf npmjs.org,
sobald auf GitHub ein Release veröffentlicht wird (`release: published`). Das Release braucht den
Tag `v<version>` passend zu `projects/zenit-ui/package.json`; `tools/check-release.mjs` stoppt
einen abweichenden Tag oder eine Version, die es auf npm schon gibt.

- Secret `NPM_TOKEN`: Automation- oder Granular-Token mit Publish-Recht auf den Scope
  `@zenit-hosting` (npm-Organisation `zenit-hosting`).
- Name und `publishConfig.access: public` stehen in `projects/zenit-ui/package.json`. Die Wurzel
  ist der private Workspace und wird nie veröffentlicht; gepackt wird `dist/zenit-ui`.
- Node 24 statt 20: Angular 22 verlangt Node ab 22.22.3.
- Ablauf: Lint, Build (`build:lib`), Unit-Tests, Release-Prüfung, Pack mit `check-pack`,
  `npm publish --access public` (Vorabversionen mit dem dist-tag `next`). Playwright läuft nicht
  mit (Windows-Baselines, siehe oben).
- Die GitLab-Pipeline setzt beim Packen weiter ihren eigenen Namen (`NPM_PACKAGE_NAME`).

## Lokal nachspielen

```bash
npm run build:lib
mkdir -p pack && cd dist/zenit-ui && npm pkg set name=@hosting/zenit-ui && npm pack --pack-destination ../../pack && cd ../..
node tools/check-pack.mjs pack/hosting-zenit-ui-<version>.tgz
```

`npm pkg set` ändert den Namen in `dist/zenit-ui`; ein erneutes `npm run build:lib` stellt `zenit-ui` wieder her. Für Publish und Versionsprüfung eignet sich eine lokale Registry (`npx verdaccio`), nie eine echte.
