import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ZField, ZSelect, ZTheme } from 'zenit-ui';

@Component({
  selector: 'demo-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ZField, ZSelect],
  template: `
    <a class="demo-skip body-sm" href="#inhalt">Zum Hauptinhalt springen</a>
    <header>
      <div class="z-container demo-header">
        <span class="demo-brand heading-2">zenit-ui</span>
        <nav class="demo-nav body-sm" aria-label="Demo-Seiten">
          @for (seite of seiten; track seite.pfad) {
            <a [routerLink]="seite.pfad" routerLinkActive ariaCurrentWhenActive="page">{{
              seite.name
            }}</a>
          }
        </nav>
        <div class="demo-theme">
          <z-field label="Farbschema" for="theme-schema">
            <z-select size="sm">
              <select id="theme-schema" (change)="schemaWaehlen($event)">
                @for (eintrag of schemata; track eintrag.id) {
                  <option [value]="eintrag.id" [selected]="eintrag.id === theme.scheme()">
                    {{ eintrag.name }}
                  </option>
                }
              </select>
            </z-select>
          </z-field>
          <z-field label="Akzent" for="theme-akzent">
            <z-select size="sm">
              <select id="theme-akzent" (change)="akzentWaehlen($event)">
                @for (eintrag of akzente; track eintrag.id) {
                  <option [value]="eintrag.id" [selected]="eintrag.id === theme.accent()">
                    {{ eintrag.name }}
                  </option>
                }
              </select>
            </z-select>
          </z-field>
        </div>
      </div>
    </header>
    <main id="inhalt" class="z-container demo-main" tabindex="-1">
      <router-outlet />
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly theme = inject(ZTheme);

  protected readonly schemata = [
    { id: 'dark', name: 'Dunkel' },
    { id: 'light', name: 'Hell' },
    { id: 'contrast', name: 'Kontrast' },
    { id: 'system', name: 'System' },
  ];

  protected readonly akzente = [
    { id: 'rot', name: 'Rot' },
    { id: 'blau', name: 'Blau' },
    { id: 'gruen', name: 'Grün' },
    { id: 'violett', name: 'Violett' },
  ];

  protected readonly seiten = [
    { pfad: '/grundlage', name: 'Grundlage' },
    { pfad: '/formulare', name: 'Formulare' },
    { pfad: '/navigation', name: 'Navigation' },
    { pfad: '/daten', name: 'Daten' },
    { pfad: '/rueckmeldung', name: 'Rückmeldung' },
    { pfad: '/overlays', name: 'Overlays' },
    { pfad: '/werkzeuge', name: 'Werkzeuge' },
    { pfad: '/konfigurator', name: 'Konfigurator' },
    { pfad: '/themes', name: 'Themes' },
    { pfad: '/muster/dashboard', name: 'Dashboard' },
    { pfad: '/muster/server-panel', name: 'Server-Panel' },
    { pfad: '/muster/startseite', name: 'Startseite' },
    { pfad: '/muster/server-erstellen', name: 'Server erstellen' },
    { pfad: '/muster/preisrechner', name: 'Preisrechner' },
  ];

  // setScheme() and setAccent() return false for an id that is not registered.
  // The select then jumps back, so it never shows a value that is not applied.
  protected schemaWaehlen(ereignis: Event): void {
    const feld = ereignis.target as HTMLSelectElement;
    if (!this.theme.setScheme(feld.value)) {
      feld.value = this.theme.scheme();
    }
  }

  protected akzentWaehlen(ereignis: Event): void {
    const feld = ereignis.target as HTMLSelectElement;
    if (!this.theme.setAccent(feld.value)) {
      feld.value = this.theme.accent();
    }
  }
}
