import { Component, OnInit } from '@angular/core'; // Added OnInit
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageService } from '../../../app/core/services/language.service';
import { MatOptionModule } from '@angular/material/core';
import { ThemeService } from '../../../app/core/services/theme-service';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FCMService } from '../../core/services/fcm.service';
import { UserService } from '../../core/services/user.service'
import { MatSnackBar } from '@angular/material/snack-bar';
import { take } from 'rxjs/operators'; // Added take operator
import { DataService } from '../../core/services/data.service'

@Component({
  selector: 'app-settings',
  imports: [
    MatFormFieldModule,
    MatSelectModule,
    TranslateModule,
    MatOptionModule,
    MatSlideToggleModule
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent implements OnInit { // Implemented OnInit

  currentLang: string | undefined;
  notificationsEnabled: boolean = false; // Initialized to false

  constructor(
    private languageService: LanguageService,
    private themeService: ThemeService,
    private fcmService: FCMService,
    private userService: UserService,
    private snackbar: MatSnackBar,
    private dataService: DataService
  ) {
    this.currentLang = this.languageService.currentLang
  }

  // Use ngOnInit for initialization logic
  ngOnInit(): void {
    // 💡 FIX 1: Correctly retrieve and convert the boolean value from localStorage
    const enabled = localStorage.getItem('NOTIFICATIONS_ENABLED') === 'true';
    this.notificationsEnabled = enabled;

    // Optional: Check if permission is denied, and if so, force the toggle OFF
    // since the user cannot re-enable it without browser settings changes.
    if (Notification.permission === 'denied') {
      this.notificationsEnabled = false;
      localStorage.setItem('NOTIFICATIONS_ENABLED', 'false');
    }
  }

  changeLanguage(lang: string) {
    this.languageService.use(lang);
    this.currentLang = lang;
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  toggleNotifications(checked: boolean) {
    // 💡 STEP 1: Update the flag locally right away for a responsive UI
    this.notificationsEnabled = checked;

    if (checked) {
      // ----------------------------------------------------
      // STATE 1: NOTIFICATIONS ENABLED (Toggle ON)
      // ----------------------------------------------------
      this.fcmService.requestPermissionAndGetToken().then(token => {
        if (token) {
          // Send the token to the server to enable push for this device
          this.userService.updateUserFCMToken(token).pipe(take(1)).subscribe({
            next: () => {
              localStorage.setItem('NOTIFICATIONS_ENABLED', 'true'); // Save ON state
              this.snackbar.open("Notifications enabled!", "Success", { duration: 3000 });
            },
            error: (err) => {
              console.error('Failed to update FCM token on server:', err);
              // 💡 IMPORTANT: Revert the toggle and local storage on failure
              this.notificationsEnabled = false;
              localStorage.setItem('NOTIFICATIONS_ENABLED', 'false');
              this.snackbar.open("Failed to enable notifications.", "Error", { duration: 5000 });
            }
          });
        } else {
          // Token not available (e.g., user denied permission)
          this.notificationsEnabled = false;
          localStorage.setItem('NOTIFICATIONS_ENABLED', 'false');
          this.snackbar.open("Permission denied or failed to get token.", "Warning", { duration: 5000 });
        }
      });
    } else {
      // ----------------------------------------------------
      // STATE 2: NOTIFICATIONS DISABLED (Toggle OFF) - (REVISED LOGIC)
      // ----------------------------------------------------
      // Call the dedicated service to clear the token and disable push on the server.
      // We pass 'null' to indicate the token should be removed from the user record.
      this.userService.updateUserFCMToken(null).pipe(take(1)).subscribe({
        next: () => {
          localStorage.setItem('NOTIFICATIONS_ENABLED', 'false'); // Save OFF state
          this.snackbar.open("Notifications disabled.", "Success", { duration: 3000 });
        },
        error: (err) => {
          console.error('Failed to disable FCM token on server:', err);
          // IMPORTANT: Revert the toggle and local storage on failure
          this.notificationsEnabled = true;
          localStorage.setItem('NOTIFICATIONS_ENABLED', 'true');
          this.snackbar.open("Failed to disable notifications on server. Please try again.", "Error", { duration: 5000 });
        }
      });
    }
  }

  get isDark(): boolean {
    return this.themeService.isDark();
  }
}
