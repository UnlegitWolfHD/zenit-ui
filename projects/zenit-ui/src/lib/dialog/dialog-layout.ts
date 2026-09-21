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
 * id der Ueberschrift eines Dialogs. `ZDialog.open()` legt sie an, gibt sie hier
 * herein und traegt dieselbe id als `aria-labelledby` am CDK-Container.
 */
export const Z_DIALOG_TITLE_ID = new InjectionToken<string>('Z_DIALOG_TITLE_ID');

let laufendeNummer = 0;

/** Fortlaufende id fuer Ueberschrift und Feld eines Dialogs. */
export function naechsteId(praefix: string): string {
  return `${praefix}-${++laufendeNummer}`;
}

/** Die Buttons im Fuss des Dialogs. */
@Directive({ selector: '[zDialogActions]' })
export class ZDialogActions {}

/**
 * Layout eines Dialogs: Kopf mit Ueberschrift, Koerper, Fuss mit den Aktionen.
 * `role` und `aria-modal` setzt der Container aus `@angular/cdk/dialog`.
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
  /** Pflicht: ohne Ueberschrift hat der Dialog keinen zugaenglichen Namen. */
  readonly title = input.required<string>();

  /** id der Ueberschrift, auf die `aria-labelledby` des Containers zeigt. */
  readonly titleId = inject(Z_DIALOG_TITLE_ID, { optional: true }) ?? naechsteId('z-dialog-title');

  protected readonly aktionen = contentChild(ZDialogActions);
}
