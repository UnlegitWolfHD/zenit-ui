import { CdkMenu, CdkMenuItem } from '@angular/cdk/menu';
import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  DOCUMENT,
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
 * A scroll anywhere under the open menu closes it, the way a menu of the
 * operating system goes: in the page as well as in an inner container such as
 * the body of a scrolling dialog. Focus returns to the trigger only when it was
 * inside the menu, so scrolling with the pointer does not pull it away from
 * whatever the visitor was typing in.
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
  host: { class: 'z-menu' },
  hostDirectives: [CdkMenu],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZMenu {
  constructor() {
    const menue = inject(CdkMenu);
    const wirt = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const dokument = inject(DOCUMENT);
    // The component only exists while the menu hangs in its overlay, so the
    // listener does too. It sits on the document in the CAPTURE phase, because
    // a scroll event on an inner element does not bubble: the scroll strategy
    // of the CDK builds on `ScrollDispatcher`, which only ever hears the window
    // and the containers a caller marked `cdkScrollable`. A menu in the body of
    // a dialog therefore used to stand still while its trigger moved away.
    const abbruch = new AbortController();
    // A scroll that happened before the menu went up must not close it again:
    // the browser scrolls a trigger into view as it is focused, and that event
    // only arrives afterwards.
    const seit = dokument.defaultView?.performance.now() ?? 0;
    dokument.addEventListener(
      'scroll',
      (ereignis) => {
        const ziel = ereignis.target as Node | null;
        // A scroll inside the menu itself is not a scroll under it.
        if (ereignis.timeStamp < seit || (ziel && wirt.contains(ziel))) {
          return;
        }
        menue.menuStack.closeAll({ focusParentTrigger: wirt.contains(dokument.activeElement) });
      },
      { capture: true, passive: true, signal: abbruch.signal },
    );

    // Space activates an entry (ARIA menu pattern), but the browser clicks only
    // buttons: on a link `CdkMenuItem` would close the menu without anything
    // ever navigating. This listener hangs on the menu in the CAPTURE phase, so
    // it comes before the keydown handler on the entry, and turns the key into
    // the click that `href` and `routerLink` both listen for. Enter needs
    // nothing: the browser clicks a link by itself.
    wirt.addEventListener(
      'keydown',
      (ereignis) => {
        const ziel = (ereignis.target as HTMLElement | null)?.closest('a.z-menu__item');
        if (ereignis.key !== ' ' || !ziel || mitZusatztaste(ereignis)) {
          return;
        }
        ereignis.preventDefault();
        ereignis.stopPropagation();
        (ziel as HTMLElement).click();
      },
      { capture: true, signal: abbruch.signal },
    );

    inject(DestroyRef).onDestroy(() => abbruch.abort());
  }
}

/**
 * One entry of the menu, an icon plus a verb and its object ("Adresse
 * kopieren"). Sits on a `<button>` through the attribute `zMenuItem`, or on an
 * `<a>` when the entry leads somewhere instead of doing something.
 *
 * Renders the class `z-menu__item` on the host, plus `z-menu__item--danger`
 * while {@link danger} is set, and inside it the optional `z-icon` followed by
 * the projected text.
 *
 * A link entry keeps its `href` or `routerLink`: the library has no router and
 * touches neither. Enter and a click follow the link and close the menu, Space
 * does the same because `z-menu` turns it into a click, and a middle click or
 * Ctrl+click opens a new tab without closing the menu. `disabled` is
 * `aria-disabled="true"` on a link with its click swallowed, the same way
 * `a[zBtn]` is locked.
 *
 * Accessibility: role, focus and the `disabled` input come from `CdkMenuItem`
 * as a host directive, which also provides the `(triggered)` output. The CDK
 * typeahead label is set to the text without the icon ligature, once after the
 * first render and from then on whenever a `MutationObserver` reports a change
 * in the entry, because the raw `textContent` would otherwise start with the
 * ligature ("content_copyAdresse kopieren") and typing the first letter would
 * not find the entry.
 *
 * @example
 * ```html
 * <button zMenuItem icon="content_copy" (triggered)="kopiere()">Adresse kopieren</button>
 * <a zMenuItem icon="dns" routerLink="/user/server/1">Server öffnen</a>
 * <button zMenuItem icon="delete" danger [disabled]="laeuft()" (triggered)="loesche()">
 *   Server löschen
 * </button>
 * ```
 */
@Component({
  // An entry does something (button) or leads somewhere (link); both carry the
  // attribute of the API table.
  selector: 'button[zMenuItem], a[zMenuItem]',
  imports: [ZIcon],
  template: `@if (icon()) {
      <z-icon [name]="icon()" />
    }
    <ng-content />`,
  host: {
    class: 'z-menu__item',
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
    const zerstoerung = inject(DestroyRef);
    // Without this the CDK typeahead takes textContent, which starts with the
    // ligature of the icon ("content_copyAdresse kopieren"). The text can
    // change at any time, but only through the DOM, so a MutationObserver
    // carries the change instead of a callback that reads the entry again after
    // every render of the application.
    afterNextRender(() => {
      const lies = (): void => {
        eintrag.typeaheadLabel = beschriftung(wirt);
      };
      lies();
      const beobachter = new MutationObserver(lies);
      beobachter.observe(wirt, { characterData: true, childList: true, subtree: true });
      zerstoerung.onDestroy(() => beobachter.disconnect());
    });
  }
}

/**
 * A key pressed together with a modifier belongs to the browser: Ctrl+Space and
 * the like are not an activation of the entry.
 */
function mitZusatztaste(ereignis: KeyboardEvent): boolean {
  return ereignis.altKey || ereignis.ctrlKey || ereignis.metaKey || ereignis.shiftKey;
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
    class: 'z-menu__sep',
    role: 'separator',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZMenuSeparator {}

/**
 * All menu building blocks at once, for the `imports` of a component: the
 * design system names this constant as the way in ("Import über `Z_MENU`"), so
 * it stays the documented entry point next to the three classes. The trigger
 * `CdkMenuTrigger` is not part of it and comes from `@angular/cdk/menu`.
 *
 * @example
 * ```ts
 * imports: [Z_MENU, CdkMenuTrigger];
 * ```
 */
export const Z_MENU = [ZMenu, ZMenuItem, ZMenuSeparator] as const;
