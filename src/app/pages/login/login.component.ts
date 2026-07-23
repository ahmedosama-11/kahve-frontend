import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  errorMessage = '';
  loginForm;
  loading = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  onLogin(): void {
    if (this.loginForm.invalid || this.loading) return;

    const email = this.loginForm.value.email || '';
    const password = this.loginForm.value.password || '';
    this.loading = true;
    this.errorMessage = '';

    this.authService.login(email, password).subscribe({
      next: () => {
        this.loading = false;
        const returnUrl = String(this.route.snapshot.queryParamMap.get('returnUrl') || '');
        if (returnUrl.startsWith('/') && !returnUrl.startsWith('//')) {
          this.router.navigateByUrl(returnUrl);
        } else {
          this.router.navigate(['/home']);
        }
      },
      error: (error: any) => {
        this.loading = false;
        const message = error?.error?.message || 'Email or password incorrect';
        this.errorMessage = message;
        if (String(message).toLowerCase().includes('verify')) {
          localStorage.setItem('pendingVerifyEmail', email);
        }
      },
    });
  }

  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }
}
