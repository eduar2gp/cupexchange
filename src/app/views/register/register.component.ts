import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService, UserRegister } from '../../../app/core/services/user.service';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    MatCardModule,
    MatOptionModule,
    MatSelectModule
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  verifyForm: FormGroup;

  loading = false;
  verifying = false;
  showVerificationInput = true;
  registrationMethod: 'email' | 'phone' = 'email';

  verificationSuccess: boolean | null = null;
  error: string | null = null;
  success: string | null = null;
  verificationError: string | null = null;
  verificationSuccessMessage: string | null = null;

  private readonly phoneDigitsRegex = /^\d{7,10}$/;

  hidePassword = true;

  constructor(
    private fb: FormBuilder,
    private registerService: UserService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.registerForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      // Email is default: start with validators
      email: ['', [Validators.required, Validators.email]],
      // Phone is NOT default: start with NO required validators
      countryCode: ['1', [Validators.pattern(/^\d{1,4}$/)]],
      phone: ['', [Validators.pattern(this.phoneDigitsRegex)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });

    this.verifyForm = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const code = params['code'];
      if (code) {
        this.showVerificationInput = true;
        this.verifyForm.patchValue({ code });
        this.verifyCode(code);
      }
      this.cdr.markForCheck();
    });
  }

  get f() { return this.registerForm.controls; }
  get vf() { return this.verifyForm.controls; }

  setRegistrationMethod(method: 'email' | 'phone') {
    this.registrationMethod = method;
    const emailControl = this.registerForm.get('email');
    const phoneControl = this.registerForm.get('phone');
    const countryControl = this.registerForm.get('countryCode');

    if (method === 'email') {
      // Enable Email, Disable Phone requirements
      emailControl?.setValidators([Validators.required, Validators.email]);
      phoneControl?.setValidators([Validators.pattern(this.phoneDigitsRegex)]);
      countryControl?.setValidators([Validators.pattern(/^\d{1,4}$/)]);
    } else {
      // Enable Phone requirements, Disable Email
      emailControl?.clearValidators();
      phoneControl?.setValidators([Validators.required, Validators.pattern(this.phoneDigitsRegex)]);
      countryControl?.setValidators([Validators.required, Validators.pattern(/^\d{1,4}$/)]);
    }

    // CRITICAL: Refresh the validation state for all controls
    emailControl?.updateValueAndValidity();
    phoneControl?.updateValueAndValidity();
    countryControl?.updateValueAndValidity();

    this.cdr.markForCheck();
  }

  onVerifySubmit() {
    if (this.verifyForm.valid) {
      this.verifyCode();
    }
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      console.warn("Form is invalid. Check these fields:", this.registerForm.value);
      return;
    }
    if (this.registerForm.invalid) return;

    this.loading = true;
    this.error = null;
    this.success = null;
    this.cdr.markForCheck(); // 1. Show spinner immediately

    const formValue = this.registerForm.value;
    const fullPhoneNumber = `+${formValue.countryCode}${formValue.phone}`;
    const payload: UserRegister = {
      username: formValue.username,
      password: formValue.password,
      ...(this.registrationMethod === 'email' ? { email: formValue.email } : { phone: fullPhoneNumber })
    };
    this.registerService.register(payload).subscribe({
      next: (response: any) => {
        // Registration success
        this.success = response?.message || response?.msg || 'REGISTER.SUCCESS_MESSAGE';
        this.error = null;
        this.loading = false;
        this.showVerificationInput = true;
        this.registerForm.reset();
        this.cdr.markForCheck(); // 👈 Mark for check after state updates
      },
      error: (err) => {
        // Registration failure (Fixes UI hang)
        this.error = err?.error || 'REGISTER.ERROR_GENERIC';
        this.success = null;
        this.loading = false; // <<< RE-ENABLES THE BUTTON
        this.cdr.markForCheck(); // 👈 Mark for check after state updates (loading/error)
      }
    });
  }

  verifyCode(code?: string) {
    const vCode = code || this.verifyForm.get('code')?.value?.trim();
    if (!vCode) return;

    this.verifying = true;
    this.verificationError = null;
    this.cdr.markForCheck(); // 4. Show verifying spinner

    this.registerService.verify(vCode).subscribe({
      next: (response: string) => {
        this.verifying = false;
        this.verificationSuccess = true;
        this.verificationSuccessMessage = 'VERIFY.SUCCESS_MESSAGE';
        this.cdr.markForCheck(); // 5. Show success state

        setTimeout(() => this.router.navigate(['/login']), 3000);
      },
      error: (err) => {
        this.verificationError = this.extractErrorMessage(err);
        this.verifying = false;
        this.verificationSuccess = false;
        this.cdr.markForCheck(); // 6. CRITICAL: Update UI to show verification error
      }
    });
  }

  private extractErrorMessage(err: any): string {
    if (!err?.error) return 'API_ERROR_GENERIC';
    if (typeof err.error === 'string') return err.error;
    return err.error.message || err.error.msg || err.error.error || 'API_ERROR_GENERIC';
  }
}