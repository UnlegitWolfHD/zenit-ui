# Alert

A note in the page flow that names a cause and offers an action.

## When to use

- Above the content, for something the customer should know or act on: a change that needs a
  restart, a failed installation, a list that could not be loaded.
- At most one per page. Several messages are summarised into one.

## When not to use

- For a short confirmation that something happened. That is a toast.
- For a list that is simply empty. That is `z-empty-state`; missing data caused by an error is an
  alert.

## Import

```ts
import { ZAlert, ZAlertAction } from 'zenit-ui';
```

## API

### `z-alert`

| Input    | Type                                                        | Default     | Description                                                                         |
| -------- | ----------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------- |
| `status` | `'neutral' \| 'info' \| 'success' \| 'warning' \| 'danger'` | `'neutral'` | Colour of the alert. `neutral` renders without a modifier class.                    |
| `title`  | `string`                                                    | `''`        | Title as a full sentence. Empty means no title line.                                |
| `icon`   | `string`                                                    | `''`        | Material Icons ligature, for example `error` or `restart_alt`. Empty means no icon. |

No outputs. Content projection:

| Slot             | Where it lands                               |
| ---------------- | -------------------------------------------- |
| default          | in `span.z-alert__body`, the detail sentence |
| `[zAlertAction]` | after the text, the single button            |

### `[zAlertAction]`

Marker directive for the one action: one button, secondary and `size="sm"`. It adds no markup and
no classes of its own.

An alert has at most one button (`spec/components/Alert/README.md`). When a situation offers two
ways out, the second one is a link in the text: "Der Server wurde erstattet. Du kannst ihn neu
bestellen oder den <a href="/support">Support</a> kontaktieren." with the button "Neu bestellen".
The link takes the running-text underline of the library and the colour `text`, so it is visible as
a link without a second button (see "Links in an alert" under Accessibility).

The exported type `ZAlertStatus` is available for typing your own status field.

## Examples

A failed installation, with the cause and the next step:

```html
<z-alert status="danger" title="Installation fehlgeschlagen" icon="error">
  SteamCMD hat nach 120 Sekunden nicht geantwortet. Starte die Installation erneut.
  <button zAlertAction zBtn="secondary" size="sm" type="button">Erneut installieren</button>
</z-alert>
```

Changes that need a restart:

```html
<z-alert status="warning" title="2 Änderungen greifen erst nach einem Neustart" icon="restart_alt">
  PvP und maximale Spieler.
  <button zAlertAction zBtn="secondary" size="sm" type="button">Jetzt neu starten</button>
</z-alert>
```

A hint and a finished operation, both without an action:

```html
<z-alert status="info" title="Dein Guthaben reicht noch für 12 Tage." icon="info" />
<z-alert status="success" title="Backup wiederhergestellt." icon="check_circle">
  Die Welt vom 17.09.2026, 03:00 ist aktiv.
</z-alert>
```

Neutral, as a plain note inside a panel:

```html
<z-panel title="Zeitplan">
  <z-alert title="Kein Zeitplan aktiv.">
    Lege einen Neustart an, damit der Server nachts freien Speicher bekommt.
  </z-alert>
</z-panel>
```

## States

| State   | How it looks                           | How to trigger it  |
| ------- | -------------------------------------- | ------------------ |
| Neutral | `surface-raised`, icon in `text-muted` | `status="neutral"` |
| Info    | `info-subtle`, icon in `info`          | `status="info"`    |
| Success | `success-subtle`, icon in `success`    | `status="success"` |
| Warning | `warning-subtle`, icon in `warning`    | `status="warning"` |
| Danger  | `danger-subtle`, icon in `danger`      | `status="danger"`  |

The alert itself has no hover, focus or disabled state; the button inside it does.

## Accessibility

- An alert is static page content and not a live region. It gets no `role="alert"`: what arrives
  while the page is being read is announced by a toast instead.
- The colour lies on the surface and the icon only. The title says in words what the state is.
- The icon is decorative and `aria-hidden`; the title carries the meaning.
- The native `title` attribute is suppressed on the host, so the browser shows no tooltip of its own
  because of the `title` input.
- Error texts say what happened and what the customer can do. No apologies, no "Ups".

### Links in an alert

A link in the text of an alert is `text` with the running-text underline, in every status, not
`accent-text`. On the tints `accent-text` misses 4.5:1 in the normative `dark` scheme, and a
translucent tint gets darker the lighter the ground below it is. Measured link against its alert
(`tools/check-theme-contrast.mjs`, every scheme and accent; the table shows `dark` with `rot`, the
lowest of the four accents there):

| Status  | on `bg` before / after | on `surface` before / after | on `surface-raised` before / after |
| ------- | ---------------------- | --------------------------- | ---------------------------------- |
| neutral | 4.97 / 16.26           | 4.97 / 16.26                | 4.97 / 16.26                       |
| info    | 4.74 / 15.49           | **4.38** / 14.31            | **4.04** / 13.22                   |
| success | 4.88 / 15.94           | 4.53 / 14.81                | **4.20** / 13.74                   |
| warning | 4.72 / 15.45           | **4.37** / 14.28            | **4.04** / 13.20                   |
| danger  | 4.90 / 16.02           | 4.56 / 14.90                | **4.23** / 13.85                   |

`light` and `contrast` passed before as well (lowest 6.61 and 4.53) and reach 14.77 and 12.36 now.
A neutral alert paints `surface-raised` itself, so its ground does not matter. Hover and visited
keep the same colour; hover changes nothing but the underline, which is already there at rest.

Why `text` and not a lighter red: `tokens.css` is normative and has no second red, and a red that
passes on every tint in `dark` would be a new token in `tokens.json`. Why not only on the failing
tints: a link that is red in one alert and white in the next is the harder rule to read, and the one
button of an alert is secondary, not red, as well. The link is still told apart from the
`text-muted` body by colour and by the underline, so WCAG 1.4.1 holds without the hue.

`/rueckmeldung` shows the 15 cases side by side, and `e2e/themes.spec.ts` ("Links im Alert") runs
axe over each of them in every scheme and accent. Links outside an alert are unchanged.

## Responsive

Below 640px the alert wraps and the button moves under the text, indented by 32px so it sits under
the text and not under the icon.

## Rendered classes and tokens

| Class              | Applies when         |
| ------------------ | -------------------- |
| `z-alert`          | on the host, always  |
| `z-alert--info`    | `status="info"`      |
| `z-alert--success` | `status="success"`   |
| `z-alert--warning` | `status="warning"`   |
| `z-alert--danger`  | `status="danger"`    |
| `z-alert__text`    | always               |
| `z-alert__title`   | `title` is not empty |
| `z-alert__body`    | always               |

Tokens: `--space-3` and `--space-4` for padding and gap, `--radius-md`, `--surface-raised` for the
neutral surface, `--info-subtle`/`--info`, `--success-subtle`/`--success`,
`--warning-subtle`/`--warning`, `--danger-subtle`/`--danger` for the four states, `--text-muted`
for the body text.

## Deviations from the reference

Addition to the reference: below 640px the button gets `flex-basis: 100%`, because only then does it
wrap under the text as the design-system README requires. The 32px indent puts it below the text,
not below the icon.

## Do / Don't

- Do write the title as a full sentence that names the cause.
- Do give the alert exactly one secondary button in `size="sm"`.
- Do keep it to one alert per page, above the content.
- Don't use an alert for a short confirmation; that is a toast.
- Don't add a coloured stripe on the left or a border; the colour is the surface and the icon.
- Don't use red for a brand accent here; `danger` is deliberately lighter and more orange than
  `accent-text`.
