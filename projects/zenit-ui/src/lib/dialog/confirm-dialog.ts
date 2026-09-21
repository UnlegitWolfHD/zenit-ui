import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  signal,
} from '@angular/core';
import { ZButton } from '../button';
import { ZField, ZInput } from '../field';
import { naechsteId, ZDialogActions, ZDialogLayout } from './dialog-layout';

/**
 * Where focus lands after a dialog closes, on top of the CDK default of
 * returning it to the element that was focused before the dialog opened.
 *
 * An `HTMLElement` or an `ElementRef` names the element directly, a `string` is
 * a CSS selector resolved against the document when the dialog closes.
 */
export type ZRestoreFocusTarget = HTMLElement | ElementRef<HTMLElement> | string;

/**
 * Texts and behaviour of a confirmation, passed to `ZDialog.confirm()`. Every
 * text comes from the caller, the library holds none.
 */
export interface ZConfirmConfig {
  /** Heading of the dialog, phrased as a question or a task. */
  title: string;
  /** The concrete consequences: what is lost, what it costs. */
  body: string;
  /** Label of the confirming button. It repeats the verb from `title`. */
  confirmLabel: string;
  /** Label of the cancelling ghost button. */
  cancelLabel: string;
  /**
   * Renders the confirming button as `danger` instead of `primary`. Use it for
   * deleting, cancelling a contract and removing a payment method.
   *
   * @default false
   */
  danger?: boolean;
  /**
   * Text that has to be typed exactly, usually the name of the object being
   * deleted. It shows up as the placeholder, and the confirming button stays
   * disabled until the input matches character for character. Without it the
   * dialog has no input field.
   */
  requireText?: string;
  /**
   * Label of that input field. Without it the field takes `requireText` as its
   * `aria-label` instead, so it is never unlabelled.
   */
  requireLabel?: string;
  /**
   * Element focus returns to when the dialog closes, whichever way it closes.
   * Without it focus goes back to whatever was focused before the dialog
   * opened, which is the CDK default.
   *
   * Set it when the trigger is gone by then. A menu item is the usual case: the
   * CDK menu closes with the click, so pass the menu trigger instead.
   *
   * @example
   * ```html
   * <button #trigger zBtn="ghost" [cdkMenuTriggerFor]="aktionen">…</button>
   * ```
   * ```ts
   * readonly trigger = viewChild.required<ElementRef<HTMLElement>>('trigger');
   *
   * loeschen(): void {
   *   this.dialog
   *     .confirm({ …, restoreFocusTo: this.trigger() })
   *     .subscribe((ja) => (ja ? this.entferne() : undefined));
   * }
   * ```
   */
  restoreFocusTo?: ZRestoreFocusTarget;
}

/**
 * The confirmation behind `ZDialog.confirm()`. Built from `z-dialog` with a
 * cancel and a confirm button and, with `requireText`, an input field whose
 * value gates the confirm button.
 *
 * The result is `true` only through the confirming button; cancel, Escape and a
 * click on the backdrop leave the dialog without a result, which
 * `ZDialog.confirm()` maps to `false`.
 *
 * @internal Not part of the documented API. Open it through
 * `ZDialog.confirm()`.
 */
@Component({
  selector: 'z-confirm-dialog',
  imports: [ZButton, ZDialogActions, ZDialogLayout, ZField, ZInput],
  template: `
    <z-dialog [title]="daten.title">
      <span>{{ daten.body }}</span>
      @if (daten.requireText) {
        <z-field [label]="daten.requireLabel ?? ''" [for]="eingabeId">
          <input
            zInput
            mono
            [id]="eingabeId"
            [placeholder]="daten.requireText"
            [attr.aria-label]="daten.requireLabel ? null : daten.requireText"
            (input)="aufEingabe($event)"
          />
        </z-field>
      }
      <ng-container zDialogActions>
        <button type="button" zBtn="ghost" (click)="ref.close(false)">
          {{ daten.cancelLabel }}
        </button>
        <button
          type="button"
          [zBtn]="daten.danger ? 'danger' : 'primary'"
          [disabled]="gesperrt()"
          (click)="ref.close(true)"
        >
          {{ daten.confirmLabel }}
        </button>
      </ng-container>
    </z-dialog>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZConfirmDialog {
  protected readonly daten = inject<ZConfirmConfig>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);
  protected readonly eingabeId = naechsteId('z-confirm-input');

  private readonly eingabe = signal('');

  /** Confirming stays disabled until the input matches exactly. */
  protected readonly gesperrt = computed(
    () => !!this.daten.requireText && this.eingabe() !== this.daten.requireText,
  );

  protected aufEingabe(ereignis: Event): void {
    this.eingabe.set((ereignis.target as HTMLInputElement).value);
  }
}
