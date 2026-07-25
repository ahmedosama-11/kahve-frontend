import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { LanguageService } from './language.service';
import { API_BASE_URL } from '../config/api.config';

@Injectable({ providedIn: 'root' })
export class SiteContentService {
  private baseUrl = API_BASE_URL;

  constructor(private http: HttpClient, private languageService: LanguageService) {}

  getAllContent(page?: string): Observable<any[]> {
    const url = page ? `${this.baseUrl}/site-content?page=${encodeURIComponent(page)}` : `${this.baseUrl}/site-content`;
    return this.http.get<any>(url, { withCredentials: true }).pipe(
      map((response) => response?.items || response?.data || []),
      catchError(() => of([]))
    );
  }

  getPageContent(page: string): Observable<Record<string, any>> {
    return this.http.get<any>(`${this.baseUrl}/site-content/page/${page}`, { withCredentials: true }).pipe(
      map((response) => response?.byKey || this.arrayToMap(response?.items || response?.data || [])),
      catchError(() => of({}))
    );
  }

  saveContent(payload: FormData): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/site-content`, payload, { withCredentials: true });
  }

  updateContent(id: string, payload: FormData): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/site-content/${id}`, payload, { withCredentials: true });
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

  arrayToMap(items: any[]): Record<string, any> {
    return (items || []).reduce((map: Record<string, any>, item: any) => {
      if (item?.key) map[item.key] = item;
      return map;
    }, {});
  }
}
