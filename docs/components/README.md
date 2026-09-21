# Component usage guides

Hand-written usage documentation for the building blocks of `zenit-ui`. It complements the generated
TypeDoc API under `docs/api`: TypeDoc says what a member is, these pages say when to reach for a
component, what it renders, which states it has and what the caller has to supply.

Each page follows the same order: purpose, when to use and when not to, the import line, the API
table, two to four examples, states, accessibility, responsive behaviour, the rendered CSS classes
and the tokens behind them, documented deviations from the reference stylesheet, and a Do / Don't
list taken from the design-system rules.

The prose is English. The UI copy inside the examples stays German, because it is product copy: the
system's language rules (du-Form, numbers instead of adjectives, normal capitalization) apply to
what a visitor reads, not to this documentation.

## Sources

- The code under `projects/zenit-ui/src/lib`: selectors, inputs with their types and defaults,
  outputs, slots and the JSDoc already in the source.
- The design system: `CLAUDE.md`, the component READMEs under `spec/components`, and the guidelines
  `spec/guidelines/15-zustaende.md` and `10-seitenmuster.md`.
- The demo pages under `projects/ui-demo/src/app/pages`, which is where the examples come from.

## Verification

`node tools/check-docs-examples.mjs` reads every `docs/components/*.md` and checks the examples
against the library source:

- every `z-…` element and every `z…` attribute in an `html` fence is a real selector,
- every binding on such an element is an input, model or output of a class that owns one of those
  selectors, or a native or Angular attribute,
- every identifier imported from `'zenit-ui'` in a `ts` fence is exported from the public API.

It prints a table per file and exits non-zero on any mismatch.

## Actions

| Row in the API table | File                   | Summary                                                    |
| -------------------- | ---------------------- | ---------------------------------------------------------- |
| Button               | [button.md](button.md) | Triggers an action, on a native `<button>` or on an `<a>`. |

## Forms

| Row in the API table | File                       | Summary                                                              |
| -------------------- | -------------------------- | -------------------------------------------------------------------- |
| Field                | [field.md](field.md)       | Wraps a form control: label above, hint or error below.              |
| Input                | [input.md](input.md)       | Styles a native `<input>` or `<textarea>` and wires it to its field. |
| Select               | [select.md](select.md)     | Wraps a native `<select>` so it looks like an input.                 |
| Checkbox             | [checkbox.md](checkbox.md) | Selects entries for a bulk action or confirms a statement.           |
| Toggle               | [toggle.md](toggle.md)     | Switches a setting that takes effect without a save button.          |
| Setting              | [setting.md](setting.md)   | One row of a settings list: title, key and effect, plus the control. |
| Slider               | [slider.md](slider.md)     | Sets an amount on a fixed scale: RAM, slots, storage.                |
| Segment              | [segment.md](segment.md)   | Switches the view on the same data, with at most four options.       |

## Navigation

| Row in the API table | File                             | Summary                                                                    |
| -------------------- | -------------------------------- | -------------------------------------------------------------------------- |
| Tabs                 | [tabs.md](tabs.md)               | Switches between the sub-pages of one area; every tab is a link.           |
| Stepper              | [stepper.md](stepper.md)         | Shows where you are in a flow whose steps follow one another.              |
| Sidebar              | [sidebar.md](sidebar.md)         | Navigation inside a server panel, a select below 900px.                    |
| AppHeader            | [app-header.md](app-header.md)   | Header of the customer area and of the public pages.                       |
| PageHeader           | [page-header.md](page-header.md) | Opens every page of the customer area: title left, actions right.          |
| Footer               | [footer.md](footer.md)           | Closes every page: columns in public, the bottom row in the customer area. |
| Pagination           | [pagination.md](pagination.md)   | Pages through lists with more than 25 entries, as the last row of a panel. |

## Data

