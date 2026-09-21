import { describe, expect, it } from 'vitest';
import {
  angehobenerRam,
  cent,
  euro,
  flexDeckel,
  flexStundenpreis,
  gutscheinFehler,
  gutscheinRabatt,
  laufzeitOptionen,
  laufzeitRabatt,
  mindestRam,
  minusEuro,
  MINECRAFT_GRUNDBETRAG,
  proZeitraum,
  ramOptionen,
  RECHNER_SPIELE,
  rechnung,
  VORGABE,
} from './konfigurator-daten';

/**
 * The rules of the two configurator pattern pages. `ui-demo` has no test
 * target, so this spec runs on its own:
 *
 *   npx vitest run projects/ui-demo/src/app/pages/muster/konfigurator-daten.spec.ts
 */
describe('Mindest-RAM je Version', () => {
  it('reads the minimum off the version', () => {
    expect(mindestRam('neueste')).toBe(4);
    expect(mindestRam('1.20.1')).toBe(2);
    expect(mindestRam('25w14a')).toBe(6);
  });

  it('falls back to the first version for an unknown value', () => {
    expect(mindestRam('gibt-es-nicht')).toBe(4);
  });
});

describe('Anheben', () => {
  it('leaves a big enough choice alone', () => {
    expect(angehobenerRam(8, 'neueste')).toBe(8);
    expect(angehobenerRam(4, 'neueste')).toBe(4);
  });

  it('raises to the smallest step the version allows', () => {
    expect(angehobenerRam(2, 'neueste')).toBe(4);
    expect(angehobenerRam(2, '25w14a')).toBe(6);
    expect(angehobenerRam(4, '25w14a')).toBe(6);
  });
});

describe('RAM-Optionen', () => {
  it('keeps the values as numbers, so nothing is converted on the way', () => {
    expect(ramOptionen('neueste').map((option) => option.value)).toEqual([2, 4, 6, 8, 12]);
    expect(laufzeitOptionen('normal', 4).map((option) => option.value)).toEqual([30, 90, 180]);
  });

  it('locks every step below the minimum and names the reason', () => {
    const optionen = ramOptionen('neueste');
    const zuKlein = optionen.filter((option) => option.disabled);

    expect(zuKlein.map((option) => option.value)).toEqual([2]);
    expect(zuKlein[0].disabledReason).toBe('zu wenig für 1.21');
  });

  it('marks exactly one step as recommended, the smallest allowed one', () => {
    const mitBadge = ramOptionen('neueste').filter((option) => option.badge);

    expect(mitBadge).toHaveLength(1);
    expect(mitBadge[0].value).toBe(4);
    expect(mitBadge[0].badge).toBe('Empfohlen');
  });

  it('moves the recommendation up with the version', () => {
    const optionen = ramOptionen('25w14a');

    expect(optionen.filter((option) => option.disabled).map((o) => o.value)).toEqual([2, 4]);
    expect(optionen.find((option) => option.badge)?.value).toBe(6);
  });
});

