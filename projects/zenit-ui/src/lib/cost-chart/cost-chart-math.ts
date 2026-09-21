import { zCostAt, zCostCapHour } from './cost-chart-rules';

/**
 * The geometry behind `z-cost-chart`, as pure functions: where the cap takes
 * over, what an hour costs, how that maps onto the drawing area and which
 * ticks the axes get. Nothing in here touches the DOM, so every rule is
 * testable on its own and the component stays a template.
 */

/** The drawing area of a chart, in viewBox units, which are CSS pixels. *
 * @internal Geometry of `z-cost-chart`, not part of the public API.
 */
export interface ZChartArea {
  /** Width of the viewBox, which is the measured width of the plot. */
  width: number;
  /** Height of the viewBox. Fixed, so the type never scales. */
  height: number;
  /** Left edge of the plot, where the value axis stands. */
  x0: number;
  /** Right edge of the plot. */
  x1: number;
  /** Baseline of the plot, the zero of the value axis. */
  y0: number;
  /** Top edge of the plot. */
  y1: number;
}

/**
 * The drawing area of the reference (CostChart/preview.html). It is the width
 * the chart draws with before it has measured itself.
 *
 * @internal Geometry of `z-cost-chart`, not part of the public API.
 */
export const Z_CHART_AREA: ZChartArea = {
  width: 520,
  height: 240,
  x0: 48,
  x1: 508,
  y0: 200,
  y1: 20,
};

/**
 * The drawing area for a measured width. One viewBox unit is one CSS pixel, so
 * the 12px axis type renders at 12px at every width instead of shrinking with
 * a fixed viewBox.
 *
 * @param width Measured width of the plot in CSS pixels.
 * @returns The area; 240px is the floor, so a plot narrower than that draws
 * at 240 units and the svg scales those down rather than letting the type fall
 * below its own size everywhere else.
 *
 * @internal Geometry of `z-cost-chart`, not part of the public API.
 */
export function zCostArea(width: number): ZChartArea {
  const breite = Math.max(240, Number.isFinite(width) && width > 0 ? width : Z_CHART_AREA.width);
  return { ...Z_CHART_AREA, width: breite, x1: breite - 12 };
}

/** One tick of an axis: what it says and where it sits. *
 * @internal Geometry of `z-cost-chart`, not part of the public API.
 */
export interface ZChartTick {
  /** The value the tick stands for. */
  value: number;
  /** Its coordinate in viewBox units. */
  pos: number;
}

/** Everything the template of `z-cost-chart` draws, in viewBox units. *
 * @internal Geometry of `z-cost-chart`, not part of the public API.
 */
export interface ZChartGeometry {
  /** The drawing area this geometry was built for. */
  area: ZChartArea;
  /** Hours the time axis runs to, at least 1. */
  maxHours: number;
  /** Value the value axis runs to, always above the highest cost drawn. */
  maxValue: number;
  /** Hour from which the cap holds, or `null` when it is never reached on this axis. */
  capHour: number | null;
  /** `x` of that hour, or `null` along with {@link capHour}. */
  capX: number | null;
  /** `y` of the cap line, or `null` when the cap lies outside the value axis. */
  capY: number | null;
  /** The cost line as the `points` of a `<polyline>`. */
  line: string;
  /** `y` of the base amount at hour 0, where the first direct label sits. */
  baseY: number;
  /** Ticks of the value axis, from 0 upwards. */
  valueTicks: ZChartTick[];
  /** Ticks of the time axis, from 0 upwards. */
  hourTicks: ZChartTick[];
  /** Support points of the table below the chart, the cap hour among them. */
  tableHours: number[];
}

/** A number that can be drawn: not NaN, not infinite, not negative. */
function zahl(wert: number): number {
  return Number.isFinite(wert) && wert > 0 ? wert : 0;
}

