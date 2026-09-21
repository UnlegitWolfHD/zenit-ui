import {
  afterRenderEffect,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  contentChildren,
  ElementRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { ZSelect } from '../field';
import { ZIcon } from '../icon';

/**
 * One entry of the sidebar, a Material Icon plus a noun. Sits on a `<button>`
 * or on an `<a>` through the attribute `zSidebarItem`, so links keep their
 * `href` and their routing.
 *
 * Renders the class `z-side__item` on the host and inside it the optional
 * `z-icon`, the projected text and, when {@link count} is not `null`, a
 * `span.z-side__count`.
 *
 * Accessibility: the active entry carries `aria-current="page"` and is the only
 * one whose icon is coloured; the active surface is `surface-hover`, never a
 * green or red fill.
 *
 * @example
 * ```html
 * <a zSidebarItem icon="dashboard" routerLink="/server/1" [active]="true">Übersicht</a>
 * <a zSidebarItem icon="report" routerLink="/server/1/abstuerze" [count]="3">Abstürze</a>
 * ```
 */
@Component({
  // The API table prescribes the selector `[zSidebarItem]` without an element:
  // the entry is a `<button>` or an `<a>`. Icon and counter need a template,
  // hence a component instead of a directive.
  selector: '[zSidebarItem]',
  imports: [ZIcon],
  // No whitespace between the parts: .z-side__item is flex with gap, so every
  // text node would otherwise be an item of its own in the row.
  template: `@if (icon()) {
      <z-icon [name]="icon()" />
    }
    <ng-content />
    @if (count() !== null) {
      <span class="z-side__count">{{ count() }}</span>
    }`,
  host: {
    class: 'z-side__item',
    '[attr.aria-current]': `active() ? "page" : null`,
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZSidebarItem {
  /**
   * Name of the Material Icon in front of the text. Empty renders no icon.
   *
   * @default ''
   */
  readonly icon = input('');

  /**
   * Marks the entry as the current page: `aria-current="page"`, coloured icon,
   * `surface-hover` behind it. At most one entry per sidebar. Boolean
   * attribute.
   *
   * @default false
   */
  readonly active = input(false, { transform: booleanAttribute });

  /**
   * Counter at the right edge of the entry, for example the number of crashes.
   * `null` renders nothing, `0` renders the digit.
   *
   * @default null
   */
  readonly count = input<number | null>(null);

  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);

  /**
   * Visible text without icon and counter, for the select below 900px. Only
   * the projected text nodes are read; if the label sits inside an element, the
   * result stays empty.
   *
   * @internal Read by `ZSidebar` to mirror the entries; not part of the
   * documented API.
   */
  beschriftung(): string {
    return Array.from(this.el.nativeElement.childNodes)
      .filter((knoten) => knoten.nodeType === Node.TEXT_NODE)
      .map((knoten) => knoten.textContent ?? '')
      .join('')
      .trim();
  }

  /**
   * Triggers the entry when it is picked in the select below 900px, by
   * clicking the host element, so a `routerLink` or a click handler on it runs
   * as if the user had hit the entry itself.
   *
   * @internal Called by `ZSidebar`; not part of the documented API.
   */
  klicke(): void {
    this.el.nativeElement.click();
  }
}

/**
 * Group of sidebar entries with one word as its heading. At most four groups
 * per sidebar.
 *
 * Renders the class `z-side__group` on the host, inside it the optional
 * `span.z-side__label` and the projected entries. The first group normally has
 * no label. Groups disappear in the select below 900px, so a group heading
 * must never carry meaning the entries do not.
 *
 * @example
 * ```html
 * <z-sidebar-group label="Betrieb">
 *   <a zSidebarItem icon="backup" routerLink="/server/1/backups">Backups</a>
 * </z-sidebar-group>
 * ```
 */
@Component({
  selector: 'z-sidebar-group',
  template: `@if (label()) {
      <span class="z-side__label">{{ label() }}</span>
    }
    <ng-content />`,
  host: { class: 'z-side__group' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZSidebarGroup {
  /**
   * Heading of the group, one word in normal capitalization. Empty renders no
   * heading, which is how the first group usually stands.
   *
   * @default ''
   */
  readonly label = input('');
}

/**
 * Navigation inside a server panel: at most four groups with 12 to 14 entries
 * together.
 *
 * Renders `nav.z-side` with the projected groups and entries, and next to it a
 * `z-select` holding a native `<select>`. The stylesheet shows exactly one of
 * the two: above 900px the list, below it the select over the content. The
 * select mirrors the same entries, one `<option>` per `[zSidebarItem]` in
 * document order, and on a change it triggers the click of the chosen entry,
 * so routing works the same in both. The groups fall away in the select, which
 * is why a group heading must not be the only carrier of a fact.
 *
 * Accessibility: {@link ariaLabel} names both the `nav` and the select, so the
 * navigation is announced with a name at either width. The entry labels are
 * projected text and can only be read after rendering, so they are collected in
 * an `afterRenderEffect`.
 *
 * @example
 * ```html
 * <z-sidebar ariaLabel="Server-Navigation">
 *   <z-sidebar-group>
 *     <a zSidebarItem icon="dashboard" routerLink="/server/1" [active]="true">Übersicht</a>
 *   </z-sidebar-group>
 *   <z-sidebar-group label="Spiel">
 *     <a zSidebarItem icon="group" routerLink="/server/1/spieler">Spieler</a>
 *   </z-sidebar-group>
 * </z-sidebar>
 * ```
 */
@Component({
  selector: 'z-sidebar',
  imports: [ZSelect],
  template: `
    <nav class="z-side" [attr.aria-label]="ariaLabel() || null"><ng-content /></nav>
    <z-select>
      <select [attr.aria-label]="ariaLabel() || null" (change)="waehle($event)">
        @for (eintrag of eintraege(); track eintrag; let i = $index) {
          <option [selected]="eintrag.active()">{{ beschriftungen()[i] }}</option>
        }
      </select>
    </z-select>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZSidebar {
  /**
   * `aria-label` of the navigation, written onto the `nav` as well as onto the
   * select, for example "Server-Navigation". Empty writes no attribute.
   *
   * @default ''
   */
  readonly ariaLabel = input('');

  protected readonly eintraege = contentChildren(ZSidebarItem, { descendants: true });
  protected readonly beschriftungen = signal<string[]>([]);

  constructor() {
    // The labels are projected text in the DOM and can only be read after
    // rendering, hence the detour through a signal.
    afterRenderEffect(() => {
      this.beschriftungen.set(this.eintraege().map((eintrag) => eintrag.beschriftung()));
    });
  }

  protected waehle(ereignis: Event): void {
    const ziel = ereignis.target as HTMLSelectElement;
    this.eintraege()[ziel.selectedIndex]?.klicke();
  }
}
