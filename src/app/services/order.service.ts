import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { API_BASE_URL } from '../config/api.config';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private baseUrl = API_BASE_URL;

  constructor(private http: HttpClient) {}

  private handleError(operation: string) {
    return (error: any) => {
      console.error(`${operation} error:`, error);
      return throwError(() => error);
    };
  }

  getUserOrders(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/orders`).pipe(catchError(this.handleError('Get user orders')));
  }

  confirmCardCheckout(sessionId: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/checkout/card/confirm`, { sessionId }).pipe(
      catchError(this.handleError('Confirm card checkout')),
    );
  }

  cancelOrder(orderId: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/orders/cancel`, { body: { orderId } }).pipe(
      catchError(this.handleError('Cancel order')),
    );
  }

  checkout(orderData: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/checkout`, orderData).pipe(catchError(this.handleError('Checkout')));
  }

  checkoutBatch(payload: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/checkout/batch`, payload).pipe(
      catchError(this.handleError('Batch checkout')),
    );
  }

  getSuccess(orderData: any): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/success`, { params: orderData }).pipe(
      catchError(this.handleError('Get success details')),
    );
  }
}
