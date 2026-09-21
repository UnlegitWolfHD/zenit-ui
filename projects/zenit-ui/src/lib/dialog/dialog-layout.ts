import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  contentChild,
  Directive,
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

/** Enough of a focusable element for the question "does Tab reach the body?". */
const FOKUSSIERBAR = 'a[href], button, input, select, textarea, [tabindex]';

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
 * a body that scrolls without holding a focusable element becomes a tab stop of
 * its own.
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
  template: `
    <div class="z-dialog__header">
      <h2 class="z-dialog__title" [id]="titleId">{{ title() }}</h2>
    </div>
    <div #rumpf class="z-dialog__body" [attr.tabindex]="rumpfTabIndex()"><ng-content /></div>
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

  constructor() {
    // A dialog longer than the screen scrolls in its body, and what scrolls has
    // to be reachable by keyboard (WCAG 2.1 SC 2.1.1). Controls inside the body
    // are reached by Tab and the browser scrolls them into view, so a form
    // needs nothing. A body that scrolls without holding a single focusable
    // element does: a confirmation with a long text would otherwise be
    // unreadable without a mouse. Chrome and Firefox give such a scroller a tab
    // stop by themselves, Safari does not, and a second stop on the same
    // element does no harm.
    // ponytail: measured once after the first render; a body whose content only
    // grows later keeps the answer of that moment. A ResizeObserver would be
    // the upgrade if a dialog ever fills itself late.
    afterNextRender(() => {
      const element = this.rumpf().nativeElement;
      const scrollt = element.scrollHeight > element.clientHeight;
      this.rumpfTabIndex.set(scrollt && !element.querySelector(FOKUSSIERBAR) ? 0 : null);
    });
  }
}
