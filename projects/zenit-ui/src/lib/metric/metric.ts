import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Mehrere Kennzahlen als Spalten in EINEM Panel, getrennt durch 1px-Linien. */
@Component({
  selector: 'z-metrics',
  template: `<ng-content />`,
  host: { 'class': 'z-metrics' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZMetrics {}

/**
 * Eine Kennzahl mit Einheit, optional mit Auslastungsbalken. Ab 80 Prozent
 * warnt der Balken, ab 95 meldet er einen Fehler. Die Farbe traegt die
 * Bedeutung nicht allein: der Aufrufer schreibt den Wert zusaetzlich in `sub`.
 */
@Component({
  selector: 'z-metric',
  template: `
    <span class="z-metric__label">{{ label() }}</span>
    <span class="z-metric__value"
      >{{ value() }}@if (unit()) {<small>&#160;{{ unit() }}</small>}</span
    >
    @if (anteil() !== null) {
      <div
        class="z-meter"
        [class.z-meter--warning]="warnung()"
        [class.z-meter--danger]="fehler()"
        role="meter"
        aria-valuemin="0"
        aria-valuemax="100"
        [attr.aria-valuenow]="anteil()"
        [attr.aria-label]="label()"
      >
        <span class="z-meter__fill" [style.width.%]="anteil()"></span>
      </div>
    }
    @if (sub()) {
      <span class="z-metric__sub">{{ sub() }}</span>
    }
  `,
  host: { 'class': 'z-metric' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZMetric {
  readonly label = input('');
  readonly value = input('');
  readonly unit = input('');
  readonly sub = input('');
  /** Ohne Wert gibt es keinen Balken. */
  readonly percent = input<number | null, number | string | null | undefined>(null, {
    transform: (wert) => (wert === null || wert === undefined || wert === '' ? null : Number(wert)),
  });

  protected readonly anteil = computed(() => {
    const wert = this.percent();
    return wert === null || Number.isNaN(wert) ? null : Math.min(100, Math.max(0, wert));
  });
  protected readonly fehler = computed(() => (this.anteil() ?? 0) >= 95);
  protected readonly warnung = computed(() => (this.anteil() ?? 0) >= 80 && !this.fehler());
}
