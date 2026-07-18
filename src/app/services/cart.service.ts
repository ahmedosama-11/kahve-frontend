import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { API_BASE_URL } from '../config/api.config';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private baseUrl = API_BASE_URL;

  private cartCountSubject = new BehaviorSubject<number>(this.readStoredCartCount());
  cartCount$ = this.cartCountSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {}

  get cartCountValue(): number {
    return this.cartCountSubject.value;
  }

  private readStoredCartCount(): number {
    const value = Number(localStorage.getItem('kahveCartCount') || 0);
    return Number.isFinite(value) && value > 0 ? value : 0;
  }

  private setCartCount(count: number): void {
    const safeCount = Math.max(0, Math.floor(Number(count || 0)));
    localStorage.setItem('kahveCartCount', String(safeCount));
    this.cartCountSubject.next(safeCount);
  }

  clearLocalCartCount(): void {
    localStorage.removeItem('kahveCartCount');
    this.cartCountSubject.next(0);
  }

  private extractItems(response: any): any[] {
    const items = response?.items || response?.data || response?.cart || response || [];
    return Array.isArray(items) ? items : [];
  }

  private calculateItemsCount(items: any[]): number {
    return items.reduce((total, item) => {
      const amount = Number(item?.amount || 1);
      return total + (Number.isFinite(amount) && amount > 0 ? Math.floor(amount) : 1);
    }, 0);
  }

  updateCartCountFromItems(items: any[]): void {
    this.setCartCount(this.calculateItemsCount(items));
  }

  updateCartCountFromResponse(response: any): void {
    this.updateCartCountFromItems(this.extractItems(response));
  }

  refreshCartCount(): void {
    const request = this.http.get<any>(`${this.baseUrl}/cart`, { withCredentials: true });

    this.handleRequest(request, 'Refresh cart count').subscribe({
      next: (response: any) => this.updateCartCountFromResponse(response),
      error: () => this.clearLocalCartCount(),
    });
  }

  private refreshAccessToken(): Observable<any> {
    return this.http.post(`${this.baseUrl}/refresh-token`, {}, { withCredentials: true }).pipe(
      catchError((error) => {
        console.error('Refresh token failed:', error);
        this.clearLocalCartCount();
        this.router.navigate(['/login']);
        return throwError(() => new Error('Unable to refresh token, please log in again'));
      })
    );
  }

  private handleRequest<T>(request: Observable<T>, operation: string): Observable<T> {
    return request.pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          return this.refreshAccessToken().pipe(
            switchMap(() => request),
            catchError(() => {
              console.error(`${operation} failed after refresh attempt`);
              this.clearLocalCartCount();
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

  addToCart(product: {
    name: string;
    price: number;
    image: string;
    productId: string;
    amount?: number;
  }): Observable<any> {
    const request = this.http.post(`${this.baseUrl}/cart`, product, { withCredentials: true });

    return this.handleRequest(request, 'Add to cart').pipe(
      tap(() => this.refreshCartCount())
    );
  }

  getUserCart(): Observable<any> {
    const request = this.http.get<any>(`${this.baseUrl}/cart`, { withCredentials: true });

    return this.handleRequest(request, 'Get user cart').pipe(
      tap((response: any) => this.updateCartCountFromResponse(response))
    );
  }

  saveCartItem(cartId: string, amount: number): Observable<any> {
    const body = { cartId, amount };
    const request = this.http.patch<any>(`${this.baseUrl}/cart/save`, body, { withCredentials: true });

    return this.handleRequest(request, 'Save cart item').pipe(
      tap(() => this.refreshCartCount())
    );
  }

  deleteCartItem(cartId: string): Observable<any> {
    const body = { cartId };
    const request = this.http.delete<any>(`${this.baseUrl}/cart/delete`, { body, withCredentials: true });

    return this.handleRequest(request, 'Delete cart item').pipe(
      tap(() => this.refreshCartCount())
    );
  }

  clearCart(): Observable<any> {
    const request = this.http.delete<any>(`${this.baseUrl}/cart/all`, { withCredentials: true });

    return this.handleRequest(request, 'Clear cart').pipe(
      tap(() => this.clearLocalCartCount())
    );
  }

  getDeliveryDetails(cartId: string): Observable<any> {
    const request = this.http.get<any>(`${this.baseUrl}/deliveryDetails/${cartId}`, { withCredentials: true });
    return this.handleRequest(request, 'Get delivery details');
  }
}
