import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * Every demo page is prerendered. The demo has no data of its own that a
 * request could change, so there is nothing a route could need a server for.
 */
export const serverRoutes: ServerRoute[] = [
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
