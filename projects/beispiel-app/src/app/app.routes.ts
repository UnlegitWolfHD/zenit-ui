import { Routes } from '@angular/router';

/**
 * One page, reached lazily. `/` redirects to it, so the application always
 * shows the Gameserver list.
 */
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'gameserver' },
  {
    path: 'gameserver',
    loadComponent: () => import('./pages/gameserver/gameserver').then((m) => m.Gameserver),
  },
];