/**
 * Maps an hour onto the horizontal axis.
 *
 * @param hours The hour; outside the axis it is clamped to its edge.
 * @param maxHours Hours the axis runs to.
 * @param area The drawing area, from {@link zCostArea}.
 * @returns The `x` in viewBox units.
 *
 * @internal Geometry of `z-cost-chart`, not part of the public API.
 */
export function zCostX(hours: number, maxHours: number, area: ZChartArea = Z_CHART_AREA): number {
  const spanne = Math.max(1, zahl(maxHours));
  return area.x0 + (Math.min(Math.max(zahl(hours), 0), spanne) / spanne) * (area.x1 - area.x0);
}

/**
 * The distance between two ticks of the time axis, wide enough that the labels
 * do not collide: every label needs about 64px of room.
 *
 * @param maxHours Hours the axis runs to.
 * @param plotWidth Width of the plot between the two axes, in pixels. One
 * label needs about 110px of room.
 * @returns The step, always greater than 0, and never below one whole hour.
 *
 * @internal Geometry of `z-cost-chart`, not part of the public API.
 */
export function zCostHourStep(maxHours: number, plotWidth: number): number {
  const stunden = Math.max(1, zahl(maxHours));
  // One label needs about 110px of room, ticks included, so at 520px four of
  // them fit and at 360px the axis thins itself out instead of colliding.
  const hoechstens = Math.max(2, Math.round(zahl(plotWidth) / 110) + 1);
  let schritt = zCostStep(stunden / Math.max(1, hoechstens - 1));
  // A round step can still yield one tick too many; the next round step up
  // thins the axis without giving up the round numbers.
  while (Math.floor(stunden / schritt) + 1 > hoechstens) {
    schritt = zCostStep(schritt * 2.5);
  }
  // Hours are whole: a quarter-hour tick would read "0.25 h".
  return Math.max(1, schritt);
}

/**
 * Maps an amount onto the vertical axis.
 *
 * @param value The amount; outside the axis it is clamped to its edge.
 * @param maxValue Amount the axis runs to.
 * @returns The `y` in viewBox units.
 *
 * @internal Geometry of `z-cost-chart`, not part of the public API.
 */
export function zCostY(value: number, maxValue: number, area: ZChartArea = Z_CHART_AREA): number {
  const spanne = Math.max(Number.EPSILON, zahl(maxValue));
  return area.y0 - (Math.min(Math.max(zahl(value), 0), spanne) / spanne) * (area.y0 - area.y1);
}

/**
 * The largest "round" number at or below a span: 1, 2, 2.5 or 5 times a power
 * of ten. It is what makes the ticks read as 0, 5, 10 instead of 0, 4.1, 8.2.
 *
 * @param spanne The span one tick should roughly cover.
 * @returns The step, always greater than 0.
 *
 * @internal Geometry of `z-cost-chart`, not part of the public API.
 */
export function zCostStep(spanne: number): number {
  const weite = zahl(spanne);
  if (weite <= 0) {
    return 1;
  }
  const zehner = 10 ** Math.floor(Math.log10(weite));
  for (const teil of [5, 2.5, 2, 1]) {
    if (zehner * teil <= weite) {
      return zehner * teil;
    }
  }
  return zehner / 10;
}

/**
 * The ticks of one axis: 0, step, 2·step … up to the last one that still fits
 * into the span.
 *
 * @param spanne Highest value the axis has to show.
 * @param step Distance between two ticks, from {@link zCostStep}.
 * @returns The values, 0 first, at most twelve of them.
 *
 * @internal Geometry of `z-cost-chart`, not part of the public API.
 */
export function zCostTicks(spanne: number, step: number): number[] {
  const weite = zahl(spanne);
  const schritt = zahl(step) || 1;
  const ticks: number[] = [];
  for (let wert = 0; wert <= weite + schritt / 1000 && ticks.length < 12; wert += schritt) {
    // Adding a float twelve times drifts; rounding on the step grid does not.
    ticks.push(Math.round(wert / schritt) * schritt);
  }
  return ticks;
}

