# Veröffentlichen

## Auf npmjs.org über GitHub (der Weg für `@zenit-hosting/zenit-ui`)

Ein Release ist ein Merge. Niemand setzt einen Tag von Hand.

1. Notizen unter `## [Unreleased]` in `CHANGELOG.md` schreiben, wie bei jeder Änderung.
2. `npm run release:vorbereiten -- patch` (oder `minor`, `major`, eine Version wie `0.3.0-rc.1`). Das hebt die Version in `projects/zenit-ui/package.json` und macht aus `[Unreleased]` den Abschnitt `## [<version>] - <heute>`. Ist `[Unreleased]` leer, bricht es ab.
3. Lokal unter Windows `npm run e2e` und `npm run e2e:beispiel` (die Screenshot-Tests laufen in keiner CI).
4. Committen, PR nach `main`, mergen.
5. `.github/workflows/publish.yml` sieht die geänderte Version, prüft und baut alles, veröffentlicht auf npm (`latest`, Vorabversionen als `next`) und legt den Tag `v<version>` und ein GitHub-Release mit dem CHANGELOG-Abschnitt als Text an.

Ist die Version schon auf npm, tut der Push nichts. Fehlt der CHANGELOG-Abschnitt, ist der Lauf rot (`tools/check-release.mjs`). Ein von Hand gepushter Tag, ein im Browser angelegtes Release oder „Run workflow“ in Actions laufen weiter über denselben Workflow.

Consumer ziehen neue Versionen selbst nach: Das Frontend hat dafür `.github/workflows/zenit-ui-update.yml`, das nach einer neuen Version sucht und einen PR öffnet.

### Der Workflow im Einzelnen

- Secret `NPM_TOKEN`: Automation- oder Granular-Token mit Publish-Recht auf den Scope
  `@zenit-hosting` (npm-Organisation `zenit-hosting`).
- Name und `publishConfig.access: public` stehen in `projects/zenit-ui/package.json`. Die Wurzel
  ist der private Workspace und wird nie veröffentlicht; gepackt wird `dist/zenit-ui`.
- Node 24 statt 20: Angular 22 verlangt Node ab 22.22.3.
- Ablauf: Release-Prüfung (`tools/check-release.mjs`), Lint, Build (`build:lib`), Unit-Tests,
  Pack mit `tools/check-pack.mjs`, `npm publish --access public`, danach Tag und GitHub-Release.
  Playwright läuft nicht mit (Windows-Baselines, siehe oben).

### Was im Paket steht

Das Paket ist öffentlich und steht unter der MIT-Lizenz (`"license": "MIT"`, `LICENSE` liegt im Paket). `tools/check-pack.mjs` bricht ab, wenn das Manifest nicht MIT angibt oder `LICENSE` fehlt oder von der Datei im Wurzelverzeichnis abweicht. Name und Logo von Zenit-Hosting sind davon ausgenommen, siehe Abschnitt "License" im Paket-README. Das Paket enthält `fesm2022/zenit-hosting-zenit-ui.mjs.map` mit dem vollständigen TypeScript-Quelltext der Library (`sourcesContent`): Der Library-Build schaltet Sourcemaps nicht ab, und `tools/check-pack.mjs` lässt die Datei zu. Soll der Quelltext nicht mehr mitgehen, muss das im Build geändert werden, nicht hier.

## Paketname

In `projects/zenit-ui/package.json` heißt das Paket `@zenit-hosting/zenit-ui`, und unter diesem Namen steht es auf npmjs.org. Der Importpfad bleibt `zenit-ui`: Ein Consumer installiert das Paket unter einem npm-Alias.

```bash
npm install zenit-ui@npm:@zenit-hosting/zenit-ui
```

Das ergibt in der `package.json` `"zenit-ui": "npm:@zenit-hosting/zenit-ui@^<aktuelle Version>"`, und `import { ZButton } from 'zenit-ui'` sowie `zenit-ui/styles/zenit-ui.css` lösen auf. Die Einrichtung danach mit `ng generate zenit-ui:ng-add --themes` statt `ng add @zenit-hosting/zenit-ui`: `ng add` würde das Paket ein zweites Mal ohne Alias eintragen. Der Name `zenit-ui` ohne Scope gehört auf npmjs.org jemand anderem; `npm i zenit-ui` und `ng add zenit-ui` holen ein fremdes Paket.

