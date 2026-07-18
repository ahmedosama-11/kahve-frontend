import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { API_BASE_URL } from '../config/api.config';

@Injectable({
  providedIn: 'root',
})
export class AddProductService {
  private baseUrl = API_BASE_URL; 

  constructor(private http: HttpClient, private router: Router) {}

  private refreshAccessToken(): Observable<any> {
    return this.http.post(`${this.baseUrl}/refresh-token`, {}, { withCredentials: true }).pipe(
      catchError((error) => {
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
              this.router.navigate(['/login']);
              return throwError(() => new Error('Session expired, please log in again'));
            })
          );
        }
        return throwError(() => error);
      })
    );
  }

  AddProduct(formData: FormData): Observable<any> {
    const request = this.http.post(`${this.baseUrl}/addproduct`, formData, {
      withCredentials: true,
    });
    return this.handleRequest(request, 'Add Product');
  }
}
