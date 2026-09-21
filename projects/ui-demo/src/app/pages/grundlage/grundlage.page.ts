import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  ZAlert,
  ZBadge,
  ZButton,
  ZField,
  ZIcon,
  ZInput,
  ZInputGroup,
  ZPanel,
  ZPanelActions,
  ZSelect,
  ZSpinner,
} from 'zenit-ui';

@Component({
  selector: 'demo-grundlage-page',
  imports: [
    ZAlert,
    ZBadge,
    ZButton,
    ZField,
    ZIcon,
    ZInput,
    ZInputGroup,
    ZPanel,
    ZPanelActions,
    ZSelect,
    ZSpinner,
  ],
  template: `
    <h1 class="heading-1 demo-title">Grundlage</h1>
    <p class="demo-lead">
      Icon, Spinner, Button, Badge, Field mit Input und Select sowie Panel in allen Zuständen.
      Beispieldaten: Beispiel-Server 1 auf 203.0.113.10, Nutzer K.
    </p>

    <section class="demo-section">
      <h2 class="heading-2">Button</h2>
      <p class="demo-cap caption">
        Zustandsübersicht: hier stehen mehrere primäre Buttons nebeneinander, auf einer echten Seite
        ist es höchstens einer je Bildschirmhöhe.
      </p>

      <div class="demo-row">
        <button zBtn="primary"><z-icon name="add" />Server erstellen</button>
        <button zBtn="secondary">Preis berechnen</button>
        <button zBtn="ghost">Abbrechen</button>
        <button zBtn="danger"><z-icon name="power_settings_new" />Hart beenden</button>
      </div>

      <div class="demo-row">
        <p class="demo-cap caption">Drei Größen: lg, md, sm</p>
        <button zBtn="primary" size="lg">Server erstellen</button>
        <button zBtn="secondary">Aufladen</button>
        <button zBtn="secondary" size="sm"><z-icon name="upload" />Hochladen</button>
      </div>

      <div class="demo-row">
        <p class="demo-cap caption">Nur Icon, Beschriftung über aria-label</p>
        <button zBtn="ghost" iconOnly aria-label="Aktualisieren"><z-icon name="refresh" /></button>
        <button zBtn="secondary" iconOnly aria-label="Weitere Aktionen">
          <z-icon name="more_vert" />
        </button>
        <button zBtn="ghost" iconOnly size="sm" aria-label="Einstellungen">
          <z-icon name="tune" />
        </button>
      </div>

      <div class="demo-row">
        <p class="demo-cap caption">Panel-Kopf: eine Hauptaktion je Zustand, Rest neutral</p>
        <button zBtn="secondary"><z-icon name="restart_alt" />Neustart</button>
        <button zBtn="secondary"><z-icon name="stop" />Stoppen</button>
        <button zBtn="ghost" iconOnly aria-label="Weitere Aktionen">
          <z-icon name="more_vert" />
        </button>
      </div>

      <div class="demo-row">
        <p class="demo-cap caption">Lädt: Spinner vor dem Text, Button gesperrt</p>
        <button zBtn="primary" loading>Wird gestartet</button>
        <button zBtn="secondary" loading>Wird gespeichert</button>
      </div>

      <div class="demo-row">
        <p class="demo-cap caption">Deaktiviert</p>
        <button zBtn="secondary" disabled>Stoppen</button>
        <p class="demo-grund caption">Beispiel-Server 1 ist bereits gestoppt.</p>
      </div>

      <div class="demo-row">
        <p class="demo-cap caption">Als Link: a[zBtn]</p>
        <a zBtn="primary" href="#">Server erstellen</a>
        <a zBtn="secondary" href="#">Preis berechnen</a>
        <a zBtn="secondary" href="#" [disabled]="true">Aufladen</a>
        <p class="demo-grund caption">Aufladen ist gesperrt, solange die Zahlung läuft.</p>
      </div>

      <div class="demo-row">
        <p class="demo-cap caption">Volle Breite: block</p>
        <div class="demo-narrow"><button zBtn="primary" block>Server erstellen</button></div>
      </div>

      <div class="demo-row z-theme-mc">
        <p class="demo-cap caption">Minecraft-Subtheme</p>
        <button zBtn="primary"><z-icon name="tune" />Server konfigurieren</button>
        <button zBtn="secondary">Preis berechnen</button>
      </div>
    </section>

    <section class="demo-section">
      <h2 class="heading-2">Badge</h2>
      <div class="demo-row">
        <p class="demo-cap caption">Status mit Punkt und Farbe</p>
        <z-badge status="success" dot>Online</z-badge>
        <z-badge status="danger" dot>Fehlgeschlagen</z-badge>
        <z-badge status="warning" dot>Neustart läuft</z-badge>
        <z-badge dot>Gestoppt</z-badge>
        <z-badge status="info" dot>Wird installiert</z-badge>
      </div>
      <div class="demo-row">
        <p class="demo-cap caption">Neutrale Tags: Tarif, Loader, Rechte, Kategorie</p>
        <z-badge>Flex, nach Stunden</z-badge>
        <z-badge>PaperMC</z-badge>
        <z-badge>Geteilt</z-badge>
        <z-badge>Konsole</z-badge>
        <z-badge>Subdomain</z-badge>
      </div>
      <div class="demo-row">
        <p class="demo-cap caption">Ohne Punkt, zum Beispiel für einen geplanten Vorgang</p>
        <z-badge status="info">Geplant</z-badge>
      </div>
    </section>

    <section class="demo-section">
      <h2 class="heading-2">Field, Input und Select</h2>
      <div class="demo-grid">
        <z-field label="Servername" for="in-name" hint="Nur für dich sichtbar.">
          <input zInput id="in-name" value="Beispiel-Server 1" />
        </z-field>
        <z-field
          label="Maximale Spieler"
          for="in-max"
          error="Dein Tarif erlaubt höchstens 100 Spieler."
        >
          <input zInput mono invalid id="in-max" value="200" />
        </z-field>
        <z-field label="Suche" for="in-search">
          <z-input-group icon="search">
            <input zInput id="in-search" placeholder="Name, Spiel oder Adresse" />
          </z-input-group>
        </z-field>
        <z-field
          label="Subdomain"
          for="in-dis"
          hint="Die Subdomain vergibt Zenit, sie lässt sich nicht ändern."
        >
          <input zInput id="in-dis" value="beispiel-server-1.user.zenit-hosting.de" disabled />
        </z-field>
        <z-field label="Adresse" for="in-addr" hint="IP und Port deines Servers.">
          <input zInput mono id="in-addr" value="203.0.113.10:25565" readonly />
        </z-field>
        <z-field label="RCON-Port" for="in-port" hint="Kleines Feld in Werkzeugleisten: sm.">
          <input zInput mono size="sm" id="in-port" value="25575" />
        </z-field>
      </div>

      <z-field label="Notiz" for="in-note" hint="Nur für dich sichtbar.">
        <textarea zInput id="in-note" placeholder="Was hast du zuletzt geändert?"></textarea>
      </z-field>

      <div class="demo-grid demo-grid--narrow">
        <z-field label="Status" for="sel-status">
          <z-select>
            <select id="sel-status">
              <option>Alle Status</option>
              <option>Online</option>
              <option>Gestoppt</option>
              <option>Fehlgeschlagen</option>
            </select>
          </z-select>
        </z-field>
        <z-field label="Spiel" for="sel-game">
          <z-select>
            <select id="sel-game">
              <option>Alle Spiele</option>
              <option>Minecraft</option>
              <option>Counter-Strike 2</option>
            </select>
          </z-select>
        </z-field>
        <z-field label="Sortierung" for="sel-sort">
          <z-select size="sm">
            <select id="sel-sort">
              <option>Name</option>
              <option>Kosten</option>
              <option>Status</option>
            </select>
          </z-select>
        </z-field>
        <z-field label="Standort" for="sel-loc" hint="Zenit betreibt nur Nürnberg.">
          <z-select>
            <select id="sel-loc" disabled>
              <option>Nürnberg</option>
            </select>
          </z-select>
        </z-field>
        <z-field
          label="Zahlungsmittel"
          for="sel-pay"
          error="Wähle ein Zahlungsmittel, sonst lässt sich das Guthaben nicht aufladen."
        >
          <z-select>
            <select id="sel-pay">
              <option>Bitte wählen</option>
              <option>PayPal</option>
              <option>SEPA-Lastschrift</option>
            </select>
          </z-select>
        </z-field>
      </div>
      <p class="demo-grund caption">
        Fehler am Select: der Satz steht in danger unter dem Feld und hängt über aria-describedby am
        select. Einen roten Rahmen wie beim Input sieht die Referenz für das Select nicht vor.
      </p>
    </section>

    <section class="demo-section">
      <h2 class="heading-2">Panel</h2>

      <z-panel title="Aktivitäten" flush>
        <a zPanelActions href="#">Alle anzeigen</a>
        <ul class="demo-list">
          @for (eintrag of aktivitaeten; track eintrag.zeit) {
            <li>
              <p>
                <span class="title-sm">{{ eintrag.titel }}</span
                ><br />
                <span class="caption z-subtle">{{ eintrag.meta }}</span>
              </p>
              <span class="caption z-subtle z-mono">{{ eintrag.zeit }}</span>
            </li>
          }
        </ul>
      </z-panel>

      <z-panel title="Zahlungsmittel">
        <span zPanelActions>
          <button zBtn="secondary" size="sm"><z-icon name="add" size="sm" />Hinzufügen</button>
        </span>
        <p class="demo-sub">
          Guthaben 12,40&nbsp;€. Die nächste Abrechnung läuft am 01.10.2026 über dasselbe
          Zahlungsmittel.
        </p>
      </z-panel>

      <z-panel title="Auslastung" busy>
        <div class="demo-row">
          <z-spinner label="Wird geladen" />
          <span class="z-muted">Die Werte der letzten 24 Stunden werden geladen.</span>
        </div>
      </z-panel>

      <p class="demo-cap caption">
        Panel ohne Titel: der Kopf entfällt, der Inhalt steht direkt im Körper.
      </p>
      <z-panel>
        <p class="demo-sub">Beispiel-Server 1 läuft seit 3 Tagen ohne Neustart.</p>
      </z-panel>
    </section>

    <section class="demo-section">
      <h2 class="heading-2">Icon</h2>
      <div class="demo-row">
        <p class="demo-cap caption">md (20px) und sm (16px), Farbe text-muted</p>
        <z-icon name="dns" />
        <z-icon name="restart_alt" />
        <z-icon name="terminal" />
        <z-icon name="dns" size="sm" />
        <z-icon name="restart_alt" size="sm" />
        <z-icon name="terminal" size="sm" />
      </div>
    </section>

    <section class="demo-section">
      <h2 class="heading-2">Spinner</h2>
      <div class="demo-row">
        <p class="demo-cap caption">Mit Label als Statusmeldung, ohne Label dekorativ im Button</p>
        <z-spinner label="Wird geladen" />
        <span class="z-muted">Wird geladen</span>
        <button zBtn="secondary" loading>Wird gespeichert</button>
      </div>
    </section>

    <section class="demo-section">
      <h2 class="heading-2">Serverstatus</h2>
      <p class="demo-cap caption">
        Beispiel-Server 1, PaperMC, 203.0.113.10:25565. Der Status sieht überall gleich aus:
        Dashboard, Liste, Panel-Kopf, geteilte Server. Zustandsübersicht: hier stehen alle sechs
        Status untereinander, auf einer echten Seite steht immer nur ein Status mit seiner einen
        Hauptaktion.
      </p>

      <div class="demo-status">
        <div class="demo-status__row">
          <div class="demo-row">
            <z-badge status="success" dot>Online</z-badge>
            <button zBtn="secondary"><z-icon name="restart_alt" />Neustart</button>
            <button zBtn="secondary"><z-icon name="stop" />Stoppen</button>
          </div>
        </div>

        <div class="demo-status__row">
          <div class="demo-row">
            <z-badge status="warning" dot>Startet</z-badge>
            <button zBtn="primary" loading>Wird gestartet</button>
            <button zBtn="secondary" disabled><z-icon name="stop" />Stoppen</button>
          </div>
          <p class="demo-grund caption">
            Solange der Server startet, sind alle Aktionen gesperrt. Der auslösende Button zeigt den
            Spinner.
          </p>
        </div>

        <div class="demo-status__row">
          <div class="demo-row">
            <z-badge dot>Gestoppt</z-badge>
            <button zBtn="primary"><z-icon name="play_arrow" />Starten</button>
          </div>
        </div>

        <div class="demo-status__row">
          <div class="demo-row">
            <z-badge status="info" dot>Wird installiert</z-badge>
          </div>
          <p class="demo-grund caption">
            Keine Aktion, bis die Installation fertig ist. Das dauert in etwa 60 Sekunden.
          </p>
        </div>

        <div class="demo-status__row">
          <div class="demo-row">
            <z-badge status="danger" dot>Fehlgeschlagen</z-badge>
            <button zBtn="primary"><z-icon name="refresh" />Erneut installieren</button>
          </div>
          <z-alert status="danger" title="Installation fehlgeschlagen" icon="error">
            SteamCMD hat nach 120 Sekunden nicht geantwortet. Starte die Installation erneut oder
            öffne ein Ticket.
          </z-alert>
        </div>

        <div class="demo-status__row">
          <div class="demo-row">
            <z-badge status="danger" dot>Gesperrt</z-badge>
            <button zBtn="primary">
              <z-icon name="account_balance_wallet" />Guthaben aufladen
            </button>
          </div>
          <p class="demo-grund caption">
            Dein Guthaben ist leer. Lade auf, dann läuft Beispiel-Server 1 weiter.
          </p>
        </div>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GrundlagePage {
  protected readonly aktivitaeten = [
    { titel: 'Server neu gestartet', meta: 'Beispiel-Server 1', zeit: '18.09.2026, 15:55' },
    { titel: 'Server gestoppt', meta: 'Beispiel-Server 1', zeit: '18.09.2026, 14:47' },
    { titel: 'RCON aktiviert', meta: 'Port 25575, automatisch', zeit: '17.09.2026, 21:11' },
  ];
}
