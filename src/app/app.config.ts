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
    ), provideCharts(withDefaultRegisterables()),
  ]
};
