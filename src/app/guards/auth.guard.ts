import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const isLoggedIn = this.authService.isLoggedInValue;
    const url = state.url.split('?')[0];

    const guestOnlyPages = ['/', '/login', '/signup', '/welcome'];
    if (isLoggedIn && guestOnlyPages.includes(url)) {
      this.router.navigate(['/home']);
      return false;
    }

    const publicPages = [
      '/',
      '/login',
      '/signup',
      '/aboutUs',
      '/welcome',
      '/home',
      '/forgot-password',
      '/verify-email',
      '/contactUs',
    ];

    if (!isLoggedIn && !publicPages.includes(url)) {
      this.router.navigate(['/login']);
      return false;
    }

    return true;
  }
}
