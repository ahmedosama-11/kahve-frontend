import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { API_BASE_URL } from '../config/api.config';

@Injectable({ providedIn: 'root' })
export class CartService {
  private baseUrl = API_BASE_URL;
  private cartCountSubject = new BehaviorSubject<number>(this.readStoredCartCount());
  cartCount$ = this.cartCountSubject.asObservable();

  constructor(private http: HttpClient) {}

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
    this.http.get<any>(`${this.baseUrl}/cart`).subscribe({
      next: (response) => this.updateCartCountFromResponse(response),
      error: () => this.clearLocalCartCount(),
    });
  }

  private handleError(operation: string) {
    return (error: any) => {
      console.error(`${operation} error:`, error);
      return throwError(() => error);
    };
  }

  addToCart(product: { name: string; price: number; image: string; productId: string; amount?: number }): Observable<any> {
    return this.http.post(`${this.baseUrl}/cart`, product).pipe(
      tap(() => this.refreshCartCount()),
      catchError(this.handleError('Add to cart')),
    );
  }

  getUserCart(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/cart`).pipe(
      tap((response) => this.updateCartCountFromResponse(response)),
      catchError(this.handleError('Get user cart')),
    );
  }

  saveCartItem(cartId: string, amount: number): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/cart/save`, { cartId, amount }).pipe(
      tap(() => this.refreshCartCount()),
      catchError(this.handleError('Save cart item')),
    );
  }

  deleteCartItem(cartId: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/cart/delete`, { body: { cartId } }).pipe(
      tap(() => this.refreshCartCount()),
      catchError(this.handleError('Delete cart item')),
    );
  }

  clearCart(): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/cart/all`).pipe(
      tap(() => this.clearLocalCartCount()),
      catchError(this.handleError('Clear cart')),
    );
  }

  getDeliveryDetails(cartId: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/deliveryDetails/${cartId}`).pipe(
      catchError(this.handleError('Get delivery details')),
    );
  }
}
