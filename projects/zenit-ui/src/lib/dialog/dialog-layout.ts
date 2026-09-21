import {
  ChangeDetectionStrategy,
  Component,
  contentChild,
  Directive,
  inject,
  InjectionToken,
  input,
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
 * Layout of a dialog: header with the heading, body, footer with the actions.
 * Use it as the root element of the component handed to `ZDialog.open()`.
 *
 * Renders `.z-dialog__header` with `<h2 class="z-dialog__title">`,
 * `.z-dialog__body` with the projected content and, only when a
 * `[zDialogActions]` element is present, `.z-dialog__footer`. The host carries
 * `z-dialog` and its native `title` attribute is cleared, so the {@link title}
 * input never becomes a browser tooltip.
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
    <div class="z-dialog__body"><ng-content /></div>
    @if (aktionen()) {
      <div class="z-dialog__footer"><ng-content select="[zDialogActions]" /></div>
    }
  `,
  host: {
    'class': 'z-dialog',
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
   * from {@link Z_DIALOG_TITLE_ID} when `ZDialog.open()` opened this dialog,
   * otherwise generated, so the layout also works standalone.
   */
  readonly titleId = inject(Z_DIALOG_TITLE_ID, { optional: true }) ?? naechsteId('z-dialog-title');

  protected readonly aktionen = contentChild(ZDialogActions);
}