Warum der Importpfad `zenit-ui` bleibt: Die Schematics erzeugen `import … from 'zenit-ui'` und tragen `zenit-ui/styles/…` in die `angular.json` ein, `llms.txt`, README und alle Leitfäden zeigen `from 'zenit-ui'`, und `ui-demo` und `beispiel-app` importieren `zenit-ui` über `paths`. Ein Importpfad mit Scope hätte all das geändert und jeden Consumer gezwungen, seine Importe umzuschreiben. Der Scope ist dagegen nur eine Frage der Registry: auf npmjs.org die Organisation `zenit-hosting`, in GitLab der Root-Namespace `hosting`, weil npm nur Pakete mit Scope an eine eigene Registry weiterleitet und der Instanz-Endpunkt von GitLab den Root-Namespace als Scope verlangt.

Der Alias ist Pflicht: Ohne ihn liegt das Paket unter `node_modules/@zenit-hosting/zenit-ui` (bzw. `@hosting/zenit-ui`), und was die Schematics erzeugen, löst nicht auf.

## Alternative: über GitLab

Neben dem Weg über GitHub gibt es weiter die GitLab-CI (`.gitlab-ci.yml`). Sie veröffentlicht unter dem Namen `@hosting/zenit-ui` in die npm-Registry des GitLab-Projekts `hosting/zenit-ui`, und zwar nur von einem geschützten Tag `v<version>`. Ihr Job `pack` setzt dafür im gebauten `dist/zenit-ui/package.json` den Namen aus `NPM_PACKAGE_NAME` (`npm pkg set name=…`) und packt danach. Alles bis einschließlich „Einmalig einzurichten“ gilt nur für diesen Weg.

### Release-Ablauf über GitLab

1. Notizen unter `## [Unreleased]` in `CHANGELOG.md`.
2. `npm run release:vorbereiten -- patch` (oder `minor`, `major`, eine Version wie `0.3.0-rc.1`) hebt die Version und legt den CHANGELOG-Abschnitt an, wie oben.
3. Lokal unter Windows `npm run check`, `npm run e2e` und `npm run e2e:beispiel` grün. Die Screenshot-Tests laufen in der GitLab-CI nicht (Begründung am Anfang von `.gitlab-ci.yml`), sie sind hier die einzige Prüfung.
4. Committen, per MR nach `main` mergen.
5. Auf `main` taggen und den Tag zu GitLab pushen: `git tag -a v<version> -m "zenit-ui <version>"`, `git push <gitlab-remote> v<version>`.
6. Die Tag-Pipeline prüft alles noch einmal und veröffentlicht. Vorabversionen bekommen den dist-tag `next`, alle anderen `latest`.

Eine Version wird nie zweimal veröffentlicht. Ist sie schon in der Registry, bricht die Pipeline ab; dann Version heben und neu taggen.

### Jobs

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

### Registry umschalten

Drei CI/CD-Variablen, alle optional:

| Variable | Standard |
|---|---|
| `NPM_REGISTRY_URL` | `${CI_API_V4_URL}/projects/${CI_PROJECT_ID}/packages/npm/`, die Registry dieses Projekts |
| `NPM_TOKEN` | `CI_JOB_TOKEN`, aber nur, solange `NPM_REGISTRY_URL` leer ist |
| `NPM_PACKAGE_NAME` | `@hosting/zenit-ui` (in `.gitlab-ci.yml`) |

`NPM_REGISTRY_URL` als protected anlegen, `NPM_TOKEN` als masked und protected und mit dem Umgebungsbereich `npm-registry`. Protected allein reicht nicht: Geschützte Variablen gehen an jeden Job auf einem geschützten Ref, auch an `npm ci`. Die Umgebung `npm-registry` haben nur `verify-release` und `publish`, also sieht nur deren Code das Token. Wer mehr will, schützt die Umgebung zusätzlich (Settings > CI/CD > Protected environments).

`CI_JOB_TOKEN` geht nie an eine fremde Registry. Sieht ein Job `NPM_REGISTRY_URL`, aber kein `NPM_TOKEN`, fragen `npm view` und der Dry-Run anonym, und `publish` bricht ab. Im MR sieht der Dry-Run keine der beiden geschützten Variablen und prüft deshalb gegen die Registry des Projekts.

