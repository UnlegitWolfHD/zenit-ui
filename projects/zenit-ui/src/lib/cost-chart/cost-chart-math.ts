/**
 * The arithmetic behind `z-cost-chart`, as pure functions: where the cap takes
 * over, what an hour costs, how that maps onto the drawing area and which
 * ticks the axes get. Nothing in here touches the DOM, so every rule is
 * testable on its own and the component stays a template.
 */

/** The drawing area of the reference (CostChart/preview.html), in viewBox units. */
export const Z_CHART_AREA = {
  /** Width of the viewBox. */
  width: 520,
  /** Height of the viewBox. */
  height: 240,
  /** Left edge of the plot, where the value axis stands. */
  x0: 48,
  /** Right edge of the plot. */
  x1: 508,
  /** Baseline of the plot, the zero of the value axis. */
  y0: 200,
  /** Top edge of the plot. */
  y1: 20,
} as const;

/** One tick of an axis: what it says and where it sits. */
export interface ZChartTick {
  /** The value the tick stands for. */
  value: number;
  /** Its coordinate in viewBox units. */
  pos: number;
}

/** Everything the template of `z-cost-chart` draws, in viewBox units. */
export interface ZChartGeometry {
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
 * @returns The `x` in viewBox units.
 */
export function zCostX(hours: number, maxHours: number): number {
  const { x0, x1 } = Z_CHART_AREA;
  const spanne = Math.max(1, zahl(maxHours));
  return x0 + (Math.min(Math.max(zahl(hours), 0), spanne) / spanne) * (x1 - x0);
}

/**
 * Maps an amount onto the vertical axis.
 *
 * @param value The amount; outside the axis it is clamped to its edge.
 * @param maxValue Amount the axis runs to.
 * @returns The `y` in viewBox units.
 */
export function zCostY(value: number, maxValue: number): number {
  const { y0, y1 } = Z_CHART_AREA;
  const spanne = Math.max(Number.EPSILON, zahl(maxValue));
  return y0 - (Math.min(Math.max(zahl(value), 0), spanne) / spanne) * (y0 - y1);
}

/**
 * What a month costs after a number of hours: the base amount plus the hourly
 * price, never more than the cap.
 *
 * @param base Base amount per month.
 * @param rate Price per hour, unrounded.
 * @param cap Upper limit per month. A cap below the base amount wins from hour 0.
 * @param hours Hours played; negative counts as 0.
 * @returns The cost, never negative.
 */
export function zCostAt(base: number, rate: number, cap: number, hours: number): number {
  const grund = zahl(base);
  const preis = zahl(rate);
  const deckel = zahl(cap);
  const stunden = zahl(hours);
  const offen = grund + preis * stunden;
  return deckel > 0 ? Math.min(deckel, offen) : offen;
}

/**
 * The hour from which the cap holds: `(cap - base) / rate`, with the unrounded
 * hourly price. Rounding the price first moves the point, which is why the
 * chart never computes with the displayed value: 0,09 € instead of 0,088 €
 * turns 100 hours into 98.
 *
 * @param base Base amount per month.
 * @param rate Price per hour, unrounded.
 * @param cap Upper limit per month.
 * @returns The hour, `0` when the cap is already reached at hour 0, and `null`
 * when it is never reached, which is the case for a price of 0 per hour.
 */
export function zCostCapHour(base: number, rate: number, cap: number): number | null {
  const grund = zahl(base);
  const preis = zahl(rate);
  const deckel = zahl(cap);
  if (deckel <= 0) {
    return null;
  }
  if (deckel <= grund) {
    return 0;
  }
  if (preis <= 0) {
    return null;
  }
  return (deckel - grund) / preis;
}

/**
 * The largest "round" number at or below a span: 1, 2, 2.5 or 5 times a power
 * of ten. It is what makes the ticks read as 0, 5, 10 instead of 0, 4.1, 8.2.
 *
 * @param spanne The span one tick should roughly cover.
 * @returns The step, always greater than 0.
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
 */
export function zCostGeometry(
  base: number,
  rate: number,
  cap: number,
  maxHours: number,
): ZChartGeometry {
  const stunden = Math.max(1, zahl(maxHours));
  const grund = zahl(base);
  const deckel = zahl(cap);

  const hoechste = Math.max(grund, zCostAt(base, rate, cap, stunden));
  const wertSchritt = zCostStep(hoechste / 2);
  // Half a step of headroom above the highest point, so the direct label of
  // the cap has room and never leaves the plot.
  const maxValue = Math.max(hoechste + wertSchritt / 2, wertSchritt);

  const x = (h: number) => zCostX(h, stunden);
  const y = (v: number) => zCostY(v, maxValue);

  const knick = zCostCapHour(base, rate, cap);
  const knickSichtbar = knick !== null && knick <= stunden;
  const punkte = [`${x(0)},${y(zCostAt(base, rate, cap, 0))}`];
  if (knickSichtbar) {
    punkte.push(`${x(knick)},${y(deckel)}`);
  }
  punkte.push(`${x(stunden)},${y(zCostAt(base, rate, cap, stunden))}`);

  const stundenSchritt = zCostStep(stunden / 3);

  return {
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
 */
export function zCostTableHours(capHour: number | null, maxHours: number): number[] {
  const ende = capHour !== null && capHour > 0 ? Math.round(capHour) : Math.round(zahl(maxHours));
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
 */
export function zCostHourAt(anteil: number, maxHours: number): number {
  const stunden = Math.max(1, zahl(maxHours));
  const teil = Number.isFinite(anteil) ? Math.min(Math.max(anteil, 0), 1) : 0;
  return Math.round(teil * stunden);
}
