import { HttpBackend, HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { finalize, map, shareReplay, tap } from 'rxjs/operators';
import { API_BASE_URL } from '../config/api.config';

@Injectable({ providedIn: 'root' })
export class SessionRecoveryService {
  private readonly rawHttp: HttpClient;
  private refreshRequest$: Observable<string | null> | null = null;

  constructor(handler: HttpBackend, private router: Router) {
    // HttpBackend bypasses interceptors, which prevents a refresh-loop.
    this.rawHttp = new HttpClient(handler);
  }

  refreshAccessToken(): Observable<string | null> {
    if (this.refreshRequest$) return this.refreshRequest$;

    this.refreshRequest$ = this.rawHttp
      .post<any>(`${API_BASE_URL}/refresh-token`, {}, { withCredentials: true })
      .pipe(
        map((response) => {
          const token = String(response?.accessToken || '').trim();
          return token || null;
        }),
        tap((token) => {
          if (token) localStorage.setItem('accessToken', token);
        }),
        finalize(() => {
          this.refreshRequest$ = null;
        }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );

    return this.refreshRequest$;
  }

  expireSession(returnUrl?: string): void {
    this.clearAuthStorage();
    window.dispatchEvent(new CustomEvent('kahve-auth-expired'));

    const currentUrl = returnUrl || this.router.url || '/home';
    const publicPaths = ['/', '/login', '/signup', '/welcome', '/home', '/aboutUs', '/contactUs', '/forgot-password', '/verify-email'];
    const path = currentUrl.split('?')[0].split('#')[0];

    if (!publicPaths.includes(path)) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: currentUrl } });
    }
  }

  clearAuthStorage(): void {
    [
      'user',
      'userId',
      'email',
      'accessToken',
      'role',
      'cart',
      'favorites',
      'kahveCartCount',
    ].forEach((key) => localStorage.removeItem(key));
  }
}
