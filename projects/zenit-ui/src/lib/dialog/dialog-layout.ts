import { InteractivityChecker } from '@angular/cdk/a11y';
import { CdkScrollable } from '@angular/cdk/scrolling';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  contentChild,
  DestroyRef,
  Directive,
  DOCUMENT,
  ElementRef,
  inject,
  InjectionToken,
  input,
  signal,
  viewChild,
} from '@angular/core';

/**
 * Carries the id of a dialog heading down to `ZDialogLayout`. `ZDialog.open()`
 * generates the id, provides it under this token and puts the same id on the
 * CDK container as `aria-labelledby`, which is what gives the dialog its
 * accessible name.
 *
 * @internal Exported so that `dialog.ts` can provide it; not part of the
 * documented API.
 */
export const Z_DIALOG_TITLE_ID = new InjectionToken<string>('Z_DIALOG_TITLE_ID');

let laufendeNummer = 0;

/**
 * Returns `<prefix>-<n>` with `n` counting up once per call, used for the ids
 * of a dialog heading and of the confirmation field.
 *
 * @param praefix Prefix of the id, for example `z-dialog-title`.
 * @returns The prefix followed by a dash and a number unique in this document.
 * @internal Exported for use inside the dialog package only.
 */
export function naechsteId(praefix: string): string {
  return `${praefix}-${++laufendeNummer}`;
}

/**
 * Marks the buttons in the footer of a dialog. Pure slot marker, it adds no
 * class and no markup. Without it `z-dialog` renders no footer at all.
 *
 * @example
 * ```html
 * <ng-container zDialogActions>
 *   <button zBtn="ghost" (click)="ref.close(false)">Abbrechen</button>
 *   <button zBtn="primary" (click)="ref.close(true)">Speichern</button>
 * </ng-container>
 * ```
 */
@Directive({ selector: '[zDialogActions]' })
export class ZDialogActions {}

/**
 * Switched off by something around the control, which the checker of the CDK
 * does not read: it only knows the `disabled` of the control itself. `:disabled`
 * covers a disabled `fieldset` the way the HTML standard defines it, including
 * the exception that the controls in its first `<legend>` stay operable, and the
 * `closest` behind it catches the browsers that do not.
 */
function ausserBetrieb(element: HTMLElement): boolean {
  if (element.closest('[inert]')) {
    return true;
  }
  if (element.matches(':disabled')) {
    return true;
  }
  return (
    !!element.closest('fieldset:disabled') &&
    !element.closest('fieldset:disabled > legend:first-of-type')
  );
}

/**
 * Everything that could be a tab stop. Whether it really is one is decided by
 * `InteractivityChecker`, which knows the dozen reasons why it might not be.
 */
const KANDIDATEN = 'a[href], button, input, select, textarea, [tabindex], [contenteditable]';

/**
 * Layout of a dialog: header with the heading, body, footer with the actions.
 * Use it as the root element of the component handed to `ZDialog.open()`.
 *
 * Renders `.z-dialog__header` with `<h2 class="z-dialog__title">`,
 * `.z-dialog__body` with the projected content and, only when a
 * `[zDialogActions]` element is present, `.z-dialog__footer`. The host carries
 * `z-dialog` and its native `title` attribute is cleared, so the {@link title}
 * input never becomes a browser tooltip.
 *
 * Opened through `ZDialog`, the dialog is limited to the height of the screen
 * and the body is the part that scrolls: heading and actions stay in place, and
 * a body that scrolls without holding a tabbable element becomes a tab stop of
 * its own, a `role="group"` named by the heading. Both are watched while the
 * dialog stands, so a body that only grows later gets its stop as well.
 *
 * Accessibility: `role="dialog"`, `aria-modal`, the focus trap, Escape and
 * returning focus to the trigger all come from the container of
 * `@angular/cdk/dialog`. This component only supplies the heading and the id
 * that the container's `aria-labelledby` points at.
 *
 * @example
 * ```html
 * <z-dialog title="Notiz zu Beispiel-Server 1">
 *   <z-field label="Notiz" for="notiz">
 *     <textarea zInput id="notiz"></textarea>
 *   </z-field>
 *   <ng-container zDialogActions>
 *     <button zBtn="ghost" (click)="ref.close()">Abbrechen</button>
 *     <button zBtn="primary" (click)="ref.close(true)">Speichern</button>
 *   </ng-container>
 * </z-dialog>
 * ```
 */
