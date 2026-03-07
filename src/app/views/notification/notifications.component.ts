import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../core/services/notification.service';
import { Observable } from 'rxjs';
import { Notification } from '../../model/notification.model';

@Component({
  selector: 'app-notifications',
  standalone: true, // Ensure this is present for imports to work
  imports: [CommonModule],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss']
})
export class NotificationsComponent implements OnInit {
  // Using inject() is preferred over constructor injection in modern Angular
  private notificationService = inject(NotificationService);

  private userId: number | null = null;

  // Link to the stream
  notifications$: Observable<Notification[]> = this.notificationService.notifications$;

  ngOnInit(): void {
    const userData = localStorage.getItem('USER_PROFILE_DATA');
    if (userData) {
      const user = JSON.parse(userData);
      this.userId = user.id || user.userId;

      if (this.userId) {
        this.notificationService.getNotifications(this.userId);
      }
    }
  }

  markAsRead(notificationId: number) {
    if (this.userId) {
      // Cleaner: no need to parse storage on every click
      this.notificationService.markAsSeen(notificationId, this.userId);
    }
  }
}