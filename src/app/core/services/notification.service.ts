import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { build, ApiEndpoints } from '../api/endpoints';
import { Notification } from '../../model/notification.model';
import { Page } from '../../model/page.model';

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private http = inject(HttpClient);

    // Subjects for State Management
    private unreadNotificationsSubject = new BehaviorSubject<number>(0);
    private notificationsSubject = new BehaviorSubject<Notification[]>([]);
    private totalElementsSubject = new BehaviorSubject<number>(0);

    // Public Observables
    unreadNotificationsCount$ = this.unreadNotificationsSubject.asObservable();
    notifications$ = this.notificationsSubject.asObservable();
    totalElements$ = this.totalElementsSubject.asObservable();

    /**
     * Fetches the global unread count from the backend
     */
    refreshUnreadCount(userId: number): void {
        const url = build(ApiEndpoints.notification.GET_UNSEEN_COUNT, { userId });
        this.http.get<number>(url).subscribe({
            next: (count) => this.unreadNotificationsSubject.next(count),
            error: (err) => console.error('Failed to fetch global unread count', err)
        });
    }

    /**
     * Fetches a paginated list of notifications
     */
    getNotifications(userId: number, page: number = 0, size: number = 10): void {
        const url = build(ApiEndpoints.notification.GET_ALL_NOTIFICATIONS, { userId });
        
        // Use HttpParams for cleaner query string management
        const params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());

        this.http.get<Page<Notification>>(url, { params }).subscribe({
            next: (pageData) => {
                this.notificationsSubject.next(pageData.content);
                // Update the total count so the MatPaginator knows the total length
                this.totalElementsSubject.next(pageData.totalElements);
            },
            error: (err) => console.error('Error fetching paginated notifications:', err)
        });
    }

    /**
     * Optimistically updates the UI state before the server responds
     */
    private applyOptimisticRead(notificationId: number): void {
        // 1. Update the numeric badge count locally
        const currentCount = this.unreadNotificationsSubject.value;
        if (currentCount > 0) {
            this.unreadNotificationsSubject.next(currentCount - 1);
        }

        // 2. Update the notification list item state
        const currentNotifications = this.notificationsSubject.value;
        const updatedNotifications = currentNotifications.map(n =>
            n.id === notificationId ? { ...n, isSeen: true } : n
        );
        this.notificationsSubject.next(updatedNotifications);
    }

    /**
     * Marks a notification as seen on the server and updates local state
     */
    markAsSeen(notificationId: number, userId: number): void {
        // Apply changes immediately for a snappy feel
        this.applyOptimisticRead(notificationId);

        const url = build(ApiEndpoints.notification.MARK_AS_SEEN, { id: notificationId });
        
        this.http.patch<void>(url, {}).subscribe({
            next: () => {
                // Stay synced with the real database count
                this.refreshUnreadCount(userId);
            },
            error: (err) => {
                console.error('Server sync failed, rolling back UI state', err);
                // Rollback: re-fetch the current page to restore original state
                this.getNotifications(userId); 
                this.refreshUnreadCount(userId);
            }
        });
    }
}