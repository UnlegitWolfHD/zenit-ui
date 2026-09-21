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
    path: 'muster/dashboard',
    loadComponent: () =>
      import('./pages/muster/dashboard.page').then((m) => m.MusterDashboardPage),
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
];
