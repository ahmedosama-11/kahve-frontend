import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, of, timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';

interface BuildVersion {
  version?: string;
  builtAt?: string;
}

@Injectable({ providedIn: 'root' })
export class AppVersionService {
  private readonly storageKey = 'kahve_app_version';
  private initialized = false;

  constructor(private http: HttpClient) {}

  initialize(): void {
    if (this.initialized) return;
    this.initialized = true;

    this.removeCacheBustParam();
    this.checkForUpdate();

    // Re-check periodically and whenever the customer returns to the tab.
    timer(5 * 60 * 1000, 5 * 60 * 1000)
      .pipe(switchMap(() => this.fetchVersion()))
      .subscribe((version) => this.applyVersion(version));

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') this.checkForUpdate();
    });
  }

  checkForUpdate(): void {
    this.fetchVersion().subscribe((version) => this.applyVersion(version));
  }

  private fetchVersion() {
    return this.http
      .get<BuildVersion>(`/version.json?t=${Date.now()}`)
      .pipe(catchError(() => of(null)));
  }

  private applyVersion(payload: BuildVersion | null): void {
    const current = String(payload?.version || '').trim();
    if (!current || current === 'development') return;

    const previous = localStorage.getItem(this.storageKey);
    if (!previous) {
      localStorage.setItem(this.storageKey, current);
      return;
    }

    if (previous !== current) {
      localStorage.setItem(this.storageKey, current);
      const url = new URL(window.location.href);
      url.searchParams.set('_kahve_v', current);
      window.location.replace(url.toString());
    }
  }

  private removeCacheBustParam(): void {
    const url = new URL(window.location.href);
    if (!url.searchParams.has('_kahve_v')) return;
    url.searchParams.delete('_kahve_v');
    window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`);
  }
}
