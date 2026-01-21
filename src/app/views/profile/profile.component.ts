import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { User } from '../../model/user.model';
import { UserProfileData } from '../../model/user-profile-data.model';
import { UserService } from '../../core/services/user.service';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { Province } from '../../model/province.model'
import { Municipality } from '../../model/muncipality.model'
import { DataService } from '../../core/services/data.service'

@Component({
  selector: 'app-profile-component',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatIconModule
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit {
  public loggedInUser: User | undefined;
  public profileForm!: FormGroup;
  public isEditing: boolean = false;

  // Selection Data
  public provinces: Province[] = [];
  public allMunicipalities: Municipality[] = [];
  public filteredMunicipalities: Municipality[] = [];

  constructor(
    private userService: UserService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private dataService: DataService
  ) {
    this.setupForm();
  }

  ngOnInit() {
    this.loadLocationData();
    this.loadUserProfile();

    // Listen for Province changes to filter Municipalities
    this.profileForm.get('provinceId')?.valueChanges.subscribe(provinceId => {
      this.filterMunicipalities(provinceId);
    });
  }

  private loadLocationData(): void {
    const provJson = localStorage.getItem('PROVINCES');
    const muniJson = localStorage.getItem('MUNICIPALITIES');

    this.provinces = provJson ? JSON.parse(provJson) : [];
    this.allMunicipalities = muniJson ? JSON.parse(muniJson) : [];
  }

  private filterMunicipalities(provinceId: number): void {
    this.filteredMunicipalities = this.allMunicipalities.filter(m => m.provinceId === provinceId);

    // Reset municipality if current selection doesn't belong to the new province
    const currentMuniId = this.profileForm.get('municipalityId')?.value;
    if (currentMuniId && !this.filteredMunicipalities.find(m => m.id === currentMuniId)) {
      this.profileForm.get('municipalityId')?.setValue(null);
    }
  }

  private setupForm(): void {
    this.profileForm = this.fb.group({
      firstName: new FormControl({ value: '', disabled: true }, [Validators.required]),
      middleName: new FormControl({ value: '', disabled: true }),
      lastName: new FormControl({ value: '', disabled: true }, [Validators.required]),
      phone: new FormControl({ value: '', disabled: true }, [Validators.required]),
      address: new FormControl({ value: '', disabled: true }, [Validators.required]),
      municipalityId: new FormControl({ value: null, disabled: true }, [Validators.required]),
      provinceId: new FormControl({ value: null, disabled: true }, [Validators.required]),
    });
  }

  private loadUserProfile(): void {
    const savedProfileJson = localStorage.getItem('USER_PROFILE_DATA');
    if (savedProfileJson) {
      this.loggedInUser = JSON.parse(savedProfileJson) as User;

      // Patch values and trigger municipality filtering
      this.profileForm.patchValue(this.loggedInUser);
      if (this.loggedInUser.provinceId) {
        this.filterMunicipalities(this.loggedInUser.provinceId);
      }
    }
  }

  public toggleEdit(): void {
    this.isEditing = !this.isEditing;
    this.isEditing ? this.profileForm.enable() : this.profileForm.disable();
  }

  public saveProfile(): void {
    if (this.profileForm.invalid || !this.isEditing) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const updatedData: UserProfileData = this.profileForm.getRawValue();

    this.userService.updateUserProfile(updatedData).subscribe({
      next: (partialUpdate: UserProfileData) => {
        // 1. Get the current full user object from localStorage
        const savedProfileJson = localStorage.getItem('USER_PROFILE_DATA');
        if (savedProfileJson) {
          const currentUser = JSON.parse(savedProfileJson) as User;
          // 2. Merge the partial update into the full user object
          // This keeps email, username, etc., while updating the profile fields
          const updatedUser: User = {
            ...currentUser,
            ...partialUpdate
          };
          // 3. Save the merged object back to localStorage
          localStorage.setItem('USER_PROFILE_DATA', JSON.stringify(updatedUser));
          // 4. Update the component's state to reflect changes in UI
          this.loggedInUser = updatedUser;
          this.dataService.updateUser(this.loggedInUser)
          this.showToast('Profile updated successfully!');
          this.toggleEdit();
        }
      },
      error: (err) => {
        this.showToast(err.error || 'Update failed');
      }
    });
  }

  get controls() { return this.profileForm.controls; }

  showToast(message: string): void {
    this.snackBar.open(message, 'Close', { duration: 3000 });
  }
}
