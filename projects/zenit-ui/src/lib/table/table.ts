import { ChangeDetectionStrategy, Component, Directive, input } from '@angular/core';

/**
 * Huelle der Tabelle. Unter 640px scrollt sie hier seitlich, nie die Seite.
 * Der Bereich ist per Tab erreichbar, damit man ohne Maus scrollen kann.
 */
@Component({
  selector: 'z-table-container',
  template: `<ng-content />`,
  host: {
    'class': 'z-table-wrap',
    'role': 'region',
    'tabindex': '0',
    '[attr.aria-label]': `ariaLabel()`,
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZTableContainer {
  readonly ariaLabel = input('Tabelle, seitlich scrollbar');
}

/** Tabelle fuer Dateien, Rechnungen, Backups und Datenbanken. */
@Directive({
  selector: 'table[zTable]',
  host: { 'class': 'z-table' },
})
export class ZTable {}

/** Rechtsbuendige Spalte in mono: Groesse, Datum, Betrag. */
@Directive({
  selector: '[zNum]',
  host: { 'class': 'z-table__num' },
})
export class ZNum {}

/** Namenszelle: Icon und Name in mono. */
@Directive({
  selector: '[zTableName]',
  host: { 'class': 'z-table__name' },
})
export class ZTableName {}
