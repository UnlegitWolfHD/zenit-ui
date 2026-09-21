import { CdkMenu, CdkMenuItem } from '@angular/cdk/menu';
import {
  afterEveryRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
} from '@angular/core';
import { ZIcon } from '../icon';

/**
 * Surface of the menu, which collects the rarer actions of an object behind a
 * button. Three to seven entries; destructive ones sit at the bottom behind a
 * separator.
 *
 * Renders the class `z-menu` on the host and only the projected content.
 * Keyboard handling, roles and closing come from `CdkMenu` in
 * `@angular/cdk/menu`, which runs as a host directive: arrow keys move through
 * the entries, a click outside and Escape close the menu. The surface is
 * `surface-raised` with `shadow-overlay` and no scrim. The menu is opened from
 * a button carrying `[cdkMenuTriggerFor]`.
 *
 * @example
 * ```html
 * <button zBtn="ghost" iconOnly aria-label="Mehr" [cdkMenuTriggerFor]="mehr">
 *   <z-icon name="more_vert" />
 * </button>
 * <ng-template #mehr>
 *   <z-menu>
 *     <button zMenuItem icon="content_copy" (triggered)="kopiere()">Adresse kopieren</button>
 *     <z-menu-separator />
 *     <button zMenuItem icon="delete" danger (triggered)="loesche()">Server löschen</button>
 *   </z-menu>
 * </ng-template>
 * ```
 */
@Component({
  selector: 'z-menu',
  template: `<ng-content />`,
  host: { 'class': 'z-menu' },
  hostDirectives: [CdkMenu],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZMenu {}

/**
 * One entry of the menu, an icon plus a verb and its object ("Adresse
 * kopieren"). Sits on a `<button>` through the attribute `zMenuItem`.
 *
 * Renders the class `z-menu__item` on the host, plus `z-menu__item--danger`
 * while {@link danger} is set, and inside it the optional `z-icon` followed by
 * the projected text.
 *
 * Accessibility: role, focus and the `disabled` input come from `CdkMenuItem`
 * as a host directive, which also provides the `(triggered)` output. The CDK
 * typeahead label is set to the text without the icon ligature after every
 * render, because the raw `textContent` would otherwise start with the
 * ligature ("content_copyAdresse kopieren") and typing the first letter would
 * not find the entry.
 *
 * @example
 * ```html
 * <button zMenuItem icon="content_copy" (triggered)="kopiere()">Adresse kopieren</button>
 * <button zMenuItem icon="delete" danger [disabled]="laeuft()" (triggered)="loesche()">
 *   Server löschen
 * </button>
 * ```
 */
@Component({
  // The API table says the entry is a button with an attribute selector.
  selector: 'button[zMenuItem]',
  imports: [ZIcon],
  template: `@if (icon()) {<z-icon [name]="icon()" />}<ng-content />`,
  host: {
    'class': 'z-menu__item',
    '[class.z-menu__item--danger]': `danger()`,
  },
  hostDirectives: [
    {
      directive: CdkMenuItem,
      inputs: ['cdkMenuItemDisabled: disabled'],
      outputs: ['cdkMenuItemTriggered: triggered'],
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZMenuItem {
  /**
   * Name of the Material Icon in front of the text. Empty renders no icon.
   *
   * @default ''
   */
  readonly icon = input('');

  /**
   * Marks the entry as destructive, which colours it and belongs below a
   * `z-menu-separator`. A destructive entry always opens a dialog. Boolean
   * attribute.
   *
   * @default false
   */
  readonly danger = input(false, { transform: booleanAttribute });

  constructor() {
    const eintrag = inject(CdkMenuItem);
    const wirt = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    // Without this the CDK typeahead takes textContent, which starts with the
    // ligature of the icon ("content_copyAdresse kopieren"). The text can
    // change at any time, hence after every render.
    afterEveryRender({ read: () => (eintrag.typeaheadLabel = beschriftung(wirt)) });
  }
}

/**
 * Text of the entry without the ligature of the icon. Comment nodes are left
 * out, because Angular puts its anchors there and `textContent` would deliver
 * their content along with it ("container").
 */
function beschriftung(wirt: HTMLElement): string {
  return Array.from(wirt.childNodes)
    .filter(
      (knoten) =>
        knoten.nodeType !== Node.COMMENT_NODE && (knoten as Element).localName !== 'z-icon',
    )
    .map((knoten) => knoten.textContent ?? '')
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Separator in front of the destructive entries. Renders an empty host with
 * the class `z-menu__sep` and `role="separator"`, so it is announced as a
 * divider and never receives focus.
 *
 * @example
 * ```html
 * <z-menu-separator />
 * ```
 */
@Component({
  selector: 'z-menu-separator',
  template: ``,
  host: {
    'class': 'z-menu__sep',
    'role': 'separator',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZMenuSeparator {}

/**
 * All menu building blocks at once, for the `imports` of a component. The
 * trigger `CdkMenuTrigger` is not part of it and comes from
 * `@angular/cdk/menu`.
 *
 * @example
 * ```ts
 * imports: [Z_MENU, CdkMenuTrigger];
 * ```
 */
export const Z_MENU = [ZMenu, ZMenuItem, ZMenuSeparator];
