import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ZButton } from '../button';
import { ZField, ZInput } from '../field';
import { naechsteId, ZDialogActions, ZDialogLayout } from './dialog-layout';

/** Texte und Verhalten einer Bestaetigung. Alle Texte kommen vom Aufrufer. */
export interface ZConfirmConfig {
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  /** Bestaetigen als danger statt primary. */
  danger?: boolean;
  /** Text, der genau so eingetippt werden muss. Fehlt er, gibt es kein Feld. */
  requireText?: string;
  /** Label des Feldes. Fehlt es, traegt das Feld `requireText` als aria-label. */
  requireLabel?: string;
}

/**
 * Bestaetigung hinter `ZDialog.confirm()`. Kein Teil der dokumentierten API.
 * Das Ergebnis ist `true` nur ueber den Bestaetigen-Button.
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
        <button zBtn="ghost" (click)="ref.close(false)">{{ daten.cancelLabel }}</button>
        <button
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

  /** Bestaetigen bleibt gesperrt, bis die Eingabe genau passt. */
  protected readonly gesperrt = computed(
    () => !!this.daten.requireText && this.eingabe() !== this.daten.requireText,
  );

  protected aufEingabe(ereignis: Event): void {
    this.eingabe.set((ereignis.target as HTMLInputElement).value);
  }
}