| Row in the API table | File                             | Summary                                                                 |
| -------------------- | -------------------------------- | ----------------------------------------------------------------------- |
| Panel                | [panel.md](panel.md)             | Groups data or a tool into one block. The only container with a border. |
| Metric               | [metric.md](metric.md)           | Shows a figure with its unit, optionally with a usage bar.              |
| ServerList           | [server-list.md](server-list.md) | The row pattern for everything the customer owns.                       |
| FileTable            | [file-table.md](file-table.md)   | The table for file managers, invoices, backups and databases.           |

## Status and feedback

| Row in the API table | File                             | Summary                                                          |
| -------------------- | -------------------------------- | ---------------------------------------------------------------- |
| Badge                | [badge.md](badge.md)             | Shows a status or a characteristic in one word.                  |
| Spinner              | [spinner.md](spinner.md)         | Shows that something short is running, as a 16px ring.           |
| Alert                | [alert.md](alert.md)             | A note in the page flow that names a cause and offers an action. |
| EmptyState           | [empty-state.md](empty-state.md) | Fills a list that has no entries yet.                            |
| Skeleton             | [skeleton.md](skeleton.md)       | Holds the space while a list or a metric loads.                  |
| Toast                | [toast.md](toast.md)             | Confirms that something happened and disappears by itself.       |

## Overlays

| Row in the API table | File                     | Summary                                                               |
| -------------------- | ------------------------ | --------------------------------------------------------------------- |
| Dialog               | [dialog.md](dialog.md)   | Interrupts for a decision that cannot be undone, or for a short form. |
| Menu                 | [menu.md](menu.md)       | Collects the rarer actions of an object behind a button.              |
| Tooltip              | [tooltip.md](tooltip.md) | A short addition to a control, shown on hover and on focus.           |

## Tools

| Row in the API table | File                     | Summary                                                      |
| -------------------- | ------------------------ | ------------------------------------------------------------ |
| Icon                 | [icon.md](icon.md)       | Renders one Material Icons ligature at the system icon size. |
| Console              | [console.md](console.md) | Shows the live log of a server and takes commands.           |

## Public pages

| Row in the API table | File                                 | Summary                                                           |
| -------------------- | ------------------------------------ | ----------------------------------------------------------------- |
| Hero                 | [hero.md](hero.md)                   | Opens a public page: one statement, one sentence, two buttons.    |
| GameTile             | [game-tile.md](game-tile.md)         | Selects a game in the price calculator.                           |
| PriceSummary         | [price-summary.md](price-summary.md) | The result of the price calculator, with the only primary button. |
| SpecList             | [spec-list.md](spec-list.md)         | Facts as term and value pairs.                                    |
| Faq                  | [faq.md](faq.md)                     | One question with its answer, as a native disclosure.             |

## Configurator

| Row in the API table | File                                   | Summary                                                             |
| -------------------- | -------------------------------------- | ------------------------------------------------------------------- |
| OptionCard           | [option-group.md](option-group.md)     | Picks one of a few options that are meant to be compared.           |
| Combobox             | [combobox.md](combobox.md)             | Picks one value out of a long list by typing and filtering.         |
| Wizard               | [wizard.md](wizard.md)                 | Leads through an order in two to four steps, summary beside it.     |
| StickyBar            | [sticky-bar.md](sticky-bar.md)         | Keeps price and next step in view at the bottom of small screens.   |
| IncludedList         | [included-list.md](included-list.md)   | Lists what every plan includes without a surcharge.                 |
| Disclosure           | [disclosure.md](disclosure.md)         | Folds away settings most visitors do not need.                      |
| InputAction          | [input-action.md](input-action.md)     | A field with a button that checks or applies the value right away.  |
| CostChart            | [cost-chart.md](cost-chart.md)         | Shows how flex costs grow and where the cap takes over.             |

All 44 rows of the API table in `spec/guidelines/40-bibliothek.md` are covered, Icon, Spinner and
Tooltip among them.
