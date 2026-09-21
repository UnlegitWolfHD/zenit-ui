import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'demo-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
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
      </div>
    </header>
    <main id="inhalt" class="z-container demo-main" tabindex="-1">
      <router-outlet />
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly seiten = [
    { pfad: '/grundlage', name: 'Grundlage' },
    { pfad: '/formulare', name: 'Formulare' },
    { pfad: '/navigation', name: 'Navigation' },
    { pfad: '/daten', name: 'Daten' },
    { pfad: '/rueckmeldung', name: 'Rückmeldung' },
    { pfad: '/overlays', name: 'Overlays' },
    { pfad: '/werkzeuge', name: 'Werkzeuge' },
  ];
}
