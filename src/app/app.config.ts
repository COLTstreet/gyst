import { ApplicationConfig, ErrorHandler, provideBrowserGlobalErrorListeners, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideServiceWorker } from '@angular/service-worker';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import { MessageService } from 'primeng/api';
import { GystPreset } from './core/theme';
import { GlobalErrorHandler } from './core/global-error-handler';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideAnimationsAsync(),
    MessageService,
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
    providePrimeNG({
      theme: {
        preset: GystPreset,
        options: {
          // Permanently dark: '.app-dark' is hardcoded on <html> in index.html
          // rather than toggled, since there's no light-mode UI in this app.
          darkModeSelector: '.app-dark',
          cssLayer: {
            name: 'primeng',
            order: 'theme, base, primeng, components, utilities',
          },
        },
      },
      license:
        'eyJpZCI6ImFjYzA5MzM1LWRhNWUtNDc5NS1hZDRmLTVkMWY1YWZiMmMyNyIsInByb2R1Y3QiOiJwcmltZXVpIiwidGllciI6ImNvbW11bml0eSIsInR5cGUiOiJkZXYiLCJpYXQiOjE3ODkzOTU1NDMsImV4cCI6MTgyMDkzMTU0M30.5lBxOwRdq6Fr1H6w5gqgGDnsckUbY-eOV_VcY2H38ZMRaiwvDdiC3rQwyfyBcjewQv0RzzWaF_RVy7Le65GbBg',
    }),
  ],
};
