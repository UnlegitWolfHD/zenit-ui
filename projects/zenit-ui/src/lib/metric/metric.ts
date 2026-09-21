import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Row of metrics inside ONE panel, laid out as columns separated by 1px lines.
 *
 * Renders only the projected content and puts the class `z-metrics` on the
 * host. Several figures belong in one `z-metrics`, never in single tiles of
 * their own. Usually placed inside `<z-panel flush>`.
 *
 * @example
 * ```html
 * <z-panel flush>
 *   <z-metrics>
 *     <z-metric label="CPU" value="0,2" unit="%" [percent]="0.2" />
 *     <z-metric label="Laufzeit" value="2d 21h" sub="TPS 20 · Ping 91 ms" />
 *   </z-metrics>
 * </z-panel>
 * ```
 */
@Component({
  selector: 'z-metrics',
  template: `<ng-content />`,
  host: { 'class': 'z-metrics' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZMetrics {}

/**
 * A single figure with its unit, optionally with a usage bar.
 *
 * Renders `.z-metric__label`, `.z-metric__value` (with the unit in a `<small>`
 * preceded by a non-breaking space), the optional bar and `.z-metric__sub`. The
 * host carries `z-metric`.
 *
 * The bar is `<div class="z-meter" role="meter">` with `aria-valuemin="0"`,
 * `aria-valuemax="100"`, `aria-valuenow` set to the clamped percentage and
 * `aria-label` taken from {@link label}. From 80 percent it adds
 * `z-meter--warning`, from 95 percent `z-meter--danger`. Colour never carries
 * the meaning alone: the caller repeats the value in {@link sub}.
 *
 * @example
 * ```html
 * <z-metric label="Speicher" value="21,4" unit="/ 24&nbsp;GB" [percent]="89" sub="89&nbsp;% belegt" />
 * ```
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
  /**
   * Name of the figure, for example "CPU". Also serves as the `aria-label` of
   * the bar.
   *
   * @default ''
   */
  readonly label = input('');

  /**
   * The figure itself, already formatted by the caller: comma as the decimal
   * mark, German number format.
   *
   * @default ''
   */
  readonly value = input('');

  /**
   * Unit or upper bound rendered after the value, for example `%` or
   * `/ 24&nbsp;GB`. Empty leaves the `<small>` out.
   *
   * @default ''
   */
  readonly unit = input('');

  /**
   * Second line under the figure. Carries the percentage in words whenever the
   * bar warns, so the state does not depend on colour.
   *
   * @default ''
   */
  readonly sub = input('');

  /**
   * Usage in percent, 0 to 100. Values outside that range are clamped, values
   * that are not a number render no bar. `null`, `undefined` and the empty
   * string mean no bar at all.
   *
   * @default null
   */
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
