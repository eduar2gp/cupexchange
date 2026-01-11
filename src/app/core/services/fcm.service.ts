import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { environment } from '../../../environments/environment';
import { isPlatformBrowser } from '@angular/common';
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, MessagePayload, Messaging } from 'firebase/messaging';
import { Observable, Subject } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class FCMService {

  private messageSubject = new Subject<MessagePayload>();
  private messagingInstance: Messaging | null = null;
  private isBrowser: boolean;

  constructor(
    @Inject(PLATFORM_ID) platformId: Object,
    private snackbar: MatSnackBar
  ) {
    this.isBrowser = isPlatformBrowser(platformId);

    if (this.isBrowser) {
      const firebaseApp = initializeApp(environment.firebaseConfig);
      try {
        this.messagingInstance = getMessaging(firebaseApp);

        // 💡 FIX 1: Initialize the foreground listener ONLY ONCE in the constructor
        this.initializeForegroundListener();

      } catch (e) {
        console.warn("FCM initialization failed:", e);
        this.messagingInstance = null;
      }
    } else {
      this.messagingInstance = null;
    }
  }

  /**
   * 💡 FIX 2: Listener setup is moved to a private method and called only once.
   * This prevents multiple listeners from being registered when receiveMessages() is called.
   */
  private initializeForegroundListener(): void {
    if (this.messagingInstance) {
      // onMessage listener executes when the tab is focused (foreground)
      onMessage(this.messagingInstance, (payload: any) => {
        console.log('FCM Message received in foreground:', payload);

        // 1. Dispatch the payload to any subscribing component/service
        this.messageSubject.next(payload);

        // 2. Display a custom in-app banner/toast
        this.displayInAppNotification(payload);
      });
    }
  }

  // 1. Request Permission and Get Token
  async requestPermissionAndGetToken(): Promise<string | null> {
    if (!this.isBrowser || !this.messagingInstance) {
      console.warn("FCM token request skipped: Not running in a supported browser environment.");
      return null;
    }

    try {
      const permission = await Notification.requestPermission();

      if (permission === 'granted') {
        if ('serviceWorker' in navigator) {
          // Using navigator.serviceWorker.getRegistration() to avoid re-registering if possible,
          // but the provided code to register is fine if you want to ensure it's there.
          const swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

          const currentToken = await getToken(this.messagingInstance, {
            serviceWorkerRegistration: swRegistration,
            vapidKey: environment.firebaseConfig.vapidKey
          });

          if (currentToken) {
            console.log('FCM Token:', currentToken);
            return currentToken;
          } else {
            console.log('No registration token available. Request permission to generate one.');
            return null;
          }
        }
        else {
          console.error("Service Workers are not supported or the context is not secure.");
          return null;
        }
      } else {
        console.log('Notification permission denied.');
        return null;
      }
    } catch (err) {
      console.error('An error occurred while retrieving token:', err);
      return null;
    }
  }

  // Method for components to subscribe to the message stream
  receiveMessages(): Observable<MessagePayload> {
    // 💡 FIX 3: This method ONLY returns the Observable stream. 
    // The listener setup is handled by initializeForegroundListener()
    return this.messageSubject.asObservable();
  }

  public displayInAppNotification(payload: MessagePayload) {
    // This logic is already correct for reading Data Messages (customTitle/Body)
    const customData = payload.data;
    const customTitle = customData?.['customTitle'];
    const customBody = customData?.['customBody'];

    // Fallback included for robustness
    const title = customTitle || payload.notification?.title || 'New Notification';
    const body = customBody || payload.notification?.body || 'Check your updates.';

    this.snackbar.open(body, title, { duration: 5000 });
  }
}
