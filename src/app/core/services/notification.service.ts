import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, tap } from 'rxjs';
import { build, ApiEndpoints } from '../api/endpoints';
import { Notification } from '../../model/notification.model';

@Injectable({
    providedIn: 'root'
})
export class NotificationService {

    private unreadNotificationsSubject = new BehaviorSubject<number>(0);

    // Public observable for components to subscribe to (e.g., <badge>{{ count$ | async }}</badge>)
    unreadNotificationsCount$ = this.unreadNotificationsSubject.asObservable();

    constructor(private http: HttpClient) { }

    /**
     * Fetches the count from the backend and broadcasts it to all subscribers
     */
    refreshUnreadCount(userId: number): void {
        const url = build(ApiEndpoints.notification.GET_UNSEEN_COUNT, { userId });
        this.http.get<number>(url)
            .pipe(
                tap(count => this.unreadNotificationsSubject.next(count))
            )
            .subscribe({
                error: (err) => console.error('Failed to fetch notification count', err)
            });
    }

    decrementCount(notificationId?: number): void {
        // 1. Update the numeric badge count
        const currentCount = this.unreadNotificationsSubject.value;
        if (currentCount > 0) {
            this.unreadNotificationsSubject.next(currentCount - 1);
        }

        // 2. Update the notification list so the UI "unread" style disappears
        if (notificationId) {
            const currentNotifications = this.notificationsSubject.value;
            const updatedNotifications = currentNotifications.map(n =>
                n.id === notificationId ? { ...n, isSeen: true } : n
            );
            this.notificationsSubject.next(updatedNotifications);
        }
    }

    private notificationsSubject = new BehaviorSubject<Notification[]>([]);
    notifications$ = this.notificationsSubject.asObservable();

    getNotifications(userId: number): void {
        const url = build(ApiEndpoints.notification.GET_ALL_NOTIFICATIONS, { userId });

        this.http.get<Notification[]>(url).subscribe({
            next: (notifications) => {
                this.notificationsSubject.next(notifications);
                // Optional: Update the unread count based on this list to save an extra API call
                const unreadCount = notifications.filter(n => !n.isSeen).length;
                this.unreadNotificationsSubject.next(unreadCount);
            },
            error: (err) => console.error('Error fetching notifications:', err)
        });
    }

    markAsSeen(notificationId: number, userId: number): void {
        // 1. Manually "flip" the state in the local list immediately (Optimistic)
        const currentNotifications = this.notificationsSubject.value.map(n =>
            n.id === notificationId ? { ...n, isSeen: true } : n
        );
        this.notificationsSubject.next(currentNotifications);

        // 2. Update the numeric badge count immediately
        this.decrementCount();

        // 3. Tell the server to catch up
        const url = build(ApiEndpoints.notification.MARK_AS_SEEN, { id: notificationId });
        this.http.patch<void>(url, {}).subscribe({
            error: (err) => {
                // 4. Rollback if the server fails
                this.getNotifications(userId);
                console.error('Server sync failed, rolling back UI state', err);
            }
        });
    }
}