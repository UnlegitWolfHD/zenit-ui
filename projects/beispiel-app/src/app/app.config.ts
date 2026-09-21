import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // withComponentInputBinding() hands query parameters to matching component
    // inputs. That is how `?zustand=laden` reaches the page without the page
    // having to subscribe to the router.
    provideRouter(routes, withComponentInputBinding()),
  ],
};
