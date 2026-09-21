import { Routes } from '@angular/router';

/**
 * Two pages, both lazy. `/` redirects to the Gameserver list, which is the page
 * this example is about; `/einbindung` explains how it is wired.
 */
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'gameserver' },
  {
    path: 'gameserver',
    loadComponent: () => import('./pages/gameserver/gameserver').then((m) => m.Gameserver),
  },
  {
    path: 'einbindung',
    loadComponent: () => import('./pages/einbindung/einbindung').then((m) => m.Einbindung),
  },
];
