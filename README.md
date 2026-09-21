# zenit-ui-workspace

Angular workspace for the Zenit design system. It holds the library `zenit-ui` with every building block of the website, the customer area and the server panels, plus a demo application that shows each building block in all of its states. The workspace is independent of the existing Zenit-Hosting frontend and contains no business logic, no API calls and no real customer data.

## Folders

| Folder | Contents |
| --- | --- |
| `projects/zenit-ui` | the library: building blocks in `src/lib`, tokens and styles in `src/styles` |
| `projects/ui-demo` | demo application, one page per package, each building block in all states |
| `e2e/` | Playwright: screenshots at 1440px and 375px, axe checks per demo page |
| `spec/` | the design system as the specification: tokens, component READMEs, previews, guidelines |
| `docs/pakete.md` | cut of the work packages, decisions and acceptance points |
| `docs/api/` | generated TypeDoc reference, not committed |

`CLAUDE.md` in the root is the overview of the system: principles, language, color, typography, form, motion and the list of banned constructs. It applies to every change. The design system under `spec/`, `CLAUDE.md` and `docs/pakete.md` are written in German; everything else, including the generated API documentation and the JSDoc in the source, is English. UI copy inside code examples stays German, because German is the product's language.

## Commands

```bash
npm run build         # ng build zenit-ui and ng build ui-demo
ng build zenit-ui     # only the library, output in dist/zenit-ui
ng test zenit-ui      # unit tests of the library
npm run lint          # ESLint over library and demo
npm run lint:css      # Stylelint over projects/**/*.css
npm run e2e           # Playwright with axe over the demo pages
npm run docs:api      # TypeDoc reference into docs/api
npm run check         # lint, lint:css, both builds and the unit tests in one run
ng serve ui-demo      # demo app at http://localhost:4200/
```

## Package zenit-ui

How to pull the library into an application is described in `projects/zenit-ui/README.md`: requirements, installation from the locally built `.tgz`, style order, `z-root`, fonts, toast outlet, Minecraft subtheme, the full component API and the documented deviations from the reference styles. That README ships with the package.

## Further reading

- `projects/zenit-ui/README.md` — using the library
- `CHANGELOG.md` — what changed per version
- `CONTRIBUTING.md` — commands, rules, how to add a building block, review checklist

## Release

No push, no publish and no deploy without the owner's approval. `npm pack` in `dist/zenit-ui` is a local dry run only; the library is not published to npm.
