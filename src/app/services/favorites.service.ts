import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { API_BASE_URL } from '../config/api.config';

@Injectable({
  providedIn: 'root',
})
export class FavoritesService {
  private baseUrl = API_BASE_URL;

  constructor(private http: HttpClient, private router: Router) {}

  private refreshAccessToken(): Observable<any> {
    console.log('Attempting to refresh access token');
    return this.http.post(`${this.baseUrl}/refresh-token`, {}, { withCredentials: true }).pipe(
      catchError((error) => {
        console.error('Refresh token failed:', error);
        this.router.navigate(['/login']);
        return throwError(() => new Error('Unable to refresh token, please log in again'));
      })
    );
  }

  private handleRequest<T>(request: Observable<T>, operation: string): Observable<T> {
    return request.pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          console.log(`Received 401 during ${operation}, attempting to refresh token`);
          return this.refreshAccessToken().pipe(
            switchMap(() => {
              console.log(`Retrying ${operation} after token refresh`);
              return request; 
            }),
            catchError(() => {
              console.error(`${operation} failed after refresh attempt`);
              this.router.navigate(['/login']);
              return throwError(() => new Error('Session expired, please log in again'));
            })
          );
        }
        console.error(`${operation} error:`, error);
        return throwError(() => error);
      })
    );
  }

  getUserFav(): Observable<any> {
    console.log('Fetching user favorites');
    const request = this.http.get<any>(`${this.baseUrl}/favorites`, { withCredentials: true });
    return this.handleRequest(request, 'Get user favorites');
  }

  addToFavorites(product: {
    name: string;
    price: number;
    image: string;
    productId: string;
  }): Observable<any> {
    console.log('Adding to favorites:', product);
    const request = this.http.post(`${this.baseUrl}/favorites`, product, { withCredentials: true });
    return this.handleRequest(request, 'Add to favorites');
  }

  deleteFavItem(productId: string): Observable<any> {
    console.log('Deleting favorite item:', { productId });
    const body = { productId };
    const request = this.http.delete<any>(`${this.baseUrl}/favorites/delete`, { body, withCredentials: true });
    return this.handleRequest(request, 'Delete favorite item');
  }
}
