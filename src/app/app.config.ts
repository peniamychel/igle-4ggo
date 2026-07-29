import {ApplicationConfig, importProvidersFrom, provideZoneChangeDetection, LOCALE_ID} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import {provideHttpClient, withInterceptors} from '@angular/common/http';
import {authInterceptor} from './core/interceptors/auth.interceptor';
import {provideAnimations} from '@angular/platform-browser/animations';
import {MatNativeDateModule} from '@angular/material/core';

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: LOCALE_ID, useValue: 'es-ES' },
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    // Un solo proveedor de animaciones: registrar además provideAnimationsAsync()
    // dejaba animaciones a medias (p. ej. el panel expansible nunca abría su cuerpo).
    provideAnimations(),
    importProvidersFrom(MatNativeDateModule),

    provideHttpClient(withInterceptors([authInterceptor]))
  ]
};
