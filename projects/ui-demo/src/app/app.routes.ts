import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'grundlage' },
  {
    path: 'grundlage',
    loadComponent: () => import('./pages/grundlage/grundlage.page').then((m) => m.GrundlagePage),
  },
  {
    path: 'formulare',
    loadComponent: () => import('./pages/formulare/formulare.page').then((m) => m.FormularePage),
  },
  {
    path: 'navigation',
    loadComponent: () => import('./pages/navigation/navigation.page').then((m) => m.NavigationPage),
  },
  {
    path: 'daten',
    loadComponent: () => import('./pages/daten/daten.page').then((m) => m.DatenPage),
  },
  {
    path: 'rueckmeldung',
    loadComponent: () =>
      import('./pages/rueckmeldung/rueckmeldung.page').then((m) => m.RueckmeldungPage),
  },
  {
    path: 'overlays',
    loadComponent: () => import('./pages/overlays/overlays.page').then((m) => m.OverlaysPage),
  },
  {
    path: 'werkzeuge',
    loadComponent: () => import('./pages/werkzeuge/werkzeuge.page').then((m) => m.WerkzeugePage),
  },
  {
    path: 'konfigurator',
    loadComponent: () =>
      import('./pages/konfigurator/konfigurator.page').then((m) => m.KonfiguratorPage),
  },
  {
    path: 'themes',
    loadComponent: () => import('./pages/themes/themes.page').then((m) => m.ThemesPage),
  },
  {
    path: 'muster/dashboard',
    loadComponent: () => import('./pages/muster/dashboard.page').then((m) => m.MusterDashboardPage),
  },
  {
    path: 'muster/server-panel',
    loadComponent: () =>
      import('./pages/muster/server-panel.page').then((m) => m.MusterServerPanelPage),
  },
  {
    path: 'muster/startseite',
    loadComponent: () =>
      import('./pages/muster/startseite.page').then((m) => m.MusterStartseitePage),
  },
  {
    path: 'muster/server-erstellen',
    loadComponent: () =>
      import('./pages/muster/server-erstellen.page').then((m) => m.MusterServerErstellenPage),
  },
  {
    path: 'muster/preisrechner',
    loadComponent: () =>
      import('./pages/muster/preisrechner.page').then((m) => m.MusterPreisrechnerPage),
  },
  // Not in the demo navigation either: a measuring page for the header at small
  // widths, which e2e/kopfzeile.spec.ts reads.
  {
    path: 'muster/kopfzeile',
    loadComponent: () => import('./pages/muster/kopfzeile.page').then((m) => m.KopfzeilePage),
  },
  // Not in the demo navigation: the page carries an old stylesheet on purpose
  // and is exempt from the style rules the generic suites check on every route.
  {
    path: 'muster/legacy',
    loadComponent: () => import('./pages/muster/legacy.page').then((m) => m.LegacyPage),
  },
];