@Component({
  selector: 'z-dialog',
  // CdkScrollable registers the body with the ScrollDispatcher of the CDK, so
  // an overlay anchored inside it, a menu or a tooltip, follows its trigger
  // while the body scrolls instead of standing still.
  imports: [CdkScrollable],
  template: `
    <div class="z-dialog__header">
      <h2 class="z-dialog__title" [id]="titleId">{{ title() }}</h2>
    </div>
    <div
      #rumpf
      cdkScrollable
      class="z-dialog__body"
      [attr.tabindex]="rumpfTabIndex()"
      [attr.role]="rumpfTabIndex() === null ? null : 'group'"
      [attr.aria-labelledby]="rumpfTabIndex() === null ? null : titleId"
    >
      <ng-content />
    </div>
    @if (aktionen()) {
      <div class="z-dialog__footer"><ng-content select="[zDialogActions]" /></div>
    }
  `,
  host: {
    class: 'z-dialog',
    '[attr.title]': `null`,
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZDialogLayout {
  /**
   * Heading of the dialog, a question or a task. Required: without it the
   * dialog has no accessible name.
   */
  readonly title = input.required<string>();

  /**
   * id of the `<h2>` that the container's `aria-labelledby` points at. Taken
   * from `Z_DIALOG_TITLE_ID` when `ZDialog.open()` opened this dialog,
   * otherwise generated, so the layout also works standalone.
   */
  readonly titleId = inject(Z_DIALOG_TITLE_ID, { optional: true }) ?? naechsteId('z-dialog-title');

  protected readonly aktionen = contentChild(ZDialogActions);

  /** `0` only for a scrolling body that holds nothing focusable; see below. */
  protected readonly rumpfTabIndex = signal<0 | null>(null);

  private readonly rumpf = viewChild.required<ElementRef<HTMLElement>>('rumpf');
  /** Takes the blur listener of the body with it on destroy. */
  private readonly abbruch = new AbortController();

  private readonly pruefer = inject(InteractivityChecker);
  private readonly dokument = inject(DOCUMENT);

  constructor() {
    const zerstoerung = inject(DestroyRef);
    const fenster = this.dokument.defaultView;
    // A dialog longer than the screen scrolls in its body, and what scrolls has
    // to be reachable by keyboard (WCAG 2.1 SC 2.1.1). Controls inside the body
    // are reached by Tab and the browser scrolls them into view, so a form
    // needs nothing. A body that scrolls without holding a single tabbable
    // element does: a confirmation with a long text would otherwise be
    // unreadable without a mouse. Chrome and Firefox give such a scroller a tab
    // stop by themselves, Safari does not, and a second stop on the same
    // element does no harm. It carries `role="group"` with the dialog heading
    // as its name, so it is not an unnamed stop on the way to the actions.
    //
    // Both halves of the question change while the dialog stands: the box with
    // the window (ResizeObserver) and the content with what the caller renders
    // into it (MutationObserver), a log that grows or a field that appears.
    afterNextRender(() => {
      const element = this.rumpf().nativeElement;
      const pruefe = (): void => {
        const scrollt = element.scrollHeight > element.clientHeight;
        // Focus lives on the stop itself while the content shrinks? Then it
        // stays: taking the tabindex away would drop the focus onto <body>,
        // outside the focus trap of the dialog. `blur` asks again.
        const behalten = element === this.dokument.activeElement && this.rumpfTabIndex() === 0;
        this.rumpfTabIndex.set(behalten || (scrollt && !this.hatTabStopp(element)) ? 0 : null);
      };
      // One check per frame, not one per mutation: every check reads
      // scrollHeight and therefore forces a layout. Measured on 3000 appended
      // log lines, one per task: 3000 layouts and 54.9s against 3 layouts and
      // 32ms once they are coalesced.
      let geplant = 0;
      const rahmen = fenster?.requestAnimationFrame?.bind(fenster);
      const plane = (): void => {
        if (!rahmen) {
          pruefe();
          return;
        }
        geplant ||= rahmen(() => {
          geplant = 0;
          pruefe();
        });
      };
      pruefe();
      // ResizeObserver is missing on the server, where no box changes either.
      // It already reports once per frame, so it checks directly.
      const groesse =
        typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(pruefe);
      groesse?.observe(element);
      const inhalt = new MutationObserver(plane);
      inhalt.observe(element, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: ['class', 'disabled', 'hidden', 'href', 'inert', 'style', 'tabindex'],
      });
      element.addEventListener('blur', plane, { signal: this.abbruch.signal });
      zerstoerung.onDestroy(() => {
        groesse?.disconnect();
        inhalt.disconnect();
        this.abbruch.abort();
        if (geplant) {
          fenster?.cancelAnimationFrame?.(geplant);
        }
      });
    });
  }

  /**
   * Does Tab reach anything inside the body? `InteractivityChecker` is what the
   * focus trap of the CDK asks, so the answer is the same one the trap gives:
   * it knows `tabindex="-1"`, `disabled`, `hidden`, `display: none`,
   * `visibility: hidden`, `inert` and a disabled `fieldset` around the control.
   */
  private hatTabStopp(rumpf: HTMLElement): boolean {
    return Array.from(rumpf.querySelectorAll<HTMLElement>(KANDIDATEN)).some(
      (element) =>
        // isTabbable answers for the tabindex, isFocusable for `disabled` and
        // for everything invisible.
        this.pruefer.isTabbable(element) &&
        this.pruefer.isFocusable(element) &&
        !ausserBetrieb(element),
    );
  }
}
