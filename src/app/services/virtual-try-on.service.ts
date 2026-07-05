import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class VirtualTryOnService {
  private baseUrl = 'http://localhost:3000';

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
              return request; // Retry the original request
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

  postRunDetection(): Observable<any> {
    console.log('Running virtual try-on detection');
    const request = this.http.post<any>(`${this.baseUrl}/bestStyle`, {}, { withCredentials: true });
    return this.handleRequest(request, 'Run virtual try-on detection');
  }
}
