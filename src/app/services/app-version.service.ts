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
  private lastCheckedAt = 0;
  private readonly minimumCheckGapMs = 5 * 60 * 1000;

  constructor(private http: HttpClient) {}

  initialize(): void {
    if (this.initialized) return;
    this.initialized = true;

    this.removeCacheBustParam();

    // Version checks must never compete with the first screen, hero image or products.
    // A fixed delay keeps Lighthouse/Safari startup requests out of the critical chain.
    window.setTimeout(() => this.checkForUpdate(), 30_000);

    timer(10 * 60 * 1000, 10 * 60 * 1000)
      .pipe(switchMap(() => this.fetchVersion()))
      .subscribe((version) => this.applyVersion(version));

    document.addEventListener('visibilitychange', () => {
      if (
        document.visibilityState === 'visible' &&
        Date.now() - this.lastCheckedAt >= this.minimumCheckGapMs
      ) {
        this.checkForUpdate();
      }
    });
  }

  checkForUpdate(): void {
    this.lastCheckedAt = Date.now();
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

    try {
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
    } catch {
      // Storage can be restricted on Safari private browsing; version checking is optional.
    }
  }

  private removeCacheBustParam(): void {
    const url = new URL(window.location.href);
    if (!url.searchParams.has('_kahve_v')) return;
    url.searchParams.delete('_kahve_v');
    window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`);
  }
}
