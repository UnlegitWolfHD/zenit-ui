import { DialogRef } from '@angular/cdk/dialog';
import { CdkMenuTrigger } from '@angular/cdk/menu';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
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
} from 'zenit-ui';

/** Custom dialog through ZDialog.open(): a short form with one field. */
@Component({
  selector: 'demo-notiz-dialog',
  imports: [ZButton, ZDialogActions, ZDialogLayout, ZField, ZInput],
  template: `
    <z-dialog title="Notiz zu Beispiel-Server 1">
      <z-field label="Notiz" for="demo-notiz" hint="Nur für dich sichtbar.">
        <input zInput id="demo-notiz" #notiz placeholder="Was hast du zuletzt geändert?" />
      </z-field>
      <ng-container zDialogActions>
        <button zBtn="ghost" (click)="ref.close()">Abbrechen</button>
        <button zBtn="primary" (click)="ref.close(notiz.value)">Notiz speichern</button>
      </ng-container>
    </z-dialog>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotizDialog {
  protected readonly ref = inject<DialogRef<string>>(DialogRef);
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
        <button zBtn="ghost" iconOnly aria-label="Weitere Aktionen" [cdkMenuTriggerFor]="mehr">
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

  protected serverLoeschen(): void {
    this.dialog
      .confirm({
        title: 'Server "Test" löschen?',
        body:
          'Welt, Konfiguration und alle 3 Backups werden sofort gelöscht. Das lässt sich nicht ' +
          'rückgängig machen. Verbrauchte 0,65\u00a0€ werden abgerechnet.',
        confirmLabel: 'Server löschen',
        cancelLabel: 'Abbrechen',
        danger: true,
        requireText: 'Test',
        requireLabel: 'Gib zur Bestätigung den Servernamen ein',
      })
      .subscribe((ja) =>
        this.loeschErgebnis.set(`Server löschen: ${ja ? 'Bestätigt' : 'Abgebrochen'}`),
      );
  }

  protected hartBeenden(): void {
    this.dialog
      .confirm({
        title: 'Beispiel-Server 1 hart beenden?',
        body: 'Der Prozess wird sofort gestoppt. Nicht gespeicherte Daten der Welt gehen verloren.',
        confirmLabel: 'Hart beenden',
        cancelLabel: 'Abbrechen',
        danger: true,
      })
      .subscribe((ja) =>
        this.beendenErgebnis.set(`Hart beenden: ${ja ? 'Bestätigt' : 'Abgebrochen'}`),
      );
  }

  protected notizBearbeiten(): void {
    this.dialog
      .open<string, unknown, NotizDialog>(NotizDialog)
      .closed.subscribe((notiz) =>
        this.notizErgebnis.set(
          notiz ? `Notiz gespeichert: ${notiz}` : 'Notiz bearbeiten: Abgebrochen',
        ),
      );
  }

  protected gewaehlt(eintrag: string): void {
    this.menuErgebnis.set(`Gewählter Eintrag: ${eintrag}`);
  }
}
