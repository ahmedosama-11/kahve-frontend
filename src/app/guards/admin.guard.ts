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
    const isLoggedIn = this.authService.isLoggedInValue;

    if (!isLoggedIn) {
      this.router.navigate(['/login']);
      return false;
    }

    const user = this.getStoredUser();
    const isAdmin = user?.role === 'admin' || this.authService.isAdminValue;

    if (!isAdmin) {
      this.router.navigate(['/home']);
      return false;
    }

    return true;
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
