import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

import { isDevMode } from '@angular/core';;
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
import { AuthInterceptor } from './core/interceptors/auth.interceptor';
//import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
//import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { environment } from '../environments/environment';
//import { provideServiceWorker } from '@angular/service-worker';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { authBlockInterceptor } from './core/interceptors/auth-block.interceptor'
import { importProvidersFrom } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader, TRANSLATE_HTTP_LOADER_CONFIG } from '@ngx-translate/http-loader';
import { provideServiceWorker } from '@angular/service-worker';


export const appConfig: ApplicationConfig = {
  providers: [
    // Providers from the first config
    provideBrowserGlobalErrorListeners(),
    provideClientHydration(withEventReplay()),

    // Router and HTTP/Chart providers from the second config
    provideRouter(routes),
    provideCharts(withDefaultRegisterables()),
    provideHttpClient(
      withFetch(),
      withInterceptors([AuthInterceptor, authBlockInterceptor])
    ),
    provideCharts(withDefaultRegisterables()),
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
      })
    ), provideServiceWorker('ngsw-worker.js', {
            enabled: !isDevMode(),
            registrationStrategy: 'registerWhenStable:30000'
          })
  ]
};
