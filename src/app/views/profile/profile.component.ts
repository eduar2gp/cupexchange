import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { IdVerificationComponent } from '../../components/id-verification/id-verification.component';
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
    MatIconModule,
    IdVerificationComponent,
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit {
  public loggedInUser: User | undefined;
  public profileForm!: FormGroup;
  public isEditing: boolean = false;
  public isVerified: boolean = false;

  public countries = [
    { name: 'Cuba', code: 'CU' },
    { name: 'USA', code: 'USA' }
  ];

  public allProvinces: Province[] = [];
  public filteredProvinces: Province[] = [];
  public allMunicipalities: Municipality[] = [];
  public filteredMunicipalities: Municipality[] = [];

  constructor(
    private userService: UserService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private dataService: DataService,
    private activatedRoute: ActivatedRoute
  ) {
    this.setupForm();
  }
  ngOnInit() {
    this.loadLocationData();
    this.loadUserProfile();

    // Check for verification status from query params immediately (passed from ID verification component)
    const queryParamStatus = this.activatedRoute.snapshot.queryParams['verificationStatus'];
    if (queryParamStatus) {
      const status = (queryParamStatus || '').toLowerCase();
      this.isVerified = status === 'verified' || status === 'approved' || status === 'completed';
    }

    // Also listen for verification status from dataService (fallback if no query param)
    this.dataService.verificationStatus$.subscribe(verificationStatus => {
      // Only update if we haven't already set it from query params
      if (!queryParamStatus && verificationStatus) {
        const status = (verificationStatus?.status || '').toLowerCase();
        this.isVerified = status === 'verified' || status === 'approved' || status === 'completed';
      }
    });

    // 1. Listen for Country changes to filter Provinces
    this.profileForm.get('countryCode')?.valueChanges.subscribe(code => {
      this.filterProvinces(code);
    });

    // 2. Listen for Province changes to filter Municipalities
    this.profileForm.get('provinceId')?.valueChanges.subscribe(provinceId => {
      this.filterMunicipalities(provinceId);
    });
  }

  private loadLocationData(): void {
    const provJson = localStorage.getItem('PROVINCES');
    const muniJson = localStorage.getItem('MUNICIPALITIES');

    this.allProvinces = provJson ? JSON.parse(provJson) : [];
    this.allMunicipalities = muniJson ? JSON.parse(muniJson) : [];
  }

  private filterProvinces(countryCode: string): void {
    // Update the list of provinces available in the dropdown
    this.filteredProvinces = this.allProvinces.filter(p => p.countryCode === countryCode);

    // Only reset children if the form is currently being edited by the user
    // This prevents the data from being cleared during the initial loadUserProfile()
    if (this.isEditing) {
      const currentProvId = this.profileForm.get('provinceId')?.value;
      if (currentProvId && !this.filteredProvinces.find(p => p.id === currentProvId)) {
        this.profileForm.get('provinceId')?.setValue(null);
        this.profileForm.get('municipalityId')?.setValue(null);
      }
    }
  }

  private filterMunicipalities(provinceId: number): void {
    this.filteredMunicipalities = this.allMunicipalities.filter(m => m.provinceId === provinceId);

    const currentMuniId = this.profileForm.get('municipalityId')?.value;
    if (currentMuniId && !this.filteredMunicipalities.find(m => m.id === currentMuniId)) {
      this.profileForm.get('municipalityId')?.setValue(null);
    }
  }

  private setupForm(): void {
    this.profileForm = this.fb.group({
      firstName: [{ value: '', disabled: true }, [Validators.required]],
      middleName: [{ value: '', disabled: true }],
      lastName: [{ value: '', disabled: true }, [Validators.required]],
      phone: [{ value: '', disabled: true }, [Validators.required]],
      address: [{ value: '', disabled: true }, [Validators.required]],
      countryCode: [{ value: null, disabled: true }, [Validators.required]], // New Field
      provinceId: [{ value: null, disabled: true }, [Validators.required]],
      municipalityId: [{ value: null, disabled: true }, [Validators.required]],
    });
  }

  private loadUserProfile(): void {
    const savedProfileJson = localStorage.getItem('USER_PROFILE_DATA');

    if (savedProfileJson) {
      this.loggedInUser = JSON.parse(savedProfileJson) as User;

      // 1. If user has a provinceId, find the corresponding Province object
      if (this.loggedInUser.provinceId) {
        const userProvince = this.allProvinces.find(p => p.id === this.loggedInUser?.provinceId);

        if (userProvince) {
          // 2. Filter the provinces list based on the found countryCode
          this.filterProvinces(userProvince.countryCode);

          // 3. Manually set the countryCode in the form so the UI shows the correct Country
          this.profileForm.get('countryCode')?.setValue(userProvince.countryCode, { emitEvent: false });
        }

        // 4. Filter municipalities based on the provinceId
        this.filterMunicipalities(this.loggedInUser.provinceId);
      }

      // 5. Patch the rest of the user data into the form
      this.profileForm.patchValue(this.loggedInUser);
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