/**
 * Everything the chart draws, derived from the four numbers the caller gives.
 *
 * @param base Base amount per month.
 * @param rate Price per hour, unrounded.
 * @param cap Upper limit per month.
 * @param maxHours Hours the time axis runs to; anything at or below 0 becomes 1.
 * @returns The geometry in viewBox units of {@link Z_CHART_AREA}.
 *
 * @internal Geometry of `z-cost-chart`, not part of the public API.
 */
export function zCostGeometry(
  base: number,
  rate: number,
  cap: number,
  maxHours: number,
  width: number = Z_CHART_AREA.width,
): ZChartGeometry {
  const area = zCostArea(width);
  const stunden = Math.max(1, zahl(maxHours));
  const grund = zahl(base);
  const deckel = zahl(cap);

  const hoechste = Math.max(grund, zCostAt(base, rate, cap, stunden));
  const wertSchritt = zCostStep(hoechste / 2);
  // Half a step of headroom above the highest point, so the direct label of
  // the cap has room and never leaves the plot.
  const maxValue = Math.max(hoechste + wertSchritt / 2, wertSchritt);

  const x = (h: number) => zCostX(h, stunden, area);
  const y = (v: number) => zCostY(v, maxValue, area);

  const knick = zCostCapHour(base, rate, cap);
  const knickSichtbar = knick !== null && knick <= stunden;
  const punkte = [`${x(0)},${y(zCostAt(base, rate, cap, 0))}`];
  if (knickSichtbar) {
    punkte.push(`${x(knick)},${y(deckel)}`);
  }
  punkte.push(`${x(stunden)},${y(zCostAt(base, rate, cap, stunden))}`);

  const stundenSchritt = zCostHourStep(stunden, area.x1 - area.x0);

  return {
    area,
    maxHours: stunden,
    maxValue,
    capHour: knickSichtbar ? knick : null,
    capX: knickSichtbar ? x(knick) : null,
    capY: deckel > 0 && deckel <= maxValue ? y(deckel) : null,
    line: punkte.join(' '),
    baseY: y(zCostAt(base, rate, cap, 0)),
    valueTicks: zCostTicks(hoechste, wertSchritt).map((value) => ({ value, pos: y(value) })),
    hourTicks: zCostTicks(stunden, stundenSchritt).map((value) => ({ value, pos: x(value) })),
    tableHours: zCostTableHours(knickSichtbar ? knick : null, stunden),
  };
}

/**
 * The support points of the table: four hours that carry the shape, the cap
 * hour among them when it lies on the axis.
 *
 * @param capHour The hour the cap takes over, or `null`.
 * @param maxHours Hours the time axis runs to.
 * @returns The hours in ascending order, without duplicates.
 *
 * @internal Geometry of `z-cost-chart`, not part of the public API.
 */
export function zCostTableHours(capHour: number | null, maxHours: number): number[] {
  // Rounded up, not to the nearest: the cap holds from the hour the line
  // reaches it, and 2,2 h rounded down to 2 would name an hour that still
  // costs less than the cap.
  const ende = capHour !== null && capHour > 0 ? Math.ceil(capHour) : Math.ceil(zahl(maxHours));
  const stufen = [0, Math.round(ende / 4), Math.round(ende / 2), ende];
  return [...new Set(stufen)].sort((a, b) => a - b);
}

/**
 * The hour a pointer or the keyboard has landed on, as a whole number on the
 * axis.
 *
 * @param anteil Position across the plot, 0 at the left edge, 1 at the right.
 * @param maxHours Hours the time axis runs to.
 * @returns The hour, between 0 and `maxHours`.
 *
 * @internal Geometry of `z-cost-chart`, not part of the public API.
 */
export function zCostHourAt(anteil: number, maxHours: number): number {
  const stunden = Math.max(1, zahl(maxHours));
  const teil = Number.isFinite(anteil) ? Math.min(Math.max(anteil, 0), 1) : 0;
  return Math.round(teil * stunden);
}
