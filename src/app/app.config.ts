import { 
  ApplicationConfig, 
  provideBrowserGlobalErrorListeners, 
  provideAppInitializer,
  inject,
  isDevMode, 
  importProvidersFrom,
  PLATFORM_ID
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { isPlatformServer } from '@angular/common';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
import { provideServiceWorker } from '@angular/service-worker';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

import { routes } from './app.routes';
import { environment } from '../environments/environment';
import { AuthInterceptor } from './core/interceptors/auth.interceptor';
import { authBlockInterceptor } from './core/interceptors/auth-block.interceptor';
import { FeatureFlagService } from './services/feature-flag.service';

import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader, TRANSLATE_HTTP_LOADER_CONFIG } from '@ngx-translate/http-loader';
import { NgxGoogleAnalyticsModule, NgxGoogleAnalyticsRouterModule } from 'ngx-google-analytics';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideClientHydration(withEventReplay()),

    // Router Configuration
    provideRouter(routes),

    // HTTP Configuration
    provideHttpClient(
      withFetch(),
      withInterceptors([AuthInterceptor, authBlockInterceptor])
    ),

    // Feature Flags Initialization (skip during SSR/prerender to avoid route extraction timeout)
    provideAppInitializer(() => {
      const featureFlagService = inject(FeatureFlagService);
      const platformId = inject(PLATFORM_ID);

      if (isPlatformServer(platformId)) {
        featureFlagService.setFlags({});
        return Promise.resolve();
      }

      // Do not block app bootstrap; load flags in background.
      void featureFlagService.loadFlags().catch(() => {
        featureFlagService.setFlags({});
      });

      return Promise.resolve();
    }),

    // Chart Configuration
    provideCharts(withDefaultRegisterables()),

    // Translation Configuration
    {
      provide: TRANSLATE_HTTP_LOADER_CONFIG,
      useValue: {
        prefix: './assets/i18n/',
        suffix: '.json'
      }
    },
    importProvidersFrom(
      TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useClass: TranslateHttpLoader
        }
      }),
      NgxGoogleAnalyticsModule.forRoot(environment.gaMeasurementId),
      NgxGoogleAnalyticsRouterModule
    ),

    // Service Worker
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    })
  ]
};