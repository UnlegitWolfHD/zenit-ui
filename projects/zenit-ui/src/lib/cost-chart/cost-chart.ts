import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  input,
  numberAttribute,
  signal,
  viewChild,
} from '@angular/core';
import { injectZLabels } from '../labels';
import {
  Z_CHART_AREA,
  zCostAt,
  zCostGeometry,
  zCostHourAt,
  zCostX,
  zCostY,
} from './cost-chart-math';

let zaehler = 0;

/**
 * Shows how flex costs grow with the hours played and where the cap takes
 * over. One series, so no legend and no series colour: the line is 2px in
 * `text`, the cap a dashed line in `border-control`, no fill, no gradient.
 *
 * Renders the class `z-chart` on the host: the two figures above the chart,
 * a plain SVG with grid, axes, line and the two direct labels, the caption as
 * a sentence and a native `details` with the same numbers as a real table.
 *
 * The cap hour is computed, never written down: `(cap − base) / rate` with the
 * unrounded hourly price. The figure above the chart shows that price rounded
 * to the cent, and with those rounded 0,09 € the point would land on 98 hours
 * instead of 100.
 *
 * Accessibility: the SVG carries `<title>` and `<desc>` and is a `role="img"`
 * named by them. The plot around it is the interactive part and therefore not
 * an image: it is a `role="slider"` over the hours, which is exactly the
 * keyboard contract the chart offers (left and right move the hour, Home and
 * End jump to the ends), and `aria-valuetext` reads the tooltip out
 * ("50 h gespielt: 5,90 €"). Pointer and focus show the same cursor, the hit
 * area is the whole plot, and the tooltip stays inside it. Below the chart the
 * table carries every number again, for anyone who would rather read than
 * point. Nothing animates.
 *
 * @example
 * ```html
 * <z-cost-chart
 *   [base]="1.5"
 *   [rate]="0.088"
 *   [cap]="10.3"
 *   [maxHours]="150"
 *   caption="Normal mit 4 GB: 1,50 € Grundbetrag plus 0,09 € je Stunde, nie mehr als 10,30 € im Monat."
 * />
 * ```
 */
