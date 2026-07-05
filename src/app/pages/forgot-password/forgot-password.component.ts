import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css'],
})
export class ForgotPasswordComponent {
  step: 1 | 2 | 3 = 1;
  loading = false;
  errorMessage = '';
  successMessage = '';

  emailForm;
  codeForm;
  passwordForm;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.emailForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });

    this.codeForm = this.fb.group({
      resetCode: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
    });

    this.passwordForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  sendCode(): void {
    if (this.emailForm.invalid || this.loading) return;

    const email = this.emailForm.value.email || '';
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.forgotPassword(email).subscribe({
      next: (response: any) => {
        this.loading = false;
        this.step = 2;
        this.successMessage = response?.message || 'Reset code sent to your email.';
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = this.getError(error);
      },
    });
  }

  verifyCode(): void {
    if (this.codeForm.invalid || this.loading) return;

    const resetCode = this.codeForm.value.resetCode || '';
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.verifyResetCode(resetCode).subscribe({
      next: (response: any) => {
        this.loading = false;
        this.step = 3;
        this.successMessage = response?.message || 'Code verified. Enter your new password.';
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = this.getError(error);
      },
    });
  }

  resetPassword(): void {
    if (this.passwordForm.invalid || this.loading) return;

    const newPassword = this.passwordForm.value.newPassword || '';
    const confirmPassword = this.passwordForm.value.confirmPassword || '';
    if (newPassword !== confirmPassword) {
      this.errorMessage = "Passwords don't match";
      return;
    }

    const email = this.emailForm.value.email || '';
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.resetPassword(email, newPassword).subscribe({
      next: (response: any) => {
        this.loading = false;
        this.successMessage = response?.message || 'Password updated successfully.';
        this.router.navigate(['/home']);
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = this.getError(error);
      },
    });
  }

  private getError(error: any): string {
    return error?.error?.message || error?.error?.errors?.[0]?.msg || 'Something went wrong. Please try again.';
  }
}
