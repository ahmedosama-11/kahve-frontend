import { Injectable } from '@angular/core';
import {
  CanActivate,
  CanActivateChild,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
} from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AdminGuard implements CanActivate, CanActivateChild {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    return this.checkAdminAccess();
  }

  canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    return this.checkAdminAccess();
  }

  private checkAdminAccess(): boolean {
    const isLoggedIn = this.authService.isLoggedInValue || !!localStorage.getItem('user') || !!localStorage.getItem('userId');

    if (!isLoggedIn) {
      this.router.navigate(['/login']);
      return false;
    }

    const user = this.getStoredUser();
    const isAdmin = this.isAdminUser(user) || this.authService.isAdminValue;

    if (!isAdmin) {
      this.router.navigate(['/home']);
      return false;
    }

    return true;
  }

  private normalizeRole(value: any): string {
    return String(value || '').trim().toLowerCase();
  }

  private isAdminUser(user: any): boolean {
    const role =
      this.normalizeRole(localStorage.getItem('role')) ||
      this.normalizeRole(user?.role) ||
      this.normalizeRole(user?.user?.role) ||
      this.normalizeRole(user?.data?.role) ||
      this.normalizeRole(user?.data?.user?.role) ||
      this.normalizeRole(user?.account?.role) ||
      this.normalizeRole(user?.profile?.role);

    if (role === 'admin') return true;

    const adminFlags = [
      user?.isAdmin,
      user?.admin,
      user?.user?.isAdmin,
      user?.user?.admin,
      user?.data?.isAdmin,
      user?.data?.user?.isAdmin,
      user?.account?.isAdmin,
      user?.profile?.isAdmin,
    ];

    return adminFlags.some((value) => value === true || this.normalizeRole(value) === 'true');
  }

  private getStoredUser(): any {
    const userJson = localStorage.getItem('user');

    if (!userJson) return null;

    try {
      return JSON.parse(userJson);
    } catch {
      return null;
    }
  }
}
