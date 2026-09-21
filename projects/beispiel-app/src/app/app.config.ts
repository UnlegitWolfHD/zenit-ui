import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideZenitTheme } from 'zenit-ui';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // withComponentInputBinding() hands query parameters to matching component
    // inputs. That is how `?zustand=laden` reaches the page without the page
    // having to subscribe to the router.
    provideRouter(routes, withComponentInputBinding()),
    // #region theme
    // Scheme and accent live in themes.css; the provider applies the stored or
    // the default choice before the first frame and keeps it in localStorage.
    // 'system' follows prefers-color-scheme until someone picks a scheme.
    provideZenitTheme({ defaultScheme: 'system' }),
    // Another language for the library's own texts would be:
    // provideZenitLabels(Z_LABELS_EN),
    // #endregion
  ],
};