describe('Preis', () => {
  it('matches the 7,74 € of the previews for the default selection', () => {
    expect(proZeitraum(MINECRAFT_GRUNDBETRAG, 'normal', 4)).toBeCloseTo(7.74, 10);
    expect(euro(rechnung(VORGABE).summe)).toBe('7,74\u00a0€');
  });

  it('gives every term its discount', () => {
    expect(laufzeitRabatt(30)).toBe(0);
    expect(laufzeitRabatt(90)).toBe(0.06);
    expect(laufzeitRabatt(180)).toBe(0.09);
    expect(laufzeitRabatt(365)).toBe(0);
  });

  it('reaches the term prices of the OptionCard preview', () => {
    const preise = laufzeitOptionen('normal', 4).map((option) => option.price);

    expect(preise).toEqual(['7,74\u00a0€', '21,83\u00a0€', '42,26\u00a0€']);
  });

  it('prices every game from its own base amount', () => {
    const valheim = RECHNER_SPIELE.find((spiel) => spiel.titel === 'Valheim')!;
    const rust = RECHNER_SPIELE.find((spiel) => spiel.titel === 'Rust Dedicated Server')!;

    expect(rust.grundbetrag).toBeGreaterThan(valheim.grundbetrag);
    expect(rechnung({ ...VORGABE, grundbetrag: rust.grundbetrag }).summe).toBeGreaterThan(
      rechnung({ ...VORGABE, grundbetrag: valheim.grundbetrag }).summe,
    );
  });

  it('writes the "ab" price of a tile as the smallest combination that can be ordered', () => {
    for (const spiel of RECHNER_SPIELE) {
      const kleinste = rechnung({
        ...VORGABE,
        version: '1.20.1',
        klasse: 'budget',
        ramGb: 2,
        grundbetrag: spiel.grundbetrag,
      });

      expect(spiel.preis).toBe(`ab ${euro(kleinste.summe)} / 30\u00a0Tage`);
    }
  });

  it('rounds every part to the cent, so the lines really add up to the sum', () => {
    const neunzig = rechnung({ ...VORGABE, tage: 90 }, 'ZENIT10');

    expect(euro(neunzig.vorRabatt)).toBe('23,22\u00a0€');
    expect(euro(neunzig.laufzeitrabatt)).toBe('1,39\u00a0€');
    expect(euro(neunzig.gutschein)).toBe('0,77\u00a0€');
    // 23,22 − 1,39 − 0,77 is 21,06, and that is what the summary has to show.
    expect(neunzig.vorRabatt - neunzig.laufzeitrabatt - neunzig.gutschein).toBeCloseTo(21.06, 10);
    expect(euro(neunzig.summe)).toBe('21,06\u00a0€');
  });

  it('keeps the term prices of the preview under that rounding', () => {
    expect(euro(rechnung({ ...VORGABE, tage: 90 }).summe)).toBe('21,83\u00a0€');
    expect(euro(rechnung({ ...VORGABE, tage: 180 }).summe)).toBe('42,26\u00a0€');
  });

  it('rounds to the cent and nothing else', () => {
    expect(cent(1.3932)).toBe(1.39);
    expect(cent(0.774)).toBe(0.77);
    expect(cent(7.74)).toBe(7.74);
  });

  it('prices the raised RAM, not the one that was clicked', () => {
    const zuKlein = rechnung({ ...VORGABE, ramGb: 2 });

    expect(zuKlein.summe).toBeCloseTo(proZeitraum(MINECRAFT_GRUNDBETRAG, 'normal', 4), 10);
  });
});

describe('Gutschein', () => {
  it('takes ZENIT10 for 10 % of one period', () => {
    expect(gutscheinRabatt('zenit10')).toBe(0.1);
    expect(gutscheinFehler('ZENIT10')).toBe('');
    expect(minusEuro(rechnung(VORGABE, 'ZENIT10').gutschein)).toBe('−0,77\u00a0€');
  });

  it('takes it off one period only, not off every one of them', () => {
    const halbesJahr = rechnung({ ...VORGABE, tage: 180 }, 'ZENIT10');

    expect(euro(halbesJahr.gutschein)).toBe('0,77\u00a0€');
    expect(euro(halbesJahr.summe)).toBe('41,49\u00a0€');
  });

  it('names the reason for a code it refuses', () => {
    expect(gutscheinRabatt('SOMMER')).toBe(0);
    expect(gutscheinFehler('SOMMER')).toBe('Dieser Code ist am 31.08.2026 abgelaufen.');
    expect(gutscheinFehler('XYZ')).toBe('Diesen Code gibt es nicht. Prüfe die Schreibweise.');
    expect(gutscheinFehler('')).toBe('');
  });
});

describe('Flex', () => {
  it('reaches the hourly price of the CostChart preview at 4 GB', () => {
    expect(flexStundenpreis(4)).toBeCloseTo(0.088, 10);
  });

  it('caps a third above the monthly price', () => {
    expect(flexDeckel(7.74)).toBeCloseTo(10.32, 10);
  });
});

describe('Zahlenformat', () => {
  it('writes a comma and a non-breaking space', () => {
    expect(euro(0)).toBe('0,00\u00a0€');
    expect(euro(1.5)).toBe('1,50\u00a0€');
    expect(minusEuro(0.774)).toBe('−0,77\u00a0€');
  });
});
