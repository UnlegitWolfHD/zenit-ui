/*
 * The stylesheet and the markup of a page that has not been migrated, as plain
 * strings without any import: the demo page /muster/legacy renders them inside
 * `.z-legacy`, and e2e/legacy.spec.ts loads the very same two strings into a
 * bare document without zenit-ui to measure what they look like on their own.
 *
 * The literal px, rem and hex values are the point: this is what an old
 * application brings along, not part of the design system.
 *
 * Every element rule weighs (0,0,1), like `a { … }` in an old global
 * stylesheet. `:where(.demo-alt)` only keeps the rules off the demo shell and
 * adds nothing. A class or a component scope would weigh (0,1,1), beat the base
 * rules of the library on its own and prove nothing about `.z-legacy`.
 *
 * `.demo-alt` is what the old `body` rule said. In the bare document the class
 * sits on `<body>`, in the demo on the `.z-legacy` host: the library cannot
 * know these values, so the application restates them there (docs/legacy.md).
 *
 * h2 and p carry no line height on purpose. They inherit it, which is where
 * the 20px of `body.z-root` used to arrive: 27.2px of type on a 20px line.
 */
export const ALTLAST_CSS = `
.demo-alt { font-family: Georgia, 'Times New Roman', serif; color: #1f2328; background: #fafafa; color-scheme: normal; }
:where(.demo-alt) { --alt-1: 0.5rem; --alt-2: 1rem; --alt-3: 1.5rem; }
:where(.demo-alt) h1 { margin: 0 0 var(--alt-2); font-size: 1.75rem; line-height: 1.15; }
:where(.demo-alt) h2 { margin: var(--alt-3) 0 var(--alt-1); font-size: 1.7rem; }
:where(.demo-alt) h3 { margin: var(--alt-2) 0 var(--alt-1); font-size: 1.25rem; line-height: 24px; }
:where(.demo-alt) p { margin: 0 0 var(--alt-2); }
:where(.demo-alt) a { color: #0b57d0; text-decoration: underline; }
:where(.demo-alt) a:hover { color: #7a1fa2; }
:where(.demo-alt) button { padding: var(--alt-1) var(--alt-2); border: 1px solid #6b7280; border-radius: 4px; background: #ffffff; color: #1f2328; font-size: 0.875rem; }
:where(.demo-alt) input { width: 12rem; padding: var(--alt-1); border: 1px solid #6b7280; font-size: 1rem; }
:where(.demo-alt) input:focus { outline: 2px solid #0b57d0; }
`;

export const ALTLAST_HTML = `
<h1 data-alt="h1">Rechnungen aus dem alten Kundenbereich</h1>
<h2 data-alt="h2">Offene Posten und bezahlte Rechnungen der letzten zwölf Monate</h2>
<p data-alt="p">
  Diese Seite ist noch nicht umgezogen. Sie bringt ihre eigenen Regeln für Überschriften, Links
  und Felder mit. <a data-alt="a" href="/muster/legacy">Rechnung 2026-0917 öffnen</a>
</p>
<h3 data-alt="h3">Rechnung suchen</h3>
<p>
  <label for="alt-suche">Rechnungsnummer</label>
  <input data-alt="input" id="alt-suche" type="text" />
  <button data-alt="button" type="button">Suchen</button>
</p>
`;