Nach npmjs.org veröffentlicht der Workflow auf GitHub (oben), nicht diese Pipeline. Technisch ginge es auch hier (`NPM_REGISTRY_URL=https://registry.npmjs.org/`, `NPM_PACKAGE_NAME=@zenit-hosting/zenit-ui`, Token mit Publish-Recht auf den Scope), aber zwei Wege in dieselbe Registry würden um dieselbe Version konkurrieren.

### Einbindung beim Consumer aus der GitLab-Registry

Aus npmjs.org braucht ein Consumer keine `.npmrc` (siehe „Paketname“). Aus der GitLab-Registry gehört in die `.npmrc` des Consumer-Projekts (ohne Token, der kommt aus der Umgebung):

```ini
@hosting:registry=https://git.zenit-hosting.de/api/v4/groups/<gruppen-id>/-/packages/npm/
//git.zenit-hosting.de/api/v4/groups/<gruppen-id>/-/packages/npm/:_authToken=${ZENIT_UI_NPM_TOKEN}
```

Installation unter dem Alias, damit der Importpfad `zenit-ui` bleibt:

```bash
npm install zenit-ui@npm:@hosting/zenit-ui@0.2.0
```

Die Einrichtung danach wie oben mit `ng generate zenit-ui:ng-add`, nicht mit `ng add @hosting/zenit-ui`.

### Einmalig einzurichten (Kian)

1. In GitLab das Projekt `hosting/zenit-ui` anlegen, leer, ohne README.
2. Remote setzen und pushen: `git remote add origin git@git.zenit-hosting.de:hosting/zenit-ui.git`, dann `git push -u origin main` und die Branches, die gebraucht werden.
3. Settings > General > Visibility: Package registry aktiv.
4. Settings > Repository > Protected tags: `v*`, Erstellen nur für Maintainer.
5. Nur wenn nicht in die Projekt-Registry mit `CI_JOB_TOKEN` veröffentlicht wird: Settings > CI/CD > Variables `NPM_REGISTRY_URL` (protected) und `NPM_TOKEN` (masked, protected, Umgebung `npm-registry`), bei anderem Namen `NPM_PACKAGE_NAME`.
6. In der Gruppe `hosting` einen Deploy-Token mit Scope `read_package_registry` für die Consumer anlegen. Im Frontend als masked CI/CD-Variable `ZENIT_UI_NPM_TOKEN`, lokal als Umgebungsvariable.
7. Die Gruppen-Id von `hosting` (Gruppenseite, unter dem Namen) notieren; sie steht in der `.npmrc` des Consumers.
8. In der Gruppe `hosting` unter Settings > Packages and registries die Weiterleitung von npm-Anfragen an npmjs.org abschalten. Sonst liefert der Gruppen-Endpunkt ein hier unbekanntes `@hosting/*` von npmjs.org aus, und dort ist der Scope `@hosting` frei. Ist die Einstellung dort gesperrt, muss ein Admin sie unter Admin > Settings > CI/CD > Package Registry abschalten.
9. Prüfen, dass der Runner mit Tag `docker` `KUBERNETES_MEMORY_REQUEST` und `KUBERNETES_MEMORY_LIMIT` überschreiben darf (`allowed_memory_overwrite`), wie beim Frontend.

## Lokal nachspielen

Wie im Workflow auf GitHub:

```bash
npm run build:lib
mkdir -p pack && npm pack ./dist/zenit-ui --pack-destination pack
node tools/check-pack.mjs pack/zenit-hosting-zenit-ui-<version>.tgz
```

Ohne `NPM_PACKAGE_NAME` erwarten `tools/check-pack.mjs` und `tools/check-release.mjs` `@zenit-hosting/zenit-ui`; die GitLab-CI setzt `@hosting/zenit-ui`. Für den GitLab-Weg vor dem Packen `npm pkg set name=@hosting/zenit-ui` in `dist/zenit-ui`; ein erneutes `npm run build:lib` stellt `@zenit-hosting/zenit-ui` wieder her.

Ein Stand, der noch nicht veröffentlicht ist, lässt sich in einer Anwendung unter demselben Alias ausprobieren: `npm i zenit-ui@file:<pfad>/zenit-hosting-zenit-ui-<version>.tgz`. Für Publish und Versionsprüfung eignet sich eine lokale Registry (`npx verdaccio`), nie eine echte.
