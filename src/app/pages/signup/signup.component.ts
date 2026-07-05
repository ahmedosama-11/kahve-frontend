import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css'],
})
export class SignupComponent {
  signupForm;
  errorMessage = '';
  successMessage = '';
  loading = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.signupForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s()]{8,20}$/)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    });
  }

  onSignup(): void {
    if (this.loading) return;

    if (this.signupForm.value.password !== this.signupForm.value.confirmPassword) {
      this.errorMessage = "Passwords don't match";
      return;
    }

    const { name, email, password, phone } = this.signupForm.value;

    if (!name || !email || !password || !phone) {
      this.errorMessage = 'Please enter all required fields';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.signup(name, email, password, phone).subscribe({
      next: (response: any) => {
        this.loading = false;
        localStorage.setItem('pendingVerifyEmail', email);
        this.successMessage = response?.message || 'Verification code sent to your email.';
        this.router.navigate(['/verify-email'], { queryParams: { email } });
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage =
          error?.error?.message ||
          error?.error?.errors?.[0]?.msg ||
          error?.error?.errors?.[0]?.message ||
          'An error occurred while signing up. Please try again.';
      },
    });
  }
}
