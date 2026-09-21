/**
 * The two rules of the flex tariff, as pure functions. They are public because
 * a caller computes with them too: a sentence next to the chart, a table in a
 * panel, a check in a test. The geometry that draws the chart from them lives
 * in `cost-chart-math.ts` and is internal.
 */

/** A number that can be used: not NaN, not infinite, not negative. */
function zahl(wert: number): number {
  return Number.isFinite(wert) && wert > 0 ? wert : 0;
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
  // Rounded to a millionth: (10,30 - 1,50) / 0,088 lands on 100.00000000000001
  // in binary floating point, and a cap hour of "101" would follow from it.
  return Math.round(((deckel - grund) / preis) * 1e6) / 1e6;
}
