import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-verify-email',
  templateUrl: './verify-email.component.html',
  styleUrls: ['./verify-email.component.css'],
})
export class VerifyEmailComponent implements OnInit {
  verifyForm;

  loading = false;
  resendLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.verifyForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
    });
  }

  ngOnInit(): void {
    const email = this.route.snapshot.queryParamMap.get('email') || localStorage.getItem('pendingVerifyEmail') || '';
    if (email) this.verifyForm.patchValue({ email });
  }

  onVerify(): void {
    if (this.verifyForm.invalid || this.loading) return;

    const email = this.verifyForm.value.email || '';
    const code = this.verifyForm.value.code || '';
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.verifyEmail(email, code).subscribe({
      next: (response: any) => {
        this.loading = false;
        localStorage.removeItem('pendingVerifyEmail');
        this.successMessage = response?.message || 'Email verified successfully.';
        this.router.navigate(['/home']);
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = this.getError(error);
      },
    });
  }

  resendCode(): void {
    const email = this.verifyForm.value.email || '';
    if (!email || this.resendLoading) {
      this.errorMessage = 'Please enter your email first.';
      return;
    }

    this.resendLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.resendVerificationCode(email).subscribe({
      next: (response: any) => {
        this.resendLoading = false;
        this.successMessage = response?.message || 'Verification code sent again.';
      },
      error: (error) => {
        this.resendLoading = false;
        this.errorMessage = this.getError(error);
      },
    });
  }

  private getError(error: any): string {
    return error?.error?.message || error?.error?.errors?.[0]?.msg || 'Something went wrong. Please try again.';
  }
}
