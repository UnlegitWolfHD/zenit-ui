import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  ZAppHeader,
  ZBrand,
  ZButton,
  ZFooter,
  ZFooterBase,
  ZFooterCol,
  ZHeaderEnd,
  ZHeaderLink,
  ZIcon,
  ZMetric,
  ZMetrics,
  ZPageHeader,
  ZPanel,
  ZRow,
  ZRowMain,
  ZRows,
  ZSidebar,
  ZSidebarGroup,
  ZSidebarItem,
  ZStepper,
  ZTab,
  ZTabs,
} from 'zenit-ui';

interface SeitenEintrag {
  icon: string;
  text: string;
  count?: number;
}

@Component({
  selector: 'demo-navigation-page',
  imports: [
    ZAppHeader,
    ZBrand,
    ZButton,
    ZFooter,
    ZFooterBase,
    ZFooterCol,
    ZHeaderEnd,
    ZHeaderLink,
    ZIcon,
    ZMetric,
    ZMetrics,
    ZPageHeader,
    ZPanel,
    ZRow,
    ZRowMain,
    ZRows,
    ZSidebar,
    ZSidebarGroup,
    ZSidebarItem,
    ZStepper,
    ZTab,
    ZTabs,
  ],
  template: `
    <h1 class="heading-1 demo-title">Navigation</h1>
    <p class="demo-lead">
      Tabs, Stepper, Sidebar, AppHeader, PageHeader und Footer. Hover und Fokus zeigen sich beim
      Bedienen: Zeiger darüber für Hover, Tabulator für den Fokus-Ring. Beispieldaten: Nutzer K mit
      25,00&nbsp;€ Guthaben.
    </p>

    <section class="demo-section">
      <h2 class="heading-2">Tabs</h2>
      <p class="demo-cap caption">
        Links in einer nav, je Tab eine eigene Adresse. Der aktive Tab trägt aria-current="page" und
        die 2px-Linie. Hier setzt der Klick nur den aktiven Tab, die Adresse bleibt stehen.
      </p>
      <nav zTabs aria-label="Hosting">
        @for (tab of tabs; track tab) {
          <a zTab href="#" [active]="aktiverTab() === tab" (click)="waehleTab(tab, $event)">{{
            tab
          }}</a>
        }
      </nav>
      <p class="demo-grund caption">Aktiv: {{ aktiverTab() }}</p>
    </section>

    <section class="demo-section">
      <h2 class="heading-2">Stepper</h2>
      <p class="demo-cap caption">
        Die drei Schritte des Bestellassistenten mit current 0, 1 und 2. Der aktuelle Schritt trägt
        aria-current="step", die Schritte davor sind erledigt.
      </p>
      <z-stepper [steps]="schritte" [current]="0" />
      <z-stepper [steps]="schritte" [current]="1" />
      <z-stepper [steps]="schritte" [current]="2" />
    </section>

    <section class="demo-section">
      <h2 class="heading-2">Sidebar</h2>
      <p class="demo-cap caption">
        Vier Gruppen mit zusammen zwölf Einträgen. Der aktive Eintrag trägt aria-current="page", nur
        dort ist das Icon farbig. Der Zähler steht rechts in mono. Unter 900px steht statt der Liste
        ein Select über dem Inhalt.
      </p>
      <div class="z-panel-shell">
        <z-sidebar ariaLabel="Minecraft-Panel">
          @for (gruppe of gruppen; track gruppe.titel) {
            <z-sidebar-group [label]="gruppe.titel">
              @for (eintrag of gruppe.eintraege; track eintrag.text) {
                <button
                  type="button"
                  zSidebarItem
                  [icon]="eintrag.icon"
                  [count]="eintrag.count ?? null"
                  [active]="bereich() === eintrag.text"
                  (click)="bereich.set(eintrag.text)"
                >
                  {{ eintrag.text }}
                </button>
              }
            </z-sidebar-group>
          }
        </z-sidebar>
        <div class="z-stack">
          <z-panel [title]="bereich()">
            <p class="demo-sub">
              Beispiel-Server 1, PaperMC, 203.0.113.10:25565. Der Inhalt wechselt mit dem gewählten
              Bereich.
            </p>
          </z-panel>
          <z-panel flush>
            <z-metrics>
              <z-metric label="CPU" value="0,2" unit="%" [percent]="0.2" />
              <z-metric label="RAM" value="1,16" unit="/ 8,4&nbsp;GB" [percent]="14" />
              <z-metric label="Spieler" value="2" unit="/ 20" [percent]="10" />
            </z-metrics>
          </z-panel>
          <z-panel title="Spieler" flush>
            <z-rows columns="minmax(0, 1fr) 96px">
              @for (eintrag of spieler; track eintrag.name) {
                <div zRow>
                  <z-row-main [title]="eintrag.name" [meta]="eintrag.meta" />
                  <span class="z-muted">{{ eintrag.rolle }}</span>
                </div>
              }
            </z-rows>
          </z-panel>
        </div>
      </div>
    </section>

    <section class="demo-section">
      <h2 class="heading-2">AppHeader</h2>
      <p class="demo-cap caption">
        Kundenbereich: Marke, sechs Links, rechts Guthaben und Avatar. Die Leiste steht hier zur
        Ansicht in einem Panel und ist nicht fixiert, weil diese Demo schon eine Kopfzeile hat.
        Unter 900px klappt die Navigation in ein Menü, das Guthaben bleibt sichtbar.
      </p>
      <z-panel flush>
        <z-app-header navLabel="Hauptnavigation">
          <span zBrand>Zenit</span>
          @for (link of kundenLinks; track link) {
            <a
              zHeaderLink
              href="#"
              [active]="link === 'Gameserver'"
              (click)="$event.preventDefault()"
              >{{ link }}</a
            >
          }
          <a
            zHeaderLink
            zHeaderEnd
            class="z-mono"
            href="#"
            aria-label="Guthaben 25,00 Euro, zur Abrechnung"
            (click)="$event.preventDefault()"
            >25,00&nbsp;€</a
          >
          <span zHeaderEnd class="z-avatar" aria-hidden="true">K</span>
        </z-app-header>
      </z-panel>

      <p class="demo-cap caption">
        Öffentlich: dieselbe Leiste mit anderen Links, rechts Anmelden als ghost und Server
        erstellen als primary in sm. Zustandsübersicht: hier stehen mehrere primäre Buttons
        nebeneinander, auf einer echten Seite ist es höchstens einer je Bildschirmhöhe.
      </p>
      <z-panel flush>
        <z-app-header navLabel="Hauptnavigation">
          <span zBrand>Zenit</span>
          @for (link of oeffentlicheLinks; track link) {
            <a
              zHeaderLink
              href="#"
              [active]="link === 'Minecraft'"
              (click)="$event.preventDefault()"
              >{{ link }}</a
            >
          }
          <a zBtn="ghost" zHeaderEnd href="#">Anmelden</a>
          <a zBtn="primary" size="sm" zHeaderEnd href="#">Server erstellen</a>
        </z-app-header>
      </z-panel>
    </section>

    <section class="demo-section">
      <h2 class="heading-2">PageHeader</h2>
      <p class="demo-cap caption">
        Titel in heading-1, ein Fakt darunter, höchstens zwei Aktionen. Der Titel heißt wie der Link
        in der Navigation. Unter 640px stehen die Aktionen unter dem Titel. Zustandsübersicht: hier
        stehen mehrere primäre Buttons nebeneinander, auf einer echten Seite ist es höchstens einer
        je Bildschirmhöhe.
      </p>
      <z-page-header title="Gameserver" sub="3 Server, 2 online">
        <button zBtn="secondary" type="button">Bestellungen</button>
        <button zBtn="primary" type="button"><z-icon name="add" />Server erstellen</button>
      </z-page-header>
      <z-page-header title="Abrechnung" sub="Guthaben 25,00&nbsp;€">
        <button zBtn="secondary" type="button">Gutschein einlösen</button>
        <button zBtn="secondary" type="button">Aufladen</button>
      </z-page-header>
      <p class="demo-cap caption">Ohne Aktionen und ohne Unterzeile:</p>
      <z-page-header title="Dashboard" />
    </section>

    <section class="demo-section">
      <h2 class="heading-2">Footer</h2>
      <p class="demo-cap caption">
        Öffentlich mit drei Spalten und der unteren Zeile. Links in text-muted, beim Hover text,
        kein Rot. Auch der Fuß steht hier zur Ansicht in einem Panel.
      </p>
      <z-panel flush>
        <z-footer>
          <z-footer-col heading="Hosting">
            <li><a href="#">Minecraft</a></li>
            <li><a href="#">Preise</a></li>
            <li><a href="#">Hardware</a></li>
          </z-footer-col>
          <z-footer-col heading="Hilfe">
            <li><a href="#">Wiki</a></li>
            <li><a href="#">Vorschläge</a></li>
            <li><a href="#">Discord</a></li>
          </z-footer-col>
          <z-footer-col heading="Rechtliches">
            <li><a href="#">Impressum</a></li>
            <li><a href="#">Datenschutz</a></li>
            <li><a href="#">AGB</a></li>
            <li><a href="#">Widerruf</a></li>
          </z-footer-col>
          <span zFooterBase>© 2026 Zenit-Hosting</span>
          <a zFooterBase href="#">Cookie-Einstellungen</a>
        </z-footer>
      </z-panel>

      <p class="demo-cap caption">
        Kundenbereich: nur die untere Zeile, Copyright links und die rechtlichen Links rechts.
      </p>
      <z-panel flush>
        <z-footer>
          <span zFooterBase>© 2026 Zenit-Hosting</span>
          <span zFooterBase class="z-cluster">
            <a href="#">Impressum</a>
            <a href="#">Datenschutz</a>
            <a href="#">AGB</a>
            <a href="#">Widerruf</a>
          </span>
        </z-footer>
      </z-panel>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavigationPage {
  protected readonly tabs = ['Übersicht', 'Apps', 'Speicher', 'Pakete', 'Einstellungen'];
  protected readonly schritte = ['Spiel', 'Ressourcen', 'Bezahlen'];
  protected readonly kundenLinks = [
    'Dashboard',
    'Gameserver',
    'Hosting',
    'Domains',
    'Abrechnung',
    'Support',
  ];
  protected readonly oeffentlicheLinks = ['Minecraft', 'Preise', 'Hardware', 'Wiki', 'Vorschläge'];

  protected readonly gruppen: { titel: string; eintraege: SeitenEintrag[] }[] = [
    {
      titel: '',
      eintraege: [
        { icon: 'dashboard', text: 'Übersicht' },
        { icon: 'terminal', text: 'Konsole' },
        { icon: 'folder', text: 'Dateien' },
      ],
    },
    {
      titel: 'Spiel',
      eintraege: [
        { icon: 'group', text: 'Spieler', count: 0 },
        { icon: 'tune', text: 'Eigenschaften' },
        { icon: 'public', text: 'Welten' },
        { icon: 'extension', text: 'Mods und Plugins' },
      ],
    },
    {
      titel: 'Betrieb',
      eintraege: [
        { icon: 'backup', text: 'Backups' },
        { icon: 'schedule', text: 'Zeitplan' },
        { icon: 'monitoring', text: 'Statistiken' },
      ],
    },
    {
      titel: 'Server',
      eintraege: [
        { icon: 'settings', text: 'Einstellungen' },
        { icon: 'upgrade', text: 'Upgrade' },
      ],
    },
  ];

  protected readonly spieler = [
    { name: 'Steve', meta: 'seit 41 Minuten · 203.0.113.20', rolle: 'Operator' },
    { name: 'Alex', meta: 'seit 12 Minuten · 203.0.113.21', rolle: 'Spieler' },
  ];

  protected readonly aktiverTab = signal(this.tabs[0]);
  protected readonly bereich = signal('Übersicht');

  protected waehleTab(tab: string, ereignis: Event): void {
    ereignis.preventDefault();
    this.aktiverTab.set(tab);
  }
}
