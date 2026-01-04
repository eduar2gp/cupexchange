import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { User } from '../../model/user.model';
import { UserProfileData } from '../../model/user-profile-data.model';
import { UserService } from '../../core/services/user.service';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-profile-component',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule,
    MatSnackBarModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit {

  // Public properties for template access
  public loggedInUser: User | undefined;
  public profileForm!: FormGroup;
  public isEditing: boolean = false;

  // Private property to hold data retrieved from User, used to initialize the form
  private initialProfileData: UserProfileData | undefined;

  constructor(
    private userService: UserService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    // Initialize the form here or in ngOnInit
    this.setupForm();
  }

  ngOnInit() {
    this.loadUserProfile();

    // Subscribe to form status changes to enable/disable the save button
    this.profileForm.statusChanges.subscribe(status => {
      // This check is implicitly handled by profileForm.valid in the template, 
      // but explicit subscription can be useful for more complex logic.
      // For now, we rely on the template check.
    });
  }

  private setupForm(): void {
    // Initialize the form controls. They start disabled until Edit is clicked.
    this.profileForm = this.fb.group({
      firstName: new FormControl({ value: '', disabled: true }, [Validators.required]),
      middleName: new FormControl({ value: '', disabled: true }),
      lastName: new FormControl({ value: '', disabled: true }, [Validators.required]),
      phone: new FormControl({ value: '', disabled: true }, [Validators.required]),
      address: new FormControl({ value: '', disabled: true }, [Validators.required]),
      municipality: new FormControl({ value: '', disabled: true }, [Validators.required]),
      province: new FormControl({ value: '', disabled: true }, [Validators.required]),
    });
  }

  private loadUserProfile(): void {
    // 1. Load User JSON from localStorage
    const savedProfileJson = localStorage.getItem('USER_PROFILE_DATA');
    if (savedProfileJson) {
      this.loggedInUser = JSON.parse(savedProfileJson) as User;
    } else {
      console.error('User data not found in localStorage.');
      return;
    }

    // 2. Map User data to UserProfileData
    this.initialProfileData = {
      firstName: this.loggedInUser.firstName,
      middleName: this.loggedInUser.middleName,
      lastName: this.loggedInUser.lastName,
      phone: this.loggedInUser.phone,
      address: this.loggedInUser.address,
      municipality: this.loggedInUser.municipality,
      province: this.loggedInUser.province,
    };

    // 3. Populate the form with data
    this.profileForm.patchValue(this.initialProfileData);
  }

  /**
   * Toggles the edit mode and enables/disables form controls.
   */
  public toggleEdit(): void {
    this.isEditing = !this.isEditing;

    if (this.isEditing) {
      // Enable all controls for editing
      this.profileForm.enable();
      // Keep username/email disabled (Non-editable fields)
      this.profileForm.get('email')?.disable();
      this.profileForm.get('userName')?.disable();
      // Note: Since userName is not in the DTO/form definition, it won't be explicitly handled here
    } else {
      // Disable all controls when viewing
      this.profileForm.disable();
    }
  }

  /**
   * Called on click of the save button.
   */
  public saveProfile(): void {
    // Ensure form is valid and component is in editing mode
    if (this.profileForm.valid && this.isEditing) {
      // Get the data from the form, which matches the UserProfileData structure
      const updatedData: UserProfileData = this.profileForm.value;

      this.userService.updateUserProfile(updatedData).subscribe({
        next: (user: User) => {
          // Update the loggedInUser with the new data
          this.loggedInUser = user;
          localStorage.setItem('USER_PROFILE_DATA', JSON.stringify(user));
          this.showToast('Profile updated successfully!');
          // Exit editing mode
          this.toggleEdit();
        },
        error: (err) => {
          console.error('Profile update failed:', err);
          this.showToast(err.error)
        }
      });
    }
  }

  // Helper method for easier template access to form controls
  get controls() {
    return this.profileForm.controls;
  }

  showToast(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000, // Duration in milliseconds (3 seconds)
      panelClass: ['snackbar-success'], // Custom CSS class for styling (see below)
      horizontalPosition: 'center', // 'start' | 'center' | 'end' | 'left' | 'right'
      verticalPosition: 'bottom', // 'top' | 'bottom'
    });
  }
}
