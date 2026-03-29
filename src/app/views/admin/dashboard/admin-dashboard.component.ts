import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../model/user.model';

// Material Imports
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatTableModule,
    MatSelectModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatSnackBarModule
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
})
export class AdminDashboardComponent implements OnInit {
  private userService = inject(UserService);

  // Data Signals
  public searchResults = signal<User[]>([]);
  public isSearching = signal<boolean>(false);
  public searchTotalElements = signal<number>(0);

  // State Signals
  public currentPage = signal<number>(0);
  public pageSize = signal<number>(10);
  public lastSearchTerm = signal<string>('');

  // Role Configuration
  public roles = [
    { value: 'ROLE_STORE_MANAGER', label: 'Store Manager' },
    { value: 'ROLE_PROVIDER', label: 'Provider' },
    { value: 'ROLE_ACCOUNT_MANAGER', label: 'Account Manager' },
  ];

  // Map to track which role is selected for which user ID
  public userRolesMap = new Map<number, string>();

  public constructor(private snackBar: MatSnackBar) {

  }

  ngOnInit(): void {
    // Initial load if desired, otherwise wait for search input
  }

  /**
   * Main search function triggered by button or Enter key
   */
  public onSearchUsers(term: string): void {
    if (!term.trim()) {
      this.searchResults.set([]);
      return;
    }

    this.lastSearchTerm.set(term);
    this.fetchUsers();
  }

  /**
   * Core data fetching logic
   */
  private fetchUsers(): void {
    this.isSearching.set(true);

    this.userService.getAllMatchingUsers(
      this.currentPage(),
      this.pageSize(),
      this.lastSearchTerm()
    ).subscribe({
      next: (response) => {
        this.searchResults.set(response.content);
        this.searchTotalElements.set(response.totalElements);
        this.isSearching.set(false);
      },
      error: (err) => {
        console.error('Search failed:', err);
        this.isSearching.set(false);
      }
    });
  }

  /**
   * Handlers for Table & Paginator Actions
   */
  public handlePageEvent(e: PageEvent): void {
    this.pageSize.set(e.pageSize);
    this.currentPage.set(e.pageIndex);
    this.fetchUsers();
  }

  public onRoleChange(role: string, userId: number): void {
    this.userRolesMap.set(userId, role);
    console.log(`Role for user ${userId} updated to: ${role}`);
  }

  public onLinkUser(user: User): void {
    const selectedRole = this.userRolesMap.get(user.id) || 'ROLE_STORE_MANAGER';

    console.log(`Linking user ${user.email} with role ${selectedRole}`);

    this.userService.addUserRole(user.id, selectedRole).subscribe({
      next: (responseMessage: string) => {
        // Show the actual message returned by the server (e.g., "Role successfully added")
        this.snackBar.open(responseMessage, 'Close', { duration: 3000 });

        // Update local state
        this.searchResults.update(users => users.filter(u => u.id !== user.id));
      },
      error: (err) => {
        // If the backend throws an exception, the message is usually in err.error
        const errorMessage = err.error || 'An unexpected error occurred';
        this.snackBar.open(errorMessage, 'Error', { duration: 5000 });
      }
    });
  }
}