import { Dialog, DialogConfig, DialogRef } from '@angular/cdk/dialog';
import { ComponentType } from '@angular/cdk/portal';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ZConfirmConfig, ZConfirmDialog } from './confirm-dialog';
import { naechsteId, Z_DIALOG_TITLE_ID } from './dialog-layout';

/** Klassen des Aufrufers als Liste, damit die eigenen davor stehen bleiben. */
function alsListe(klassen: string | string[] | undefined): string[] {
  if (!klassen) {
    return [];
  }
  return Array.isArray(klassen) ? klassen : [klassen];
}

/**
 * Duenne Huelle um `Dialog` aus `@angular/cdk/dialog`. Fokusfalle, Escape und
 * Fokus-Rueckgabe kommen von dort, hier stehen nur die festen Klassen und die
 * Verbindung von Ueberschrift und `aria-labelledby`.
 */
@Injectable({ providedIn: 'root' })
export class ZDialog {
  private readonly cdk = inject(Dialog);

  /**
   * Oeffnet eine eigene Komponente, in der Regel mit `<z-dialog title="…">`.
   * Rueckgabe ist die `DialogRef` des CDK, `closed` liefert das Ergebnis.
   */
  open<R = unknown, D = unknown, C = unknown>(
    component: ComponentType<C>,
    config?: DialogConfig<D, DialogRef<R, C>>,
  ): DialogRef<R, C> {
    const titelId = naechsteId('z-dialog-title');
    const titelProvider = { provide: Z_DIALOG_TITLE_ID, useValue: titelId };
    const fremde = config?.providers;
    return this.cdk.open<R, D, C>(component, {
      // autoFocus 'first-tabbable' (erstes Feld, sonst "Abbrechen"),
      // restoreFocus und Escape sind die Standardwerte des CDK.
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
   * Bestaetigung mit zwei Buttons. `true` kommt nur ueber den Bestaetigen-Button,
   * Escape, Klick daneben und "Abbrechen" liefern `false`.
   */
  confirm(config: ZConfirmConfig): Observable<boolean> {
    return this.open<boolean, ZConfirmConfig, ZConfirmDialog>(ZConfirmDialog, {
      data: config,
    }).closed.pipe(map((ergebnis) => ergebnis === true));
  }
}
