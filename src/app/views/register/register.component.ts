import {
  Component,
  OnInit,
  ChangeDetectionStrategy, // 👈 Import ChangeDetectionStrategy
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RegisterService, UserRegister } from '../../../app/core/services/register.service';
import { HttpErrorResponse } from '@angular/common/http';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { DialogMessageComponent } from '../../../app/views/shared/dialog-message/dialog-message.component'

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush, // 👈 SET TO OnPush
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  verifyForm: FormGroup;

  submitted = false;
  loading = false;
  verifying = false;

  showVerificationInput = true;
  verificationSuccess: boolean | null = null;

  error: string | null = null;
  success: string | null = null;
  verificationError: string | null = null;
  verificationSuccessMessage: string | null = null;


  constructor(
    private fb: FormBuilder,
    private registerService: RegisterService,
    private route: ActivatedRoute,
    private router: Router,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {
    this.registerForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
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

      // Since all code changes above are asynchronous, we mark for check here
      this.cdr.markForCheck(); // 👈 Mark for check after async subscription runs
    });
  }

  get f() { return this.registerForm.controls; }
  get vf() { return this.verifyForm.controls; }

  onSubmit() {
    this.submitted = true;
    this.error = null;
    this.success = null;

    if (this.registerForm.invalid) {
      this.cdr.markForCheck(); // 👈 Check to update validation errors
      return;
    }

    this.loading = true;
    this.cdr.markForCheck(); // 👈 Check to update the loading button state

    const user: UserRegister = this.registerForm.value;

    this.registerService.register(user).subscribe({
      next: (response: any) => {
        // Registration success
        this.success = response?.message || response?.msg || 'REGISTER.SUCCESS_MESSAGE';
        this.error = null;
        this.loading = false;
        this.showVerificationInput = true;
        this.registerForm.reset();
        this.submitted = false;

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
    const verificationCode = code || this.verifyForm.get('code')?.value?.trim();

    if (!verificationCode) {
      this.verificationError = 'VERIFY.CODE_REQUIRED';
      this.verificationSuccess = false;
      this.cdr.markForCheck(); // 👈 Mark for check to show error immediately
      return;
    }

    this.verifying = true;
    this.verificationError = null;
    this.verificationSuccessMessage = null;
    this.verificationSuccess = null;
    this.cdr.markForCheck(); // 👈 Mark for check to show spinner

    this.registerService.verify(verificationCode).subscribe({
      next: (response: string) => {
        this.verifying = false;

        // The server message is directly in the 'response' variable (e.g., "Email verification successful")
        const serverMessage = response || 'VERIFY.SUCCESS_MESSAGE';

        this.verificationSuccessMessage = serverMessage;
        this.verificationSuccess = true;
        this.showVerificationInput = true;

        this.cdr.markForCheck(); // 👈 Mark for check after successful state updates

        // Open success dialog and redirect logic (no change needed here)
        /*this.dialog.open(DialogMessageComponent, {
          width: '400px',
          data: {
            title: 'Success',
            message: serverMessage
          }
        });*/

        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000);
      },
      error: (err: HttpErrorResponse) => {
        let serverMessage = 'VERIFY.ERROR_INVALID_CODE';

        // Error message extraction logic
        if (err.error) {
          if (typeof err.error === 'string') {
            serverMessage = err.error;
          } else if (err.error.message) {
            serverMessage = err.error.message;
          } else if (err.error.msg) {
            serverMessage = err.error.msg;
          } else if (err.error.error) {
            serverMessage = err.error.error;
          }
        }

        /*this.dialog.open(DialogMessageComponent, {
          width: '400px',
          data: {
            title: 'Error',
            message: serverMessage
          }
        });*/

        this.verificationError = serverMessage;
        this.verifying = false;
        this.showVerificationInput = true;
        this.verificationSuccess = false;

        this.cdr.markForCheck(); // 👈 Mark for check after error state updates
      }
    });
  }

  onVerifySubmit() {
    if (this.verifyForm.invalid) return;
    this.verifyCode();
  }

}
