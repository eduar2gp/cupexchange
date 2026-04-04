import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../core/services/notification.service';
import { Observable, Subscription } from 'rxjs';
import { Notification } from '../../model/notification.model';
import { PageEvent, MatPaginatorModule } from '@angular/material/paginator';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss']
})
export class NotificationsComponent implements OnInit, OnDestroy {
  private notificationService = inject(NotificationService);
  private subscription = new Subscription();

  // State properties
  private userId: number | null = null;
  currentPage = 0;
  pageSize = 10;
  totalElements = 0;

  // Streams
  notifications$: Observable<Notification[]> = this.notificationService.notifications$;

  ngOnInit(): void {
    // 1. Subscribe to metadata updates for the Paginator
    this.subscription.add(
      this.notificationService.totalElements$.subscribe(total => {
        this.totalElements = total;
      })
    );

    // 2. Initialize user context and load first page
    const userData = localStorage.getItem('USER_PROFILE_DATA');
    if (userData) {
      const user = JSON.parse(userData);
      this.userId = user.id || user.userId;
      if (this.userId) {
        this.loadNotifications();
      }
    }
  }

  /**
   * Triggers the service to fetch data based on current pagination state
   */
  loadNotifications(): void {
    if (this.userId) {
      this.notificationService.getNotifications(
        this.userId,
        this.currentPage,
        this.pageSize
      );
    }
  }
  /**
   * Handles pagination changes from the MatPaginator UI
   */
  handlePageEvent(e: PageEvent): void {
    this.currentPage = e.pageIndex;
    this.pageSize = e.pageSize;
    this.loadNotifications();
  }
  /**
   * Marks a single notification as read and triggers optimistic UI updates
   */
  markAsRead(notificationId: number): void {
    if (this.userId) {
      this.notificationService.markAsSeen(notificationId, this.userId);
    }
  }

  trackByNotificationId(index: number, notification: Notification): number {
    return notification.id;   // or notification.id ?? index
  }

  ngOnDestroy(): void {
    // Clean up subscription to avoid memory leaks
    this.subscription.unsubscribe();
  }
}