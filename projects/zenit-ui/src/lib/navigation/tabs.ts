import { booleanAttribute, Directive, input } from '@angular/core';

/** Leiste mit Tabs. Enthaelt Links, mobil scrollt sie waagerecht. */
@Directive({
  selector: 'nav[zTabs]',
  host: { 'class': 'z-tabs' },
})
export class ZTabs {}

/**
 * Ein Tab als Link. `active` setzt `aria-current="page"` und damit die
 * 2px-Linie. Die Library kennt den Router nicht: welcher Tab aktiv ist,
 * entscheidet der Aufrufer.
 */
@Directive({
  selector: 'a[zTab]',
  host: {
    'class': 'z-tab',
    '[attr.aria-current]': `active() ? "page" : null`,
  },
})
export class ZTab {
  readonly active = input(false, { transform: booleanAttribute });
}
