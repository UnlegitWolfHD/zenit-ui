// Type-only, so the module carries no import at runtime and a plain vitest run
// of the spec beside it needs no path alias.
import type { ZComboOption, ZOption } from 'zenit-ui';
import { SPIELE } from './beispieldaten';

/*
 * Example data and the whole price and rule logic of the two configurator
 * pattern pages, as pure functions so a spec can check them without a browser.
 *
 * The numbers are the ones from the previews under spec/components and are
 * made up for this demo; the pages say so. Rounding to the cent happens in the
 * view, never in here, so a discount of a third of a cent does not disappear
 * before the sum is built.
 */

/**
 * Base amount of a Minecraft order per 30 days, before the performance class.
 * Every game has one; this is the one the order page runs on.
 */
export const MINECRAFT_GRUNDBETRAG = 1.74;

/** Base amount per month of the flex calculation, independent of the size. */
export const FLEX_GRUNDBETRAG = 1.5;

/** Price per hour and GB in the flex calculation, unrounded. */
export const FLEX_JE_GB_STUNDE = 0.022;

/** One Minecraft version of the example list. */
export interface DemoVersion extends ZComboOption {
  /** How the version is named inside a sentence, for example "1.21". */
  kurz: string;
  /** Least amount of RAM in GB the version runs on. */
  mindestRam: number;
}

/** Server types, word for word from OptionCard/preview.html. */
export const SERVER_TYPEN: ZOption[] = [
  { value: 'vanilla', title: 'Vanilla', description: 'Pures Minecraft ohne Plugins oder Mods.' },
  { value: 'plugins', title: 'Plugins', description: 'Paper oder Purpur mit Plugins.' },
  { value: 'mods', title: 'Mods', description: 'Fabric, Forge, NeoForge oder Quilt.' },
  {
    value: 'modpack',
    title: 'Modpack',
    description: 'Du wählst das Pack, der Rest kommt automatisch.',
  },
];

/** Performance classes, word for word from OptionCard/preview.html. */
export const KLASSEN: ZOption[] = [
  {
    value: 'budget',
    title: 'Budget',
    description: 'Für einfache Vanilla-Server.',
    price: '1,25\u00a0€ / GB RAM',
  },
  {
    value: 'normal',
    title: 'Normal',
    description: 'Für Modpacks und mehr Spieler.',
    price: '1,50\u00a0€ / GB RAM',
  },
];

/** Price per GB and 30 days of each performance class. */
const KLASSENPREIS: Record<string, number> = { budget: 1.25, normal: 1.5 };

/** The smallest RAM step, which is what an "ab" price is built on. */
export const KLEINSTE_RAM_STUFE = 2;

/** The RAM steps of the example, with the player counts from the preview. */
export const RAM_STUFEN = [
  { gb: 2, spieler: 'etwa 5 Spieler' },
  { gb: 4, spieler: 'etwa 10 Spieler' },
  { gb: 6, spieler: 'etwa 15 Spieler' },
  { gb: 8, spieler: 'etwa 20 Spieler' },
  { gb: 12, spieler: 'etwa 30 Spieler' },
];

/** Versions in the three groups the Combobox README asks for. */
export const VERSIONEN: DemoVersion[] = [
  {
    value: 'neueste',
    label: 'Neueste',
    kurz: '1.21',
    note: 'mindestens 4 GB',
    group: 'Aktuell',
    mindestRam: 4,
  },
  {
    value: '1.21.11',
    label: '1.21.11',
    kurz: '1.21.11',
    note: 'mindestens 4 GB',
    group: 'Aktuell',
    mindestRam: 4,
  },
  {
    value: '1.21.4',
    label: '1.21.4',
    kurz: '1.21.4',
    note: 'mindestens 4 GB',
    group: 'Aktuell',
    mindestRam: 4,
  },
  {
    value: '1.20.6',
    label: '1.20.6',
    kurz: '1.20.6',
    note: 'mindestens 2 GB',
    group: 'Ältere',
    mindestRam: 2,
  },
  {
    value: '1.20.1',
    label: '1.20.1',
    kurz: '1.20.1',
    note: 'mindestens 2 GB',
    group: 'Ältere',
    mindestRam: 2,
  },
  {
    value: '1.12.2',
    label: '1.12.2',
    kurz: '1.12.2',
    note: 'mindestens 2 GB',
    group: 'Ältere',
    mindestRam: 2,
  },
  {
    value: '25w14a',
    label: '25w14a',
    kurz: '25w14a',
    note: 'mindestens 6 GB',
    group: 'Snapshots',
    mindestRam: 6,
  },
];

/** Java versions of the expert mode. */
export const JAVA_VERSIONEN: ZComboOption[] = [
  { value: 'auto', label: 'Automatisch (Java 25)', note: 'passt zur Version' },
  { value: '21', label: 'Java 21' },
  { value: '17', label: 'Java 17' },
];

