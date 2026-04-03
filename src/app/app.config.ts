import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  LOCALE_ID
} from '@angular/core';
import {provideRouter} from '@angular/router';
import {registerLocaleData} from '@angular/common';
import localeEsCo from '@angular/common/locales/es-CO';

import {routes} from './app.routes';

registerLocaleData(localeEsCo, 'es-CO');

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(), 
    provideRouter(routes),
    { provide: LOCALE_ID, useValue: 'es-CO' }
  ],
};
