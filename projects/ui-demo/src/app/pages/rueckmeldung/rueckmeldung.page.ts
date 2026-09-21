import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  ZAlert,
  ZAlertAction,
  ZButton,
  ZEmptyAction,
  ZEmptyState,
  ZIcon,
  ZPanel,
  ZRow,
  ZRows,
  ZSkeleton,
  ZToast,
  ZToastOutlet,
  ZTooltip,
} from 'zenit-ui';

@Component({
  selector: 'demo-rueckmeldung-page',
  imports: [
    ZAlert,
    ZAlertAction,
    ZButton,
    ZEmptyAction,
    ZEmptyState,
    ZIcon,
    ZPanel,
    ZRow,
    ZRows,
    ZSkeleton,
    ZToastOutlet,
    ZTooltip,
  ],
  template: `
    <h1 class="heading-1 demo-title">Rückmeldung</h1>
    <p class="demo-lead">
      Alert, EmptyState, Skeleton, Toast und Tooltip. Beispieldaten: Beispiel-Server 1 auf
      203.0.113.10, Nutzer K.
    </p>

    <section class="demo-section">
      <h2 class="heading-2">Alert</h2>
      <p class="demo-cap caption">
        Höchstens ein Alert pro Seite, hier als Übersicht. Die Farbe liegt nur auf Fläche und Icon.
        Unter 640px bricht der Button unter den Text.
      </p>

      <z-alert status="info" title="Dein Lieblingsspiel fehlt?" icon="info">
        Stimme für Vorschläge ab oder reiche ein neues Spiel ein.
        <button zAlertAction zBtn="secondary" size="sm">Vorschläge ansehen</button>
      </z-alert>

      <z-alert
        status="warning"
        title="2 Änderungen greifen erst nach einem Neustart"
        icon="restart_alt"
      >
        PvP und maximale Spieler.
        <button zAlertAction zBtn="secondary" size="sm">Jetzt neu starten</button>
      </z-alert>

      <z-alert status="danger" title="Installation fehlgeschlagen" icon="error">
        SteamCMD hat nach 120 Sekunden nicht geantwortet. Starte die Installation erneut oder öffne
        ein Ticket.
        <button zAlertAction zBtn="secondary" size="sm">Erneut installieren</button>
      </z-alert>

      <p class="demo-cap caption">Ohne Aktion: success und neutral</p>

      <z-alert status="success" title="Backup wiederhergestellt" icon="check_circle">
        Beispiel-Server 1 läuft wieder mit dem Stand vom 18.09.2026, 15:55.
      </z-alert>

      <z-alert title="Wartung am 24.09.2026, 03:00" icon="schedule">
        Beispiel-Server 1 ist dabei etwa 10 Minuten nicht erreichbar.
      </z-alert>

      <p class="demo-cap caption">Nur Titel, ohne Icon und ohne zweiten Satz</p>

      <z-alert status="info" title="Dein Guthaben reicht noch 6 Tage."></z-alert>
    </section>

    <section class="demo-section">
      <h2 class="heading-2">EmptyState</h2>
      <p class="demo-cap caption">
        Eine leere Liste zeigt keine Pagination und keine Filter. Kein großes graues Icon, der Text
        trägt den Zustand.
      </p>

      <z-panel title="Tickets" flush>
        <z-empty-state title="Keine offenen Tickets">
          Wir antworten in der Regel innerhalb von 24 Stunden, auf Discord oft schneller.
          <button zEmptyAction zBtn="secondary">Ticket erstellen</button>
        </z-empty-state>
      </z-panel>
    </section>

    <section class="demo-section">
      <h2 class="heading-2">Skeleton</h2>
      <p class="demo-cap caption">
        Erst nach 300ms anzeigen. Lädt es schneller, erscheint direkt der Inhalt. Die Platzhalter
        stehen im selben Grid wie die echten Zeilen, damit nichts springt. Der Container trägt
        aria-busy und ein aria-label, die Platzhalter selbst sind aria-hidden.
      </p>

      <z-panel title="Meine Server" flush busy aria-label="Server werden geladen">
        <z-rows>
          @for (platz of platzhalter; track platz.titel) {
            <div zRow>
              <div class="z-row__main">
                <z-skeleton thumb />
                <div class="demo-skel-lines">
                  <z-skeleton [width]="platz.titel" />
                  <z-skeleton [width]="platz.meta" />
                </div>
              </div>
              <z-skeleton width="64px" />
              <z-skeleton width="70%" />
              <z-skeleton width="48px" class="demo-skel-end" />
              <span></span>
            </div>
          }
        </z-rows>
      </z-panel>
    </section>

    <section class="demo-section">
      <h2 class="heading-2">Toast</h2>
      <p class="demo-cap caption">
        5 Sekunden sichtbar, mit Aktion 8 Sekunden. Fehler bleiben, bis man sie schließt, und nutzen
        role="alert". Höchstens drei gleichzeitig, der neueste unten.
      </p>

      <div class="demo-row">
        <button zBtn="secondary" (click)="toast.success('Eigenschaften gespeichert')">
          Erfolg zeigen
        </button>
        <button zBtn="secondary" (click)="toast.error('Backup fehlgeschlagen: Speicher voll')">
          Fehler zeigen
        </button>
        <button zBtn="secondary" (click)="mitAktion()">Mit Aktion zeigen</button>
        <button zBtn="secondary" (click)="dauerhaft()">Dauerhaft zeigen</button>
        <button zBtn="secondary" (click)="toast.dismiss()">Alle schließen</button>
      </div>
    </section>

    <section class="demo-section">
      <h2 class="heading-2">Tooltip</h2>
      <p class="demo-cap caption">
        Erscheint bei Zeiger und Fokus, verschwindet bei Verlassen, Fokusverlust und Escape. Ein
        Button mit <code class="z-mono">disabled</code> meldet keine Ereignisse, deshalb trägt der
        gesperrte Button <code class="z-mono">aria-disabled="true"</code>: er sieht deaktiviert aus,
        bleibt per Tab erreichbar und tut beim Klick nichts. Für die Tastatur steht derselbe Grund
        darunter als Satz.
      </p>

      <div class="demo-row">
        <button zBtn="ghost" iconOnly aria-label="Aktualisieren" zTooltip="Aktualisieren">
          <z-icon name="refresh" />
        </button>
        <button zBtn="secondary" zTooltip="Beispiel-Server 1 läuft seit 3 Tagen ohne Neustart">
          <z-icon name="restart_alt" />Neustart
        </button>
        <button
          zBtn="secondary"
          type="button"
          aria-disabled="true"
          zTooltip="Beispiel-Server 1 ist bereits gestoppt"
        >
          <z-icon name="stop" />Stoppen
        </button>
        <p class="demo-cap caption">
          Stoppen ist gesperrt: Beispiel-Server 1 ist bereits gestoppt.
        </p>
      </div>
    </section>

    <z-toast-outlet />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RueckmeldungPage {
  protected readonly toast = inject(ZToast);

  /** Widths of the placeholders as in spec/components/Skeleton/preview.html. */
  protected readonly platzhalter = [
    { titel: '40%', meta: '60%' },
    { titel: '30%', meta: '50%' },
  ];

  protected mitAktion(): void {
    this.toast.success('Eigenschaften gespeichert', {
      actionLabel: 'Rückgängig',
      action: () => this.toast.show('Änderung zurückgenommen', { icon: 'undo' }),
    });
  }

  protected dauerhaft(): void {
    this.toast.show('Adresse kopiert', { icon: 'content_copy', duration: 0 });
  }
}