/** Payment methods. Four of them, as cards, not as tiles with logos. */
export const BEZAHLMETHODEN: ZOption[] = [
  { value: 'paypal', title: 'PayPal', description: 'Sofort freigeschaltet.' },
  { value: 'karte', title: 'Kreditkarte', description: 'Visa und Mastercard.' },
  { value: 'sepa', title: 'SEPA-Lastschrift', description: 'Einzug nach 2 Tagen.' },
  { value: 'guthaben', title: 'Guthaben', description: 'Aus deinem Konto.' },
];

/**
 * The games of the calculator with the base amount they carry. The tile price
 * is not written down: it is the smallest combination that can really be
 * ordered, so the "ab" on the tile and the summary can never drift apart.
 */
export const RECHNER_SPIELE = SPIELE.map((spiel) => ({
  titel: spiel.titel,
  grundbetrag: spiel.grundpreis,
  preis: `ab ${euro(proZeitraum(spiel.grundpreis, 'budget', KLEINSTE_RAM_STUFE))} / 30\u00a0Tage`,
}));

/** The three terms with their discount. */
export const LAUFZEITEN = [
  { tage: 30, rabatt: 0 },
  { tage: 90, rabatt: 0.06 },
  { tage: 180, rabatt: 0.09 },
];

/** What every plan carries, word for word from IncludedList/preview.html. */
export const ENTHALTEN = [
  'DDoS-Schutz auf Layer 3/4',
  'Webpanel mit Konsole und Dateimanager',
  'Automatische Backups',
  'Support per Ticket und Discord',
];

/** The one voucher that works in this example, and its share. */
const GUTSCHEINE: Record<string, number> = { ZENIT10: 0.1 };

/** A voucher that is refused, with the reason from InputAction/preview.html. */
const ABGELAUFEN: Record<string, string> = {
  SOMMER: 'Dieser Code ist am 31.08.2026 abgelaufen.',
};

/** The whole selection of the order. */
export interface DemoAuswahl {
  /** Value of a `SERVER_TYPEN` entry. */
  typ: string;
  /** Value of a `VERSIONEN` entry. */
  version: string;
  /** Chosen RAM in GB. */
  ramGb: number;
  /** Value of a `KLASSEN` entry. */
  klasse: string;
  /** Term in days: 30, 90 or 180. */
  tage: number;
  /** Value of a `BEZAHLMETHODEN` entry, empty until it is chosen. */
  bezahlung: string;
  /** Base amount of the game per 30 days. */
  grundbetrag: number;
}

/** The parts of a price, each already rounded to the cent. */
export interface DemoRechnung {
  /** Price of 30 days before any discount. */
  proZeitraum: number;
  /** Price of the whole term before any discount. */
  vorRabatt: number;
  /** What the term takes off. */
  laufzeitrabatt: number;
  /** What the voucher takes off, one period's worth. */
  gutschein: number;
  /** What is left to pay. */
  summe: number;
}

/** The smallest selection that is valid and orderable on its own. */
export const VORGABE: DemoAuswahl = {
  typ: 'vanilla',
  version: 'neueste',
  ramGb: 4,
  klasse: 'normal',
  tage: 30,
  bezahlung: '',
  grundbetrag: MINECRAFT_GRUNDBETRAG,
};

/**
 * Looks a version up.
 *
 * @param version The value of a version.
 * @returns The entry, or the first one for an unknown value.
 */
export function version(version: string): DemoVersion {
  return VERSIONEN.find((eintrag) => eintrag.value === version) ?? VERSIONEN[0];
}

/**
 * Least amount of RAM a version runs on.
 *
 * @param wert The value of a version.
 * @returns The minimum in GB.
 */
export function mindestRam(wert: string): number {
  return version(wert).mindestRam;
}

/**
 * Raises a RAM choice to the smallest step the version allows. This is the one
 * place where one selection moves another, and the page says so under the
 * field.
 *
 * @param ramGb The chosen amount in GB.
 * @param wert The value of a version.
 * @returns The amount that is really ordered.
 */
export function angehobenerRam(ramGb: number, wert: string): number {
  const minimum = mindestRam(wert);
  if (ramGb >= minimum) {
    return ramGb;
  }
  return RAM_STUFEN.find((stufe) => stufe.gb >= minimum)?.gb ?? minimum;
}

/**
 * The RAM steps as option cards: too small a step is locked and says why, the
 * smallest allowed one carries the badge "Empfohlen".
 *
 * @param wert The value of a version.
 * @returns The cards in ascending order.
 */
export function ramOptionen(wert: string): ZOption<number>[] {
  const eintrag = version(wert);
  const empfohlen = angehobenerRam(eintrag.mindestRam, wert);
  return RAM_STUFEN.map((stufe) => ({
    value: stufe.gb,
    title: `${stufe.gb}\u00a0GB`,
    description: stufe.spieler,
    badge: stufe.gb === empfohlen ? 'Empfohlen' : undefined,
    badgeStatus: 'info' as const,
    disabled: stufe.gb < eintrag.mindestRam,
    disabledReason: `zu wenig für ${eintrag.kurz}`,
  }));
}

