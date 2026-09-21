import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BEISPIEL_SERVER, euro } from '../beispieldaten';
import { filtern, ListenZustand } from '../gameserver-data';
import { ServerList } from './server-list';

/**
 * The list is the one place where the states of 15-zustaende.md become markup,
 * so every state gets its building block checked here.
 */
describe('ServerList', () => {
  let fixture: ComponentFixture<ServerList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServerList],
    }).compileComponents();
  });

  async function zeige(
    zustand: ListenZustand,
    server: readonly (typeof BEISPIEL_SERVER)[number][] = BEISPIEL_SERVER,
  ): Promise<HTMLElement> {
    fixture = TestBed.createComponent(ServerList);
    fixture.componentRef.setInput('server', server);
    fixture.componentRef.setInput('zustand', zustand);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('zeigt eine Seite der Beispieldaten als Zeilen', async () => {
    const element = await zeige('liste');

    expect(element.querySelectorAll('.z-row').length).toBe(6);
    expect(element.querySelector('.z-row__title')?.textContent).toContain('Beispiel-Server 1');
    // Status als Wort in der zweiten Spalte, Betrag in mono.
    expect(element.querySelector('.z-badge')?.textContent).toContain('Online');
    expect(element.querySelector('.z-row__num')?.textContent?.trim()).toBe(euro(0.9));
    // Acht Server bei sechs pro Seite: die Pagination blendet sich ein.
    expect(element.querySelector('.z-pager')).not.toBeNull();
  });

  it('macht die Zeile zum Link und hält die Aktion daneben', async () => {
    const element = await zeige('liste');
    const zeile = element.querySelector('.z-row')!;
    const link = zeile.querySelector('a.z-row__link')!;
    const aktion = zeile.querySelector('button.z-row__action')!;

    expect(zeile.tagName).toBe('DIV');
    expect(link.textContent?.trim()).toBe('Beispiel-Server 1');
    // Ein button in einem a wäre ungültiges Markup und ein einziger Tab-Stopp.
    expect(link.querySelector('button')).toBeNull();
    expect(aktion.getAttribute('aria-label')).toBe('Weitere Aktionen für Beispiel-Server 1');
    // Die Id trägt der Dialog als restoreFocusTo.
    expect(aktion.id).toBe('aktionen-beispiel-server-1');
  });

  it('setzt Adresse und Port in mono, den Rest der Meta-Zeile nicht', async () => {
    const element = await zeige('liste');
    const meta = element.querySelector('.z-row__meta')!;

    expect(meta.querySelector('.z-mono')?.textContent).toBe('203.0.113.10:25565');
    expect(meta.textContent).toContain('Minecraft · PaperMC 26.3');
  });

  it('meldet den Ladezustand in einer Live-Region, die immer dasteht', async () => {
    const element = await zeige('liste');
    const bereich = element.querySelector('[role="status"]')!;

    expect(bereich.classList).toContain('z-visually-hidden');
    expect(bereich.textContent?.trim()).toBe('');

    fixture.componentRef.setInput('zustand', 'skelett');
    await fixture.whenStable();

    expect(element.querySelector('[role="status"]')?.textContent?.trim()).toBe(
      'Server werden geladen',
    );
  });

  it('behält die Seite, solange es sie gibt, und kappt sie sonst', async () => {
    const element = await zeige('liste');
    const weiter = element.querySelectorAll<HTMLButtonElement>('.z-pager__nav button')[1];
    const seitenzahl = () => element.querySelector('.z-pager__nav .z-mono')?.textContent;

    weiter.click();
    await fixture.whenStable();
    expect(seitenzahl()).toBe('2 / 2');
    expect(element.querySelector('.z-row__title')?.textContent).toContain('Beispiel-Server 6');

    // Ein Server weniger: sieben passen noch auf zwei Seiten, also bleibt Seite 2.
    fixture.componentRef.setInput('server', BEISPIEL_SERVER.slice(1));
    await fixture.whenStable();
    expect(seitenzahl()).toBe('2 / 2');

    // Sechs passen auf eine Seite: die Seite wird gekappt, nicht zurückgesetzt.
    fixture.componentRef.setInput('server', BEISPIEL_SERVER.slice(0, 6));
    await fixture.whenStable();
    expect(element.querySelectorAll('.z-row').length).toBe(6);
    expect(element.querySelector('.z-pager')).toBeNull();
  });

  it('setzt den Fokus auf die nachrückende Zeile, wenn eine Zeile verschwindet', async () => {
    await zeige('liste');
    const geloescht = BEISPIEL_SERVER[0];

    fixture.componentInstance.fokusNachEntfernen(geloescht);
    fixture.componentRef.setInput(
      'server',
      BEISPIEL_SERVER.filter((eintrag) => eintrag.id !== geloescht.id),
    );
    await fixture.whenStable();

    expect(document.activeElement?.id).toBe('aktionen-beispiel-server-2');
  });

  it('setzt den Fokus auf die letzte Zeile, wenn die letzte verschwindet', async () => {
    const sechs = BEISPIEL_SERVER.slice(0, 6);
    const element = await zeige('liste', sechs);
    const geloescht = sechs[5];

    fixture.componentInstance.fokusNachEntfernen(geloescht);
    fixture.componentRef.setInput('server', sechs.slice(0, 5));
    await fixture.whenStable();

    expect(element.querySelectorAll('.z-row').length).toBe(5);
    expect(document.activeElement?.id).toBe(`aktionen-${sechs[4].id}`);
  });

  it('zeigt weniger Zeilen, wenn der Filter weniger Server liefert', async () => {
    const element = await zeige('liste', filtern(BEISPIEL_SERVER, '', 'Online'));

    expect(element.querySelectorAll('.z-row').length).toBe(2);
    expect(element.textContent).toContain('Beispiel-Server 1');
    expect(element.textContent).not.toContain('Beispiel-Server 2');
    // Eine Seite reicht: keine Pagination.
    expect(element.querySelector('.z-pager')).toBeNull();
  });

  it('zeigt Skelettzeilen und meldet das Panel als beschäftigt', async () => {
    const element = await zeige('skelett');

    expect(element.querySelectorAll('.z-skel').length).toBeGreaterThan(0);
    expect(element.querySelector('.z-panel')?.getAttribute('aria-busy')).toBe('true');
    expect(element.textContent).not.toContain('Beispiel-Server 1');
  });

  it('zeigt den leeren Zustand mit einer zweitrangigen Aktion', async () => {
    const element = await zeige('leer', []);

    const leer = element.querySelector('.z-empty');
    expect(leer?.textContent).toContain('Du hast noch keinen Server');
    expect(leer?.querySelector('.z-btn--secondary')?.textContent).toContain('Server erstellen');
    expect(element.querySelector('.z-pager')).toBeNull();
  });

  it('zeigt einen eigenen Satz, wenn der Filter nichts trifft', async () => {
    const element = await zeige('gefiltert-leer', []);

    expect(element.querySelector('.z-empty')?.textContent).toContain(
      'Kein Server passt zum Filter',
    );
  });

  it('zeigt im Fehlerfall einen Alert statt der Liste', async () => {
    const element = await zeige('fehler', []);

    const alert = element.querySelector('.z-alert');
    expect(alert?.classList.contains('z-alert--danger')).toBe(true);
    expect(alert?.textContent).toContain('Die Serverliste ist nicht geladen');
    expect(element.querySelector('.z-panel')).toBeNull();
  });
});

describe('filtern', () => {
  it('sucht über Name und Adresse', () => {
    expect(filtern(BEISPIEL_SERVER, 'test', 'Alle Status').map((s) => s.name)).toEqual(['Test']);
    expect(filtern(BEISPIEL_SERVER, '203.0.113.16', 'Alle Status').map((s) => s.name)).toEqual([
      'Beispiel-Server 6',
    ]);
  });

  it('grenzt auf einen Status ein und lässt sich zurücksetzen', () => {
    expect(filtern(BEISPIEL_SERVER, '', 'Gesperrt').length).toBe(1);
    expect(filtern(BEISPIEL_SERVER, '', 'Alle Status').length).toBe(BEISPIEL_SERVER.length);
  });
});
