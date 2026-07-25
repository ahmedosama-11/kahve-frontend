import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay, tap } from 'rxjs/operators';
import { LanguageService } from './language.service';
import { API_BASE_URL } from '../config/api.config';

@Injectable({ providedIn: 'root' })
export class SiteContentService {
  private baseUrl = API_BASE_URL;
  private pageRequests = new Map<string, Observable<Record<string, any>>>();

  constructor(private http: HttpClient, private languageService: LanguageService) {}

  getAllContent(page?: string): Observable<any[]> {
    const url = page ? `${this.baseUrl}/site-content?page=${encodeURIComponent(page)}` : `${this.baseUrl}/site-content`;
    return this.http.get<any>(url, { withCredentials: true }).pipe(
      map((response) => response?.items || response?.data || []),
      catchError(() => of([]))
    );
  }

  getPageContent(page: string): Observable<Record<string, any>> {
    const normalizedPage = String(page || '').trim().toLowerCase();
    const cachedRequest = this.pageRequests.get(normalizedPage);
    if (cachedRequest) return cachedRequest;

    const request = this.http
      .get<any>(`${this.baseUrl}/site-content/page/${encodeURIComponent(normalizedPage)}`)
      .pipe(
        map((response) => response?.byKey || this.arrayToMap(response?.items || response?.data || [])),
        catchError(() => of({})),
        shareReplay({ bufferSize: 1, refCount: false }),
      );

    this.pageRequests.set(normalizedPage, request);
    return request;
  }

  saveContent(payload: FormData): Observable<any> {
    const page = String(payload.get('page') || '').trim().toLowerCase();
    return this.http.post<any>(`${this.baseUrl}/site-content`, payload, { withCredentials: true }).pipe(
      tap(() => this.invalidatePage(page)),
    );
  }

  updateContent(id: string, payload: FormData): Observable<any> {
    const page = String(payload.get('page') || '').trim().toLowerCase();
    return this.http.patch<any>(`${this.baseUrl}/site-content/${id}`, payload, { withCredentials: true }).pipe(
      tap(() => this.invalidatePage(page)),
    );
  }

  deleteContent(id: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/site-content/${id}`, { withCredentials: true });
  }

  seedDefaults(): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/site-content/seed-defaults`, {}, { withCredentials: true });
  }

  localized(block: any, field: string, fallback = ''): string {
    if (!block) return fallback;
    const suffix = this.languageService.currentLanguage === 'ar' ? '_ar' : '_en';
    return String(block[`${field}${suffix}`] || block[`${field}_en`] || block[`${field}_ar`] || block[field] || fallback || '').trim();
  }

  image(block: any, fallback = ''): string {
    return String(block?.image || fallback || '').trim();
  }

  invalidatePage(page: string): void {
    const normalizedPage = String(page || '').trim().toLowerCase();
    if (normalizedPage) this.pageRequests.delete(normalizedPage);
  }

  arrayToMap(items: any[]): Record<string, any> {
    return (items || []).reduce((map: Record<string, any>, item: any) => {
      if (item?.key) map[item.key] = item;
      return map;
    }, {});
  }
}
