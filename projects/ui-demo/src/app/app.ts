import { ChangeDetectionStrategy, Component, DOCUMENT, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ZField, ZSelect, ZSkipLink, ZTheme } from 'zenit-ui';

@Component({
  selector: 'demo-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ZField, ZSelect, ZSkipLink],
  template: `
    <a zSkipLink class="body-sm" href="#inhalt">Zum Hauptinhalt springen</a>
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
          <z-field label="Breite" for="theme-breite">
            <z-select size="sm">
              <select id="theme-breite" (change)="breiteWaehlen($event)">
                @for (wert of breiten; track wert) {
                  <option [value]="wert" [selected]="wert === breite()">{{ wert }}&nbsp;px</option>
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
  private readonly dok = inject(DOCUMENT);

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
    { id: 'indigo', name: 'Indigo' },
    { id: 'orange', name: 'Orange' },
    { id: 'rose', name: 'Rose' },
    { id: 'schwarz', name: 'Schwarz' },
  ];

  /**
   * The page width is an application setting, not a theme: the mechanism is
   * the custom property `--container`, which a product overrides once in its
   * own stylesheet (docs/theming.md, "Page width"). The demo has to switch it
   * while the page is open, so it writes the inline style instead, which beats
   * every stylesheet. Nothing is stored: the demo always starts at the
   * library's default, so a screenshot run measures the documented width.
   */
  protected readonly breiten = ['1120', '1280', '1440'];
  protected readonly breite = signal(this.breiten[0]);

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

  // Only ever reached from a change event, so the server never gets here.
  protected breiteWaehlen(ereignis: Event): void {
    const feld = ereignis.target as HTMLSelectElement;
    this.breite.set(feld.value);
    this.dok.documentElement.style.setProperty('--container', `${feld.value}px`);
  }
}
