import { ChangeDetectionStrategy, Component, DOCUMENT, computed, inject } from '@angular/core';
import { ZAlert, ZBadge, ZButton, ZField, ZIcon, ZInput, ZPanel, ZTheme } from 'zenit-ui';

/** The colour tokens of tokens.css, in the order of CLAUDE.md, "Farbe". */
const FARBTOKEN = [
  'bg',
  'surface',
  'surface-raised',
  'surface-hover',
  'border',
  'border-control',
  'text',
  'text-muted',
  'text-subtle',
  'accent',
  'accent-hover',
  'on-accent',
  'accent-text',
  'accent-subtle',
  'scrim',
  'focus',
  'success',
  'success-subtle',
  'warning',
  'warning-subtle',
  'danger',
  'danger-subtle',
  'info',
  'info-subtle',
  'mc-accent',
  'mc-accent-hover',
  'on-mc',
];

/** The three surfaces the text levels are checked against. */
const FLAECHEN = ['bg', 'surface', 'surface-raised'];

@Component({
  selector: 'demo-themes-page',
  imports: [ZAlert, ZBadge, ZButton, ZField, ZIcon, ZInput, ZPanel],
  template: `
    <h1 class="heading-1 demo-title">Themes</h1>
    <p class="demo-lead">
      Alle Farbtoken im gewählten Schema, mit dem Wert, den der Browser gerade auflöst. Schema und
      Akzent stellst du oben im Kopf um. Aktiv ist
      <span class="z-mono">{{ theme.resolvedScheme() }}</span> mit dem Akzent
      <span class="z-mono">{{ theme.accent() }}</span
      >.
    </p>

    <section class="demo-section">
      <h2 class="heading-2">Farbtoken</h2>
      <p class="demo-cap caption">
        Jede Kachel zeigt die Fläche, den Namen und den aufgelösten Wert. Namen und Rollen sind in
        jedem Schema gleich, nur die Werte wechseln.
      </p>
      <ul class="demo-swatches">
        @for (farbe of farben(); track farbe.name) {
          <li class="demo-swatch">
            <span class="demo-swatch__probe" [style.background]="farbe.css"></span>
            <span class="demo-swatch__name body-sm">--{{ farbe.name }}</span>
            <span class="demo-swatch__wert mono-sm z-subtle">{{ farbe.wert }}</span>
          </li>
        }
      </ul>
    </section>

    <section class="demo-section">
      <h2 class="heading-2">Textstufen auf jeder Fläche</h2>
      <p class="demo-cap caption">
        text für Inhalte, text-muted für Beschreibungen, text-subtle für Zeitstempel. Auf
        surface-hover steht text-subtle nie.
      </p>
      <div class="demo-grid">
        @for (flaeche of flaechen; track flaeche) {
          <div class="demo-stufen" [style.background]="'var(--' + flaeche + ')'">
            <p class="demo-flach mono-sm z-subtle">--{{ flaeche }}</p>
            <p class="demo-flach body-sm">text: Beispiel-Server 1 läuft seit 14 Tagen.</p>
            <p class="demo-flach body-sm z-muted">
              text-muted: 4&nbsp;vCPU, 8&nbsp;GB, 120&nbsp;GB NVMe.
            </p>
            <p class="demo-flach caption z-subtle">text-subtle: 18.09.2026, 15:55</p>
          </div>
        }
      </div>
    </section>

    <section class="demo-section">
      <h2 class="heading-2">Status</h2>
      <p class="demo-cap caption">
        Jeder Status steht auch als Wort da. Die Farbe trägt keine Aussage allein.
      </p>
      <div class="demo-row">
        <z-badge status="success" dot>Online</z-badge>
        <z-badge status="warning" dot>Neustart läuft</z-badge>
        <z-badge status="danger" dot>Fehlgeschlagen</z-badge>
        <z-badge status="info" dot>Wird installiert</z-badge>
        <z-badge dot>Gestoppt</z-badge>
      </div>
      <z-alert status="success" title="Sicherung abgeschlossen" icon="check_circle">
        2,4&nbsp;GB in 48 Sekunden gesichert.
      </z-alert>
      <z-alert
        status="warning"
        title="2 Änderungen greifen erst nach einem Neustart"
        icon="warning"
      >
        PvP und maximale Spieler.
      </z-alert>
      <z-alert status="danger" title="Installation fehlgeschlagen" icon="error">
        SteamCMD hat nach 120 Sekunden nicht geantwortet. Starte die Installation erneut.
      </z-alert>
      <z-alert status="info" title="Wartung am 22.09.2026, 03:00" icon="info">
        Der Host wird für etwa 15 Minuten neu gestartet.
      </z-alert>
    </section>

    <section class="demo-section">
      <h2 class="heading-2">Buttons</h2>
      <p class="demo-cap caption">
        Rot ist eine Handlung: nur der primäre Button und der Fokus-Ring tragen den Akzent.
      </p>
      <div class="demo-row">
        <button zBtn="primary"><z-icon name="add" />Server erstellen</button>
        <button zBtn="secondary">Preis berechnen</button>
        <button zBtn="ghost">Abbrechen</button>
        <button zBtn="danger"><z-icon name="power_settings_new" />Hart beenden</button>
      </div>
      <div class="demo-row z-theme-mc">
        <p class="demo-cap caption">Minecraft-Subtheme, in jedem Schema</p>
        <button zBtn="primary"><z-icon name="tune" />Server konfigurieren</button>
        <button zBtn="secondary">Preis berechnen</button>
      </div>
    </section>

    <section class="demo-section">
      <h2 class="heading-2">Feld mit Fehler</h2>
      <div class="demo-grid">
        <z-field
          label="Maximale Spieler"
          for="theme-max"
          error="Dein Tarif erlaubt höchstens 100 Spieler. Trage einen kleineren Wert ein."
        >
          <input zInput mono invalid id="theme-max" value="200" />
        </z-field>
        <z-field label="Servername" for="theme-name" hint="Nur für dich sichtbar.">
          <input zInput id="theme-name" value="Beispiel-Server 1" />
        </z-field>
      </div>
    </section>

    <section class="demo-section">
      <h2 class="heading-2">Eigenes Theme</h2>
      <z-panel title="So legst du ein Schema an">
        <div class="demo-eigen">
          <p class="demo-flach body-sm">
            Ein Schema ist ein CSS-Block, der Token überschreibt. Namen und Rollen bleiben, nur die
            Werte wechseln. Neben den Farben kannst du auch Radien, Schriften, Abstände und Höhen
            von Bedienelementen setzen.
          </p>
          <pre class="demo-code mono-sm">{{ beispiel }}</pre>
          <p class="demo-flach body-sm">
            Danach meldest du die Kennung an:
            <span class="z-mono">provideZenitTheme({{ anmeldung }})</span>. Ein Akzent geht genauso,
            mit <span class="z-mono">[data-accent="tuerkis"]</span> und den fünf Akzent-Token. Prüfe
            die Werte anschließend mit
            <span class="z-mono">node tools/check-theme-contrast.mjs</span>; ohne dieses Ergebnis
            ist ein Schema nicht abgenommen.
          </p>
          <p class="demo-flach body-sm z-muted">
            Die vollständige Anleitung steht in docs/theming.md.
          </p>
        </div>
      </z-panel>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemesPage {
  protected readonly theme = inject(ZTheme);
  protected readonly flaechen = FLAECHEN;
  protected readonly beispiel = [
    '[data-theme="sepia"] {',
    '  color-scheme: light;',
    '  --bg: #f7f1e6;',
    '  --surface: #efe7d8;',
    '  --text: #2a2419;',
    '  --radius-md: 2px;',
    '  --control-md: 44px;',
    '}',
  ].join('\n');
  protected readonly anmeldung = "{ schemes: ['dark', 'sepia'] }";

  private readonly dok = inject(DOCUMENT);

  /**
   * The resolved values come from getComputedStyle: only the browser knows
   * which block won in the end. Scheme and accent are read as dependencies, so
   * the list is rebuilt after every switch.
   */
  protected readonly farben = computed(() => {
    this.theme.resolvedScheme();
    this.theme.accent();
    const stil = this.dok.defaultView?.getComputedStyle(this.dok.documentElement);
    return FARBTOKEN.map((name) => ({
      name,
      css: `var(--${name})`,
      wert: stil?.getPropertyValue(`--${name}`).trim() || '–',
    }));
  });
}
