import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private baseUrl = `${API_BASE_URL}/categories`;

  constructor(private http: HttpClient) {}

  getCategories(includeHidden: boolean = false): Observable<any> {
    return this.http.get(`${this.baseUrl}?includeHidden=${includeHidden}`, { withCredentials: true });
  }

  getCategoryBySlug(slug: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/slug/${encodeURIComponent(slug)}`, { withCredentials: true });
  }

  syncFromProducts(): Observable<any> {
    return this.http.post(`${this.baseUrl}/sync-from-products`, {}, { withCredentials: true });
  }

  createCategory(payload: any): Observable<any> {
    return this.http.post(this.baseUrl, payload, { withCredentials: true });
  }

  updateCategory(id: string, payload: any): Observable<any> {
    return this.http.patch(`${this.baseUrl}/${id}`, payload, { withCredentials: true });
  }

  deleteCategory(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`, { withCredentials: true });
  }
}
