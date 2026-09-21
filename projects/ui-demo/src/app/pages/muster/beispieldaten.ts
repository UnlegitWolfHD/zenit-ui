/*
 * Shared example data for the three pattern pages. Everything here stays
 * recognisable as a demo: server names "Beispiel-…" and "Test", addresses only
 * from 203.0.113.0/24 (TEST-NET-3, RFC 5737) and the single user "K". No real
 * customer data, no real prices, no foreign images.
 */
import { ZBadgeStatus, ZConsoleLine, ZSpecItem } from 'zenit-ui';

/** Eine Zeile der Serverliste im Dashboard. */
export interface BeispielServer {
  name: string;
  meta: string;
  status: ZBadgeStatus;
  statusText: string;
  kosten: string;
}

/** Eine Zeile der FileTable im Server-Panel. */
export interface BeispielDatei {
  name: string;
  icon: string;
  groesse: string;
  geaendert: string;
}

/** Eine Spielkachel des Rechners auf der Startseite. */
export interface BeispielSpiel {
  titel: string;
  preis: string;
  /** Monatlicher Grundpreis in Euro, wie er auf der Kachel steht. */
  grundpreis: number;
}

export const NUTZER = 'K';
export const GUTHABEN = '25,00\u00a0€';
export const PANEL_SERVER = 'Beispiel-Server 1';
export const PANEL_ADRESSE = '203.0.113.10:25565';

export const KUNDEN_LINKS = [
  'Dashboard',
  'Gameserver',
  'Hosting',
  'Domains',
  'Abrechnung',
  'Support',
];

export const OEFFENTLICHE_LINKS = ['Minecraft', 'Preise', 'Hardware', 'Wiki', 'Vorschläge'];

/** Alle sechs Status aus 15-zustaende.md, je einmal. */
export const SERVER: BeispielServer[] = [
  {
    name: 'Beispiel-Server 1',
    meta: 'Minecraft · PaperMC 26.3 · 203.0.113.10',
    status: 'success',
    statusText: 'Online',
    kosten: '0,90',
  },
  {
    name: 'Beispiel-Server 2',
    meta: 'Minecraft · Vanilla · 203.0.113.11',
    status: 'warning',
    statusText: 'Startet',
    kosten: '0,53',
  },
  {
    name: 'Beispiel-Server 3',
    meta: 'Counter-Strike 2 · zuletzt am 18.09.2026, 15:55',
    status: 'neutral',
    statusText: 'Gestoppt',
    kosten: '0,41',
  },
  {
    name: 'Beispiel-Server 4',
    meta: 'Minecraft · Fabric · in etwa 60 Sekunden bereit',
    status: 'info',
    statusText: 'Wird installiert',
    kosten: '0,00',
  },
  {
    name: 'Test',
    meta: 'Counter-Strike 2 · noch nie gestartet',
    status: 'danger',
    statusText: 'Fehlgeschlagen',
    kosten: '0,65',
  },
  {
    name: 'Beispiel-Server 5',
    meta: 'Minecraft · PaperMC 26.3 · Guthaben leer',
    status: 'danger',
    statusText: 'Gesperrt',
    kosten: '1,24',
  },
];

export const LOGZEILEN: ZConsoleLine[] = [
  { time: '[12:04:27]', text: 'Starting minecraft server version 1.21.4' },
  { time: '[12:04:29]', text: 'Preparing level "world"' },
  { time: '[12:04:31]', text: 'Done (4.213s)! For help, type "help"' },
  {
    time: '[12:06:02]',
    text: "WARN Can't keep up! Is the server overloaded? Running 2140ms behind",
    level: 'warn',
  },
  {
    time: '[12:06:40]',
    text: "ERROR Could not load 'plugins/WorldGuard.jar': missing dependency WorldEdit",
    level: 'error',
  },
  { time: '[12:07:15]', text: '> whitelist add Steve', level: 'cmd' },
  { time: '[12:07:15]', text: 'Added Steve to the whitelist' },
];

export const DATEIEN: BeispielDatei[] = [
  { name: 'plugins', icon: 'folder', groesse: '', geaendert: '04.09.2026, 05:53' },
  { name: 'world', icon: 'folder', groesse: '', geaendert: '21.09.2026, 13:55' },
  { name: 'server.jar', icon: 'description', groesse: '61,25 MB', geaendert: '18.09.2026, 14:45' },
  {
    name: 'server.properties',
    icon: 'description',
    groesse: '1,74 KB',
    geaendert: '18.09.2026, 15:55',
  },
];

/** Werte von /hardware, Node Normal. */
export const TECHNIK: ZSpecItem[] = [
  { term: 'Standort', value: 'Nürnberg, Deutschland', note: 'DSGVO-konform' },
  { term: 'Prozessor', value: 'AMD Ryzen 9 5950X', note: '16C / 32T, 4,9 GHz', mono: true },
  { term: 'Arbeitsspeicher', value: 'DDR4 ECC', note: '3600 MHz', mono: true },
  { term: 'Speicher', value: 'NVMe SSD PCIe 4.0', note: 'RAID-Z1', mono: true },
  { term: 'Anbindung', value: '1 Gbit/s', note: 'DDoS-Schutz auf Layer 3/4 inklusive', mono: true },
  { term: 'Abrechnung', value: 'Nach Stunden, monatlich gedeckelt' },
];

export const SPIELE: BeispielSpiel[] = [
  { titel: 'Terraria', preis: 'ab 1,98 € / Monat', grundpreis: 1.98 },
  { titel: 'Valheim', preis: 'ab 2,70 € / Monat', grundpreis: 2.7 },
  { titel: '7 Days to Die', preis: 'ab 3,95 € / Monat', grundpreis: 3.95 },
  { titel: 'Rust Dedicated Server', preis: 'ab 9,43 € / Monat', grundpreis: 9.43 },
];

/** Komma als Dezimalzeichen, geschütztes Leerzeichen vor der Währung. */
export function euro(betrag: number): string {
  return `${betrag.toFixed(2).replace('.', ',')}\u00a0€`;
}
