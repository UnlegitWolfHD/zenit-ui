import { ChangeDetectionStrategy, Component, computed, Directive, input } from '@angular/core';

/**
 * Zeilenmuster fuer alles, was der Kunde besitzt. `columns` setzt das
 * gemeinsame Grid von Kopf und Zeilen ueber die Variable `--z-cols`.
 */
@Component({
  selector: 'z-rows',
  template: `<ng-content />`,
  host: {
    'class': 'z-rows',
    '[style.--z-cols]': `columns() || null`,
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZRows {
  readonly columns = input('');
}

/** Spaltenkopf der Liste. Faellt unter 640px weg. */
@Component({
  selector: 'z-rows-head',
  template: `<ng-content />`,
  host: { 'class': 'z-rows__head' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZRowsHead {}

/**
 * Eine Zeile. Als `a` ist die ganze Zeile der Link auf die Detailseite,
 * als `div` ist sie nicht anklickbar und traegt eigene Aktionen.
 */
@Directive({
  selector: 'a[zRow], div[zRow]',
  host: { 'class': 'z-row' },
})
export class ZRow {}

/** Erste Spalte: Bild oder Anfangsbuchstabe, Titel und eine Meta-Zeile. */
@Component({
  selector: 'z-row-main',
  template: `
    <span class="z-row__thumb">
      @if (image()) {
        <img [src]="image()" alt="" />
      } @else {
        {{ initiale() }}
      }
    </span>
    <div class="z-row__text">
      <div class="z-row__title">{{ title() }}</div>
      @if (meta()) {
        <div class="z-row__meta">{{ meta() }}</div>
      }
    </div>
  `,
  host: {
    'class': 'z-row__main',
    '[attr.title]': `null`,
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZRowMain {
  readonly title = input('');
  readonly meta = input('');
  readonly image = input('');

  protected readonly initiale = computed(() => this.title().trim().charAt(0).toUpperCase());
}

/** Betrag oder Zahl in der Zeile: rechtsbuendig in mono. */
@Directive({
  selector: '[zRowNum]',
  host: { 'class': 'z-row__num' },
})
export class ZRowNum {}
