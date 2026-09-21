import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideZenitTheme } from 'zenit-ui';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // Die Stilblätter dazu kommen aus styles.css: themes.css nach tokens.css.
    provideZenitTheme(),
  ],
};
