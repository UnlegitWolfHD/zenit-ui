import { Dialog, DialogConfig, DialogRef } from '@angular/cdk/dialog';
import { ComponentType } from '@angular/cdk/portal';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ZConfirmConfig, ZConfirmDialog } from './confirm-dialog';
import { naechsteId, Z_DIALOG_TITLE_ID } from './dialog-layout';

/** Caller classes as a list, so the library's own ones keep coming first. */
function alsListe(klassen: string | string[] | undefined): string[] {
  if (!klassen) {
    return [];
  }
  return Array.isArray(klassen) ? klassen : [klassen];
}

/**
 * Thin wrapper around `Dialog` from `@angular/cdk/dialog`, provided in root.
 *
 * The focus trap, Escape, the backdrop and returning focus to the trigger come
 * from the CDK. This service only adds the fixed classes `z-dialog-panel` and
 * `z-backdrop`, sets `aria-modal`, and links the heading of `z-dialog` to the
 * container through `aria-labelledby`. Focus lands on the first tabbable
 * element when the dialog opens, which is the first field or otherwise the
 * cancel button.
 *
 * Use a dialog for a decision that cannot be undone or for a short form, not
 * for "stop" or "restart".
 *
 * @example
 * ```ts
 * private readonly dialog = inject(ZDialog);
 *
 * loeschen(name: string): void {
 *   this.dialog
 *     .confirm({
 *       title: `Server "${name}" löschen?`,
 *       body: 'Alle Welten und Backups gehen verloren. Das lässt sich nicht rückgängig machen.',
 *       confirmLabel: 'Löschen',
 *       cancelLabel: 'Abbrechen',
 *       danger: true,
 *       requireText: name,
 *     })
 *     .subscribe((bestaetigt) => {
 *       if (bestaetigt) {
 *         this.entferne(name);
 *       }
 *     });
 * }
 * ```
 */
@Injectable({ providedIn: 'root' })
export class ZDialog {
  private readonly cdk = inject(Dialog);

  /**
   * Opens a component of your own, as a rule one whose root element is
   * `<z-dialog title="…">`.
   *
   * Generates the id of the heading, provides it under `Z_DIALOG_TITLE_ID` and
   * puts the same id on the container as `aria-labelledby` unless the config
   * already names one. Own `panelClass` and `backdropClass` entries are
   * appended after the library's, all other options of the CDK stay untouched.
   *
   * @typeParam R Result type the dialog closes with.
   * @typeParam D Type of `config.data` handed to the component via
   * `DIALOG_DATA`.
   * @typeParam C Type of the component.
   * @param component The component to render inside the dialog.
   * @param config Options of `@angular/cdk/dialog`, for example `data`, `width`
   * or `disableClose`.
   * @returns The `DialogRef` of the CDK. Its `closed` observable emits the
   * result once and then completes, `undefined` when the dialog was dismissed
   * by Escape or by a click on the backdrop.
   */
  open<R = unknown, D = unknown, C = unknown>(
    component: ComponentType<C>,
    config?: DialogConfig<D, DialogRef<R, C>>,
  ): DialogRef<R, C> {
    const titelId = naechsteId('z-dialog-title');
    const titelProvider = { provide: Z_DIALOG_TITLE_ID, useValue: titelId };
    const fremde = config?.providers;
    return this.cdk.open<R, D, C>(component, {
      // autoFocus 'first-tabbable' (first field, otherwise "Abbrechen"),
      // restoreFocus and Escape are the defaults of the CDK.
      ...config,
      panelClass: ['z-dialog-panel', ...alsListe(config?.panelClass)],
      backdropClass: ['z-backdrop', ...alsListe(config?.backdropClass)],
      ariaModal: true,
      ariaLabelledBy: config?.ariaLabelledBy ?? titelId,
      providers:
        typeof fremde === 'function'
          ? (ref, cfg, container) => [titelProvider, ...fremde(ref, cfg, container)]
          : [titelProvider, ...(fremde ?? [])],
    });
  }

  /**
   * Confirmation with two buttons, built from {@link ZConfirmConfig}. With
   * `requireText` the confirming button stays disabled until that text is typed
   * exactly.
   *
   * The dialog opens as soon as this method is called, not on subscribe.
   *
   * @param config Texts and behaviour of the confirmation.
   * @returns An `Observable<boolean>` that emits exactly once and then
   * completes: `true` only through the confirming button, `false` through
   * "Abbrechen", Escape and a click on the backdrop.
   */
  confirm(config: ZConfirmConfig): Observable<boolean> {
    return this.open<boolean, ZConfirmConfig, ZConfirmDialog>(ZConfirmDialog, {
      data: config,
    }).closed.pipe(map((ergebnis) => ergebnis === true));
  }
}
