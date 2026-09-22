import { DialogRef } from '@angular/cdk/dialog';
import { CdkMenuTrigger } from '@angular/cdk/menu';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import {
  Z_MENU,
  ZButton,
  ZDialog,
  ZDialogActions,
  ZDialogLayout,
  ZField,
  ZIcon,
  ZInput,
  ZPanel,
  ZTooltip,
} from 'zenit-ui';

/**
 * Custom dialog through ZDialog.open(): a short form with one field, held by a
 * Signal Form instead of a template reference.
 */
@Component({
  selector: 'demo-notiz-dialog',
  imports: [FormField, ZButton, ZDialogActions, ZDialogLayout, ZField, ZInput],
  template: `
    <z-dialog title="Notiz zu Beispiel-Server 1">
      <z-field label="Notiz" for="demo-notiz" hint="Nur für dich sichtbar.">
        <input
          zInput
          id="demo-notiz"
          placeholder="Was hast du zuletzt geändert?"
          [formField]="notiz"
        />
      </z-field>
      <ng-container zDialogActions>
        <button zBtn="ghost" (click)="ref.close()">Abbrechen</button>
        <button zBtn="primary" (click)="ref.close(notiz().value())">Notiz speichern</button>
      </ng-container>
    </z-dialog>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotizDialog {
  protected readonly ref = inject<DialogRef<string>>(DialogRef);
  protected readonly notiz = form(signal(''));
}

/** One field of the long dialog, kept as data so the template stays short. */
interface LangesFeld {
  readonly id: string;
  readonly label: string;
  readonly platzhalter: string;
}

/**
 * A form longer than any screen, so the scrolling body of the dialog can be
 * tried out: header and footer stay in place, only the body moves. Inside the
 * body a tooltip and a row menu, both of which have to answer that scroll.
 */
@Component({
  selector: 'demo-langer-dialog',
  imports: [
    CdkMenuTrigger,
    Z_MENU,
    ZButton,
    ZDialogActions,
    ZDialogLayout,
    ZField,
    ZIcon,
    ZInput,
    ZTooltip,
  ],
  template: `
    <z-dialog title="Server anlegen">
      <div class="z-cluster">
        <span>Welt 1</span>
        <button
          zBtn="ghost"
          iconOnly
          aria-label="Hinweis zur Welt"
          zTooltip="Die Welt wird beim Anlegen kopiert."
        >
          <z-icon name="info" />
        </button>
        <button
          zBtn="ghost"
          iconOnly
          aria-label="Aktionen für Welt 1"
          [cdkMenuTriggerFor]="weltAktionen"
        >
          <z-icon name="more_vert" />
        </button>
      </div>
      <!-- Live validation next to a tooltip: while the panel stands, the field
           puts its hint and its error id into aria-describedby of the input on
           every keystroke, and the tooltip holds its own id there. -->
      <z-field
        label="Anzeigename"
        for="demo-lang-anzeige"
        [hint]="anzeigeHinweis()"
        [error]="anzeigeFehler()"
      >
        <input
          zInput
          id="demo-lang-anzeige"
          placeholder="Welt von Kian"
          zTooltip="Steht später in der Serverliste"
          [value]="anzeige()"
          (input)="anzeige.set($any($event.target).value)"
        />
      </z-field>
      @for (feld of felder; track feld.id) {
        <z-field [label]="feld.label" [for]="feld.id">
          <input zInput [id]="feld.id" [placeholder]="feld.platzhalter" />
        </z-field>
      }
      <ng-container zDialogActions>
        <button zBtn="ghost" (click)="ref.close()">Abbrechen</button>
        <button zBtn="primary" (click)="ref.close(true)">Server anlegen</button>
      </ng-container>
    </z-dialog>

    <ng-template #weltAktionen>
      <z-menu>
        <button zMenuItem icon="content_copy" (triggered)="ref.close()">Welt kopieren</button>
        <z-menu-separator />
        <button zMenuItem icon="delete" danger (triggered)="ref.close()">Welt löschen</button>
      </z-menu>
    </ng-template>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LangerDialog {
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);

  protected readonly anzeige = signal('');
  /** Reported while typing, so the field writes its error id during input. */
  protected readonly anzeigeFehler = computed(() =>
    this.anzeige().length > 0 && this.anzeige().length < 3
      ? 'Mindestens 3 Zeichen, damit der Name in der Liste lesbar bleibt.'
      : '',
  );
  /**
   * The counter takes over from the error, so typing runs through all three
   * states of `aria-describedby`: nothing, the error id, the hint id. The
   * tooltip on the same input writes there as well.
   */
  protected readonly anzeigeHinweis = computed(() =>
    this.anzeige().length >= 3 ? `${this.anzeige().length} von 32 Zeichen` : '',
  );

  protected readonly felder: readonly LangesFeld[] = [
    { id: 'demo-lang-name', label: 'Servername', platzhalter: 'Beispiel-Server 2' },
    { id: 'demo-lang-welt', label: 'Weltname', platzhalter: 'Welt 1' },
    { id: 'demo-lang-seed', label: 'Seed', platzhalter: '-4707107461894691873' },
    { id: 'demo-lang-port', label: 'Port', platzhalter: '25565' },
    { id: 'demo-lang-slots', label: 'Slots', platzhalter: '20' },
    { id: 'demo-lang-ram', label: 'Arbeitsspeicher in GB', platzhalter: '4' },
    { id: 'demo-lang-loader', label: 'Loader', platzhalter: 'Paper 1.21.4' },
    { id: 'demo-lang-java', label: 'Java-Version', platzhalter: '21' },
    { id: 'demo-lang-backup', label: 'Backup-Zeit', platzhalter: '04:00' },
    { id: 'demo-lang-motd', label: 'Nachricht des Tages', platzhalter: 'Willkommen auf Welt 1' },
    { id: 'demo-lang-ops', label: 'Operatoren', platzhalter: 'kian, lena' },
    { id: 'demo-lang-start', label: 'Startbefehl', platzhalter: 'java -jar paper.jar nogui' },
  ];
}

/**
 * The static dialog for the screenshot uses `z-dialog` itself, because the
 * layout also works standalone and then generates the id of its heading.
 * The static menu below stays hand-written markup: `z-menu` only ever renders
 * through `cdkMenuTriggerFor` inside a CDK overlay, so there is no way to show
 * it open and in place.
 */
@Component({
  selector: 'demo-overlays-page',
  imports: [
    CdkMenuTrigger,
    RouterLink,
    Z_MENU,
    ZButton,
    ZDialogActions,
    ZDialogLayout,
    ZField,
    ZIcon,
    ZInput,
    ZPanel,
  ],
  template: `
    <h1 class="heading-1 demo-title">Overlays</h1>
    <p class="demo-lead">
      Dialog und Menu liegen auf dem CDK. Fokusfalle, Escape und die Rückgabe des Fokus an den
      Auslöser kommen von dort. Beispieldaten: Server "Test" und Beispiel-Server 1.
    </p>

    <section class="demo-section">
      <h2 class="heading-2">Dialog</h2>
      <p class="demo-cap caption">
        Drei Fälle: die destruktive Bestätigung mit Tippfeld, eine kurze Bestätigung und ein eigener
        Dialog über open(). Escape und ein Klick neben den Dialog brechen ab, danach steht der Fokus
        wieder auf dem Button.
      </p>

      <div class="demo-row">
        <button zBtn="danger" (click)="serverLoeschen()">
          <z-icon name="delete" />Server löschen
        </button>
        <button zBtn="secondary" (click)="hartBeenden()">
          <z-icon name="power_settings_new" />Hart beenden
        </button>
        <button zBtn="secondary" (click)="notizBearbeiten()">
          <z-icon name="edit_note" />Notiz bearbeiten
        </button>
      </div>

      @if (loeschErgebnis()) {
        <p class="demo-sub">{{ loeschErgebnis() }}</p>
      }
      @if (beendenErgebnis()) {
        <p class="demo-sub">{{ beendenErgebnis() }}</p>
      }
      @if (notizErgebnis()) {
        <p class="demo-sub">{{ notizErgebnis() }}</p>
      }

      <p class="demo-cap caption">
        Ein Dialog, der länger ist als der Bildschirm: Kopf und Fußzeile bleiben stehen, nur der
        Rumpf scrollt. Tooltip und Menü im Rumpf schließen, sobald darunter gescrollt wird.
      </p>
      <div class="demo-row">
        <button zBtn="secondary" (click)="langenDialogOeffnen()">
          <z-icon name="edit_note" />Langen Dialog öffnen
        </button>
      </div>
      @if (langErgebnis()) {
        <p class="demo-sub">{{ langErgebnis() }}</p>
      }

      <p class="demo-cap caption">
        Derselbe Baustein ohne Overlay, damit der Dialog auf einem Screenshot steht: z-dialog
        arbeitet auch allein und vergibt dann die id seiner Überschrift selbst. role und aria-modal
        setzt im Betrieb der Container des CDK. Bestätigen bleibt gesperrt, bis der Servername genau
        so im Feld steht.
      </p>
      <z-panel flush>
        <div class="z-scrim">
          <z-dialog title='Server "Test" löschen?'>
            <span>
              Welt, Konfiguration und alle 3 Backups werden sofort gelöscht. Das lässt sich nicht
              rückgängig machen. Verbrauchte 0,65&nbsp;€ werden abgerechnet.
            </span>
            <z-field label="Gib zur Bestätigung den Servernamen ein" for="demo-dlg-confirm">
              <input zInput mono id="demo-dlg-confirm" placeholder="Test" />
            </z-field>
            <ng-container zDialogActions>
              <button zBtn="ghost" type="button">Abbrechen</button>
              <button zBtn="danger" type="button" disabled>Server löschen</button>
            </ng-container>
          </z-dialog>
        </div>
      </z-panel>
    </section>

    <section class="demo-section">
      <h2 class="heading-2">Menu</h2>
      <p class="demo-cap caption">
        Die selteneren Aktionen eines Servers hinter einem Button. Pfeiltasten, Pos1, Ende und
        Anfangsbuchstaben führen durch die Einträge, Escape und ein Klick daneben schließen, der
        Fokus kehrt zum Auslöser zurück. Zugriff teilen ist gesperrt, solange Beispiel-Server 1
        installiert wird.
      </p>

      <div class="demo-row">
        <button
          zBtn="ghost"
          iconOnly
          aria-label="Weitere Aktionen für Beispiel-Server 1"
          [cdkMenuTriggerFor]="mehr"
        >
          <z-icon name="more_vert" />
        </button>
      </div>

      @if (menuErgebnis()) {
        <p class="demo-sub">{{ menuErgebnis() }}</p>
      }

      <ng-template #mehr>
        <z-menu>
          <button zMenuItem icon="content_copy" (triggered)="gewaehlt('Adresse kopieren')">
            Adresse kopieren
          </button>
          <button zMenuItem icon="folder" (triggered)="gewaehlt('FTP-Zugang')">FTP-Zugang</button>
          <button
            zMenuItem
            icon="group_add"
            [disabled]="true"
            (triggered)="gewaehlt('Zugriff teilen')"
          >
            Zugriff teilen
          </button>
          <z-menu-separator />
          <button zMenuItem icon="power_settings_new" danger (triggered)="gewaehlt('Hart beenden')">
            Hart beenden
          </button>
          <button zMenuItem icon="delete" danger (triggered)="gewaehlt('Server löschen')">
            Server löschen
          </button>
        </z-menu>
      </ng-template>

      <p class="demo-cap caption">
        Dasselbe Markup ohne Overlay. Rollen und Tastatur setzt im Betrieb das CDK. Destruktive
        Einträge stehen unten hinter der Trennlinie und öffnen einen Dialog.
      </p>
      <div class="demo-row">
        <div class="z-menu">
          <button class="z-menu__item"><z-icon name="content_copy" />Adresse kopieren</button>
          <button class="z-menu__item"><z-icon name="folder" />FTP-Zugang</button>
          <button class="z-menu__item" aria-disabled="true">
            <z-icon name="group_add" />Zugriff teilen
          </button>
          <div class="z-menu__sep"></div>
          <button class="z-menu__item z-menu__item--danger">
            <z-icon name="power_settings_new" />Hart beenden
          </button>
          <button class="z-menu__item z-menu__item--danger">
            <z-icon name="delete" />Server löschen
          </button>
        </div>
      </div>

      <p class="demo-cap caption">
        Einträge, die irgendwohin führen, sind Links. Rolle, Pfeiltasten und Anfangsbuchstaben
        bleiben gleich; Enter, Leertaste und Klick öffnen die Seite und schließen das Menü,
        Strg-Klick öffnet einen neuen Tab und lässt das Menü offen. Rechnungen ist gesperrt, solange
        der Monat läuft: der Eintrag behält seine Adresse und führt trotzdem nirgendwohin.
      </p>
      <div class="demo-row">
        <button zBtn="secondary" [cdkMenuTriggerFor]="seiten">Weitere Seiten</button>
      </div>

      <ng-template #seiten>
        <z-menu>
          <a zMenuItem icon="dns" routerLink="/daten">Daten</a>
          <a zMenuItem icon="description" routerLink="/formulare">Formulare</a>
          <a zMenuItem icon="receipt_long" [disabled]="true" routerLink="/daten">Rechnungen</a>
          <z-menu-separator />
          <button zMenuItem icon="content_copy" (triggered)="gewaehlt('Link kopieren')">
            Link kopieren
          </button>
        </z-menu>
      </ng-template>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverlaysPage {
  private readonly dialog = inject(ZDialog);

  protected readonly loeschErgebnis = signal('');
  protected readonly beendenErgebnis = signal('');
  protected readonly notizErgebnis = signal('');
  protected readonly menuErgebnis = signal('');
  protected readonly langErgebnis = signal('');

  /*
   * The dialog APIs answer with an Observable that emits exactly once (the API
   * table prescribes `Observable<boolean>`, `closed` comes from the CDK). One
   * value is a promise, so the page awaits it and holds no subscription.
   */
  protected async serverLoeschen(): Promise<void> {
    const ja = await firstValueFrom(
      this.dialog.confirm({
        title: 'Server "Test" löschen?',
        body:
          'Welt, Konfiguration und alle 3 Backups werden sofort gelöscht. Das lässt sich nicht ' +
          'rückgängig machen. Verbrauchte 0,65\u00a0€ werden abgerechnet.',
        confirmLabel: 'Server löschen',
        cancelLabel: 'Abbrechen',
        danger: true,
        requireText: 'Test',
        requireLabel: 'Gib zur Bestätigung den Servernamen ein',
      }),
    );
    this.loeschErgebnis.set(`Server löschen: ${ja ? 'Bestätigt' : 'Abgebrochen'}`);
  }

  protected async hartBeenden(): Promise<void> {
    const ja = await firstValueFrom(
      this.dialog.confirm({
        title: 'Beispiel-Server 1 hart beenden?',
        body: 'Der Prozess wird sofort gestoppt. Nicht gespeicherte Daten der Welt gehen verloren.',
        confirmLabel: 'Hart beenden',
        cancelLabel: 'Abbrechen',
        danger: true,
      }),
    );
    this.beendenErgebnis.set(`Hart beenden: ${ja ? 'Bestätigt' : 'Abgebrochen'}`);
  }

  protected async notizBearbeiten(): Promise<void> {
    const notiz = await firstValueFrom(
      this.dialog.open<string, unknown, NotizDialog>(NotizDialog).closed,
    );
    this.notizErgebnis.set(notiz ? `Notiz gespeichert: ${notiz}` : 'Notiz bearbeiten: Abgebrochen');
  }

  protected async langenDialogOeffnen(): Promise<void> {
    const ja = await firstValueFrom(
      this.dialog.open<boolean, unknown, LangerDialog>(LangerDialog).closed,
    );
    this.langErgebnis.set(`Langer Dialog: ${ja ? 'Angelegt' : 'Abgebrochen'}`);
  }

  protected gewaehlt(eintrag: string): void {
    this.menuErgebnis.set(`Gewählter Eintrag: ${eintrag}`);
  }
}