@Component({
  selector: 'z-cost-chart',
  template: `
    <div class="z-chart__figures">
      <div class="z-chart__figure">
        <span>{{ etiketten.chartPerHour }}</span
        ><strong>{{ etiketten.chartMoney(rate()) }}</strong>
      </div>
      <div class="z-chart__figure">
        <span>{{ etiketten.chartCapPerMonth }}</span
        ><strong>{{ etiketten.chartMoney(cap()) }}</strong>
      </div>
    </div>

    <div
      #plot
      class="z-chart__plot"
      tabindex="0"
      role="slider"
      [attr.aria-label]="etiketten.chartTitle"
      aria-valuemin="0"
      [attr.aria-valuemax]="geometrie().maxHours"
      [attr.aria-valuenow]="stunde()"
      [attr.aria-valuetext]="ablesung()"
      (pointermove)="aufZeiger($event)"
      (pointerleave)="zeiger.set(false)"
      (focus)="zeiger.set(true)"
      (blur)="zeiger.set(false)"
      (keydown)="aufTaste($event)"
    >
      <svg
        [attr.viewBox]="'0 0 ' + flaeche.width + ' ' + flaeche.height"
        role="img"
        focusable="false"
        [attr.aria-labelledby]="titelId + ' ' + beschreibungId"
      >
        <title [attr.id]="titelId">{{ etiketten.chartTitle }}</title>
        <desc [attr.id]="beschreibungId">{{ satz() }}</desc>

        @for (tick of geometrie().valueTicks; track tick.value) {
          <line
            class="z-chart__grid"
            [attr.x1]="flaeche.x0"
            [attr.x2]="flaeche.x1"
            [attr.y1]="tick.pos"
            [attr.y2]="tick.pos"
          />
          <text
            class="z-chart__axis"
            [attr.x]="flaeche.x0 - 8"
            [attr.y]="tick.pos + 4"
            text-anchor="end"
          >
            {{ etiketten.chartAxisMoney(tick.value) }}
          </text>
        }
        @for (tick of geometrie().hourTicks; track tick.value; let letzte = $last; let i = $index) {
          <text
            class="z-chart__axis"
            [class.z-chart__axis--half]="i % 2 === 1"
            [attr.x]="tick.pos"
            [attr.y]="flaeche.y0 + 24"
            [attr.text-anchor]="letzte ? 'end' : 'middle'"
          >
            {{ etiketten.chartAxisHours(tick.value) }}
          </text>
        }

        @if (geometrie().capY !== null) {
          <line
            class="z-chart__cap"
            [attr.x1]="flaeche.x0"
            [attr.x2]="flaeche.x1"
            [attr.y1]="geometrie().capY"
            [attr.y2]="geometrie().capY"
          />
        }
        <polyline class="z-chart__line" [attr.points]="geometrie().line" />
        @if (geometrie().capX !== null) {
          <circle
            class="z-chart__marker"
            [attr.cx]="geometrie().capX"
            [attr.cy]="geometrie().capY"
            r="5"
          />
          <text
            class="z-chart__label"
            [attr.x]="geometrie().capX"
            [attr.y]="(geometrie().capY ?? 0) - 15"
            text-anchor="middle"
          >
            {{ etiketten.chartCapLabel(knickStunde()) }}
          </text>
        }
        <text class="z-chart__label" [attr.x]="flaeche.x0 + 8" [attr.y]="geometrie().baseY + 16">
          {{ etiketten.chartBaseLabel(base()) }}
        </text>

        @if (zeiger()) {
          <line
            class="z-chart__cross"
            [attr.x1]="zeigerX()"
            [attr.x2]="zeigerX()"
            [attr.y1]="flaeche.y1"
            [attr.y2]="flaeche.y0"
          />
          <circle class="z-chart__marker" [attr.cx]="zeigerX()" [attr.cy]="zeigerY()" r="5" />
        }
      </svg>
      @if (zeiger()) {
        <div
          class="z-chart__tip"
          [class.z-chart__tip--flip]="zeigerX() > flaeche.width * 0.6"
          [style.left.%]="(zeigerX() / flaeche.width) * 100"
          [style.top.%]="tipOben()"
        >
          {{ etiketten.chartPlayed(stunde()) }}:
          <strong>{{ etiketten.chartMoney(kostenJetzt()) }}</strong>
        </div>
      }
    </div>

    @if (caption()) {
      <span class="z-chart__caption">{{ caption() }}</span>
    }

    <details class="z-faq">
      <summary>{{ etiketten.chartTable }}</summary>
      <div class="z-table-wrap">
        <table class="z-table">
          <thead>
            <tr>
              <th scope="col">{{ etiketten.chartTableHours }}</th>
              <th scope="col" class="z-table__num">{{ etiketten.chartTableCost }}</th>
            </tr>
          </thead>
          <tbody>
            @for (stunden of geometrie().tableHours; track stunden; let letzte = $last) {
              <tr>
                <td>
                  {{
                    letzte && geometrie().capHour !== null
                      ? etiketten.chartTableCapRow(stunden)
                      : stunden
                  }}
                </td>
                <td class="z-table__num">{{ etiketten.chartMoney(kostenBei(stunden)) }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </details>
  `,
  host: { class: 'z-chart' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZCostChart {
  /**
   * Base amount per month, the value the line starts at.
   *
   * @default 0
   */
  readonly base = input(0, { transform: numberAttribute });

  /**
   * Price per hour, unrounded. The figure above the chart shows it rounded to
   * the cent; the cap hour is computed from this value, because the rounded
   * one moves the point.
   *
   * @default 0
   */
  readonly rate = input(0, { transform: numberAttribute });

  /**
   * Upper limit per month. From the hour it is reached the line runs flat.
   *
   * @default 0
   */
  readonly cap = input(0, { transform: numberAttribute });

  /**
   * Hours the time axis runs to. Anything at or below 0 becomes 1.
   *
   * @default 0
   */
  readonly maxHours = input(0, { transform: numberAttribute });

  /**
   * One sentence that says the chart in words, below it. Empty leaves it out;
   * the table stays either way.
   *
   * @default ''
   */
  readonly caption = input('');

  protected readonly etiketten = injectZLabels();
  protected readonly flaeche = Z_CHART_AREA;
  protected readonly titelId = `z-chart-t-${++zaehler}`;
  protected readonly beschreibungId = `z-chart-d-${zaehler}`;

  private readonly plot = viewChild.required<ElementRef<HTMLElement>>('plot');

  /** Hour under the cursor. Also `aria-valuenow`, so it always holds a number. */
  protected readonly stunde = signal(0);
  /** Whether cross, dot and tooltip are shown: on hover and while focused. */
  protected readonly zeiger = signal(false);

  protected readonly geometrie = computed(() =>
    zCostGeometry(this.base(), this.rate(), this.cap(), this.maxHours()),
  );

  protected readonly knickStunde = computed(() => Math.round(this.geometrie().capHour ?? 0));

  protected readonly satz = computed(() =>
    this.etiketten.chartDesc(
      this.base(),
      this.rate(),
      this.cap(),
      Math.round(this.geometrie().capHour ?? this.geometrie().maxHours),
    ),
  );

  protected readonly kostenJetzt = computed(() => this.kostenBei(this.stunde()));

  protected readonly ablesung = computed(
    () =>
      `${this.etiketten.chartPlayed(this.stunde())}: ${this.etiketten.chartMoney(this.kostenJetzt())}`,
  );

  protected readonly zeigerX = computed(() => zCostX(this.stunde(), this.geometrie().maxHours));
  protected readonly zeigerY = computed(() =>
    zCostY(this.kostenJetzt(), this.geometrie().maxValue),
  );

  /** Keeps the tooltip inside the plot: above the dot, never past the top edge. */
  protected readonly tipOben = computed(() =>
    Math.max(0, ((this.zeigerY() - 36) / Z_CHART_AREA.height) * 100),
  );

  protected kostenBei(stunden: number): number {
    return zCostAt(this.base(), this.rate(), this.cap(), stunden);
  }

  protected aufZeiger(ereignis: PointerEvent): void {
    const kasten = this.plot().nativeElement.getBoundingClientRect();
    if (!kasten.width) {
      return;
    }
    const { x0, x1, width } = Z_CHART_AREA;
    const inViewBox = ((ereignis.clientX - kasten.left) / kasten.width) * width;
    this.stunde.set(zCostHourAt((inViewBox - x0) / (x1 - x0), this.geometrie().maxHours));
    this.zeiger.set(true);
  }

  protected aufTaste(ereignis: KeyboardEvent): void {
    const grenze = this.geometrie().maxHours;
    // About thirty presses cross the whole axis, whatever it runs to.
    const schritt = Math.max(1, Math.round(grenze / 30));
    const ziel: Record<string, number> = {
      ArrowRight: this.stunde() + schritt,
      ArrowUp: this.stunde() + schritt,
      ArrowLeft: this.stunde() - schritt,
      ArrowDown: this.stunde() - schritt,
      Home: 0,
      End: grenze,
    };
    if (!(ereignis.key in ziel)) {
      return;
    }
    ereignis.preventDefault();
    this.stunde.set(Math.min(Math.max(ziel[ereignis.key], 0), grenze));
    this.zeiger.set(true);
  }
}
