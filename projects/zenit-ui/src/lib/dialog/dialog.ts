import { Dialog, DialogConfig, DialogRef } from '@angular/cdk/dialog';
import { ComponentType } from '@angular/cdk/portal';
import { DOCUMENT, ElementRef, inject, Service } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ZConfirmConfig, ZConfirmDialog, ZRestoreFocusTarget } from './confirm-dialog';
import { naechsteId, Z_DIALOG_TITLE_ID } from './dialog-layout';

/**
 * Options of `@angular/cdk/dialog` plus {@link ZDialogConfig.restoreFocusTo}.
 */
export type ZDialogConfig<D, R> = DialogConfig<D, R> & {
  /**
   * Element focus returns to when the dialog closes, mapped onto the CDK's
   * `restoreFocus`. Without it focus goes back to whatever was focused before
   * the dialog opened, which is the CDK default. Set it when the trigger is
   * gone by then. A dialog opened from a menu item needs nothing: the service
   * finds the menu trigger by itself.
   */
  restoreFocusTo?: ZRestoreFocusTarget;
};

/** Caller classes as a list, so the library's own ones keep coming first. */
function alsListe(klassen: string | string[] | undefined): string[] {
  if (!klassen) {
    return [];
  }
  return Array.isArray(klassen) ? klassen : [klassen];
}

/** `restoreFocusTo` as the `boolean | string | HTMLElement` the CDK takes. */
function fokusZiel(ziel: ZRestoreFocusTarget | undefined): HTMLElement | string | undefined {
  return ziel instanceof ElementRef ? ziel.nativeElement : ziel;
}

/**
 * The trigger of the menu the focus stands in, or `undefined` when it stands
 * anywhere else.
 *
 * A dialog opened from a menu item would otherwise return focus to that item:
 * the CDK closes the menu with the click, so the item is gone by the time the
 * dialog closes and focus falls to the body. `CdkMenuTrigger` carries the id of
 * its menu as `aria-controls`, which leads from the open menu back to the
 * button that opened it.
 */
function menueAusloeser(dokument: Document): HTMLElement | undefined {
  const menue = (dokument.activeElement as HTMLElement | null)?.closest('.cdk-menu[id]');
  return menue
    ? (dokument.querySelector<HTMLElement>(`[aria-controls="${menue.id}"]`) ?? undefined)
    : undefined;
}

/**
 * Thin wrapper around `Dialog` from `@angular/cdk/dialog`, provided in root.
 *
 * The focus trap, Escape, the backdrop and returning focus to the trigger come
 * from the CDK. This service only adds the fixed classes `z-dialog-panel` and
 * `z-backdrop`, sets `aria-modal`, links the heading of `z-dialog` to the
 * container through `aria-labelledby`, and offers `restoreFocusTo` for the case
 * where the trigger is gone by the time the dialog closes. Focus lands on the
 * first tabbable element when the dialog opens, which is the first field or
 * otherwise the cancel button.
 *
 * One case is taken care of without `restoreFocusTo`: a dialog opened from a
 * menu item. The CDK closes the menu with the click, so the item no longer
 * exists when the dialog closes and focus would fall to the body; the service
 * therefore returns it to the menu trigger.
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
@Service()
export class ZDialog {
  private readonly cdk = inject(Dialog);
  private readonly dokument = inject(DOCUMENT);

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
   * or `disableClose`, plus `restoreFocusTo`.
   * @returns The `DialogRef` of the CDK. Its `closed` observable emits the
   * result once and then completes, `undefined` when the dialog was dismissed
   * by Escape or by a click on the backdrop.
   *
   * @example
   * ```ts
   * // The row that carried the trigger is gone once the dialog confirms the
   * // deletion, so focus goes to the toolbar above the list instead.
   * this.dialog.open(NotizDialog, { restoreFocusTo: this.werkzeugleiste() });
   * ```
   */
  open<R = unknown, D = unknown, C = unknown>(
    component: ComponentType<C>,
    config?: ZDialogConfig<D, DialogRef<R, C>>,
  ): DialogRef<R, C> {
    const titelId = naechsteId('z-dialog-title');
    const titelProvider = { provide: Z_DIALOG_TITLE_ID, useValue: titelId };
    const fremde = config?.providers;
    // Without a target of its own, a dialog opened from a menu item goes back
    // to the menu trigger, because the item itself is gone by then.
    const ziel = fokusZiel(config?.restoreFocusTo) ?? menueAusloeser(this.dokument);
    return this.cdk.open<R, D, C>(component, {
      // autoFocus 'first-tabbable' (first field, otherwise "Abbrechen"),
      // restoreFocus and Escape are the defaults of the CDK.
      ...config,
      // Only when given, so an absent restoreFocusTo keeps the CDK default.
      ...(ziel === undefined ? {} : { restoreFocus: ziel }),
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
   * `restoreFocusTo` of the config names where focus lands afterwards.
   *
   * @param config Texts and behaviour of the confirmation.
   * @returns An `Observable<boolean>` that emits exactly once and then
   * completes: `true` only through the confirming button, `false` through
   * "Abbrechen", Escape and a click on the backdrop.
   */
  confirm(config: ZConfirmConfig): Observable<boolean> {
    return this.open<boolean, ZConfirmConfig, ZConfirmDialog>(ZConfirmDialog, {
      data: config,
      restoreFocusTo: config.restoreFocusTo,
    }).closed.pipe(map((ergebnis) => ergebnis === true));
  }
}