/**
 * The terms as compact option cards, with the discount as a badge and the real
 * price of the term.
 *
 * @param klasse Value of a performance class.
 * @param ramGb Chosen RAM in GB.
 * @returns The cards in ascending order.
 */
export function laufzeitOptionen(
  klasse: string,
  ramGb: number,
  grundbetrag = MINECRAFT_GRUNDBETRAG,
): ZOption<number>[] {
  return LAUFZEITEN.map(({ tage, rabatt }) => ({
    value: tage,
    title: `${tage}\u00a0Tage`,
    price: euro(rechnung({ ...VORGABE, klasse, ramGb, tage, grundbetrag }).summe),
    badge: rabatt ? `−${Math.round(rabatt * 100)}\u00a0%` : undefined,
    badgeStatus: 'success' as const,
  }));
}

/**
 * The discount a term brings.
 *
 * @param tage The term in days.
 * @returns The share, 0 for an unknown term.
 */
export function laufzeitRabatt(tage: number): number {
  return LAUFZEITEN.find((eintrag) => eintrag.tage === tage)?.rabatt ?? 0;
}

/**
 * The share a voucher takes off one period. Case does not matter.
 *
 * @param code What was typed in.
 * @returns The share, 0 when the code is unknown or refused.
 */
export function gutscheinRabatt(code: string): number {
  return GUTSCHEINE[code.trim().toUpperCase()] ?? 0;
}

/**
 * Why a voucher is refused.
 *
 * @param code What was typed in.
 * @returns The sentence, or the empty string when the code works.
 */
export function gutscheinFehler(code: string): string {
  const oben = code.trim().toUpperCase();
  if (!oben || GUTSCHEINE[oben]) {
    return '';
  }
  return ABGELAUFEN[oben] ?? 'Diesen Code gibt es nicht. Prüfe die Schreibweise.';
}

/** Rounds to the cent. Every part of a price goes through this once. */
export function cent(betrag: number): number {
  return Math.round(betrag * 100) / 100;
}

/**
 * The price of 30 days: the base amount of the game plus the performance class
 * per GB.
 *
 * @param grundbetrag Base amount of the game per 30 days.
 * @param klasse Value of a performance class.
 * @param ramGb Chosen RAM in GB.
 * @returns The amount, rounded to the cent.
 */
export function proZeitraum(grundbetrag: number, klasse: string, ramGb: number): number {
  return cent(grundbetrag + (KLASSENPREIS[klasse] ?? KLASSENPREIS['normal']) * ramGb);
}

/**
 * The whole calculation. The voucher works on one period, the way the sentence
 * under the field says ("10 % auf die erste Laufzeit").
 *
 * @param auswahl The selection.
 * @param gutscheinCode The voucher that was redeemed, if any.
 * @returns Every part of the price, unrounded.
 */
export function rechnung(auswahl: DemoAuswahl, gutscheinCode = ''): DemoRechnung {
  // Every part is rounded to the cent before the sum is built, so the lines a
  // customer reads really add up to the amount below them.
  const einZeitraum = proZeitraum(
    auswahl.grundbetrag,
    auswahl.klasse,
    angehobenerRam(auswahl.ramGb, auswahl.version),
  );
  const vorRabatt = cent(einZeitraum * (auswahl.tage / 30));
  const laufzeitrabatt = cent(vorRabatt * laufzeitRabatt(auswahl.tage));
  const gutschein = cent(einZeitraum * gutscheinRabatt(gutscheinCode));
  return {
    proZeitraum: einZeitraum,
    vorRabatt,
    laufzeitrabatt,
    gutschein,
    summe: cent(vorRabatt - laufzeitrabatt - gutschein),
  };
}

/**
 * The cap of the flex calculation: a third more than the monthly price.
 *
 * @param monatspreis Price of 30 days.
 * @returns The amount, unrounded.
 */
export function flexDeckel(monatspreis: number): number {
  return (monatspreis * 4) / 3;
}

/**
 * The hourly price of the flex calculation, unrounded. The chart computes the
 * cap hour from this value, not from the 0,09 € it prints.
 *
 * @param ramGb Chosen RAM in GB.
 * @returns The amount per hour.
 */
export function flexStundenpreis(ramGb: number): number {
  return FLEX_JE_GB_STUNDE * ramGb;
}

/** Comma as the decimal mark, non-breaking space before the currency. */
export function euro(betrag: number): string {
  return `${betrag.toFixed(2).replace('.', ',')}\u00a0€`;
}

/** The same amount as a deduction, with the real minus sign U+2212. */
export function minusEuro(betrag: number): string {
  return `−${euro(betrag)}`;
}
