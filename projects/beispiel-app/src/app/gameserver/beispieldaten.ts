/*
 * Sample data of this example. Everything here stays recognisable as an
 * example: server names "Beispiel-Server …" and "Test", addresses only from
 * 203.0.113.0/24 (TEST-NET-3, RFC 5737) and the single user "K". No real
 * customer data, no real prices, no foreign images.
 *
 * This is the one file a real application throws away, together with the timer
 * in GameserverData.
 */
import { ZBadgeStatus } from 'zenit-ui';

/** One row of the server list. */
export interface BeispielServer {
  /** Stable key for @for and for the detail route of a real application. */
  id: string;
  name: string;
  /** Address with port. Shown in mono wherever it appears. */
  adresse: string;
  /** Second line of the first column: game, version and address. */
  meta: string;
  /** Color of the status badge. */
  status: ZBadgeStatus;
  /** The status as a word. The color alone carries no meaning (Badge README). */
  statusText: string;
  /** Neutral tag, never a status color. */
  tarif: string;
  /** Cost so far this month, in euro. Formatted by {@link euro}. */
  kosten: number;
}

/**
 * U+00A0. Written as a code point, because an invisible character in the
 * source is a trap for whoever copies this file.
 */
const GESCHUETZTES_LEERZEICHEN = String.fromCharCode(0xa0);

/**
 * Number format of the design system (CLAUDE.md, "Sprache"): comma as the
 * decimal mark and a non-breaking space before the currency, so that amount and
 * sign never break apart at the end of a line.
 */
export function euro(betrag: number): string {
  return betrag.toFixed(2).replace('.', ',') + GESCHUETZTES_LEERZEICHEN + '€';
}

/** Initial of the single user, shown in the avatar. */
export const NUTZER = 'K';

/** Credit in the header, in mono. */
export const GUTHABEN = euro(25);

/**
 * The six links of the customer area plus the page that explains this example.
 * Only the two with a route exist here; the others keep the header in its real
 * shape.
 */
export const KUNDEN_LINKS: readonly { name: string; route?: string }[] = [
  { name: 'Dashboard' },
  { name: 'Gameserver', route: '/gameserver' },
  { name: 'Hosting' },
  { name: 'Domains' },
  { name: 'Abrechnung' },
  { name: 'Support' },
  { name: 'Einbindung', route: '/einbindung' },
];

/** Options of the status filter. The first one names the normal case (Select README). */
export const STATUS_FILTER: readonly string[] = [
  'Alle Status',
  'Online',
  'Startet',
  'Gestoppt',
  'Wird installiert',
  'Fehlgeschlagen',
  'Gesperrt',
];

/**
 * Eight servers, so that the list has two pages. The first six carry the six
 * server states of 15-zustaende.md, each with the badge word that belongs to
 * it.
 */
export const BEISPIEL_SERVER: readonly BeispielServer[] = [
  {
    id: 'beispiel-server-1',
    name: 'Beispiel-Server 1',
    adresse: '203.0.113.10:25565',
    meta: 'Minecraft · PaperMC 26.3 · 203.0.113.10',
    status: 'success',
    statusText: 'Online',
    tarif: 'Flex',
    kosten: 0.9,
  },
  {
    id: 'beispiel-server-2',
    name: 'Beispiel-Server 2',
    adresse: '203.0.113.11:25565',
    meta: 'Minecraft · Vanilla · 203.0.113.11',
    status: 'warning',
    statusText: 'Startet',
    tarif: 'Flex',
    kosten: 0.53,
  },
  {
    id: 'beispiel-server-3',
    name: 'Beispiel-Server 3',
    adresse: '203.0.113.12:27015',
    meta: 'Counter-Strike 2 · 203.0.113.12 · zuletzt am 18.09.2026, 15:55',
    status: 'neutral',
    statusText: 'Gestoppt',
    tarif: 'Flex',
    kosten: 0.41,
  },
  {
    id: 'beispiel-server-4',
    name: 'Beispiel-Server 4',
    adresse: '203.0.113.13:25565',
    meta: 'Minecraft · Fabric · in etwa 60 Sekunden bereit',
    status: 'info',
    statusText: 'Wird installiert',
    tarif: 'Flex',
    kosten: 0,
  },
  {
    id: 'test',
    name: 'Test',
    adresse: '203.0.113.14:27015',
    meta: 'Counter-Strike 2 · 203.0.113.14 · noch nie gestartet',
    status: 'danger',
    statusText: 'Fehlgeschlagen',
    tarif: 'Flex',
    kosten: 0.65,
  },
  {
    id: 'beispiel-server-5',
    name: 'Beispiel-Server 5',
    adresse: '203.0.113.15:25565',
    meta: 'Minecraft · PaperMC 26.3 · 203.0.113.15 · Guthaben leer',
    status: 'danger',
    statusText: 'Gesperrt',
    tarif: 'Flex',
    kosten: 1.24,
  },
  {
    id: 'beispiel-server-6',
    name: 'Beispiel-Server 6',
    adresse: '203.0.113.16:2456',
    meta: 'Valheim · 203.0.113.16',
    status: 'success',
    statusText: 'Online',
    tarif: 'Flex',
    kosten: 0.37,
  },
  {
    id: 'beispiel-server-7',
    name: 'Beispiel-Server 7',
    adresse: '203.0.113.17:7777',
    meta: 'Terraria · 203.0.113.17',
    status: 'neutral',
    statusText: 'Gestoppt',
    tarif: 'Flex',
    kosten: 0.12,
  },
];
