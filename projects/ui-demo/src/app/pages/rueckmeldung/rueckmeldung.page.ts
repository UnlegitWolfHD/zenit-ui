import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  ZAlert,
  ZAlertAction,
  ZButton,
  ZEmptyAction,
  ZEmptyState,
  ZIcon,
  ZPanel,
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
        Höchstens ein Alert pro Seite, hier als Übersicht. Die Farbe liegt nur auf Fläche und
        Icon. Unter 640px bricht der Button unter den Text.
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
        SteamCMD hat nach 120 Sekunden nicht geantwortet. Starte die Installation erneut oder
        öffne ein Ticket.
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
        Eine leere Liste zeigt keine Pagination und keine Filter. Kein großes graues Icon, der
        Text trägt den Zustand.
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
        Erst nach 300ms anzeigen. Lädt es schneller, erscheint direkt der Inhalt. Der Container
        trägt aria-busy und ein aria-label, die Platzhalter selbst sind aria-hidden.
      </p>

      <z-panel title="Meine Server" busy aria-label="Server werden geladen">
        <div class="demo-row">
          <z-skeleton thumb />
          <div style="display: grid; gap: var(--space-2); flex: 1">
            <z-skeleton width="40%" />
            <z-skeleton width="60%" />
          </div>
          <z-skeleton width="64px" />
          <z-skeleton width="48px" />
        </div>
        <div class="demo-row">
          <z-skeleton thumb />
          <div style="display: grid; gap: var(--space-2); flex: 1">
            <z-skeleton width="30%" />
            <z-skeleton width="50%" />
          </div>
          <z-skeleton width="64px" />
          <z-skeleton width="48px" />
        </div>
      </z-panel>
    </section>

    <section class="demo-section">
      <h2 class="heading-2">Toast</h2>
      <p class="demo-cap caption">
        5 Sekunden sichtbar, mit Aktion 8 Sekunden. Fehler bleiben, bis man sie schließt, und
        nutzen role="alert". Höchstens drei gleichzeitig, der neueste unten.
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
        Erscheint bei Zeiger und Fokus, verschwindet bei Verlassen, Fokusverlust und Escape.
        Ein deaktivierter Button meldet keine Ereignisse, deshalb trägt der Grund das
        umschließende Element.
      </p>

      <div class="demo-row">
        <button zBtn="ghost" iconOnly aria-label="Aktualisieren" zTooltip="Aktualisieren">
          <z-icon name="refresh" />
        </button>
        <button zBtn="secondary" zTooltip="Beispiel-Server 1 läuft seit 3 Tagen ohne Neustart">
          <z-icon name="restart_alt" />Neustart
        </button>
        <span tabindex="0" zTooltip="Beispiel-Server 1 ist bereits gestoppt">
          <button zBtn="secondary" disabled><z-icon name="stop" />Stoppen</button>
        </span>
      </div>
    </section>

    <z-toast-outlet />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RueckmeldungPage {
  protected readonly toast = inject(ZToast);

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
