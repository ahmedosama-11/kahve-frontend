import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subscription, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { API_BASE_URL } from '../config/api.config';

@Injectable({ providedIn: 'root' })
export class CartService {
  private baseUrl = API_BASE_URL;
  private cartCountSubject = new BehaviorSubject<number>(this.readStoredCartCount());
  private refreshSubscription: Subscription | null = null;
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;
  private refreshSequence = 0;

  cartCount$ = this.cartCountSubject.asObservable();

  constructor(private http: HttpClient) {}

  get cartCountValue(): number {
    return this.cartCountSubject.value;
  }

  private readStoredCartCount(): number {
    try {
      const value = Number(localStorage.getItem('kahveCartCount') || 0);
      return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
    } catch {
      return 0;
    }
  }

  private storeCartCount(count: number): void {
    try {
      localStorage.setItem('kahveCartCount', String(count));
    } catch {
      // Safari can deny storage in some privacy modes. The in-memory count must still update.
    }
  }

  private removeStoredCartCount(): void {
    try {
      localStorage.removeItem('kahveCartCount');
    } catch {
      // Keep the in-memory state working even if browser storage is unavailable.
    }
  }

  private setCartCount(count: number): void {
    const safeCount = Math.max(0, Math.floor(Number(count || 0)));
    this.storeCartCount(safeCount);
    this.cartCountSubject.next(safeCount);
  }

  incrementCartCount(amount: number = 1): void {
    const safeAmount = Math.max(1, Math.floor(Number(amount || 1)));
    this.setCartCount(this.cartCountValue + safeAmount);
  }

  decrementCartCount(amount: number = 1): void {
    const safeAmount = Math.max(1, Math.floor(Number(amount || 1)));
    this.setCartCount(this.cartCountValue - safeAmount);
  }

  clearLocalCartCount(): void {
    this.removeStoredCartCount();
    this.cartCountSubject.next(0);
  }

  private extractItems(response: any): any[] | null {
    const candidates = [
      response?.items,
      response?.data?.items,
      response?.data,
      response?.cart?.items,
      response?.cart,
      response,
    ];

    const items = candidates.find((candidate) => Array.isArray(candidate));
    return Array.isArray(items) ? items : null;
  }

  private calculateItemsCount(items: any[]): number {
    return items.reduce((total, item) => {
      const amount = Number(item?.amount || 1);
      return total + (Number.isFinite(amount) && amount > 0 ? Math.floor(amount) : 1);
    }, 0);
  }

  updateCartCountFromItems(items: any[]): void {
    this.setCartCount(this.calculateItemsCount(Array.isArray(items) ? items : []));
  }

  updateCartCountFromResponse(response: any): boolean {
    const items = this.extractItems(response);
    if (!items) return false;

    this.updateCartCountFromItems(items);
    return true;
  }

  private getNoCacheOptions(): {
    withCredentials: true;
    params: HttpParams;
  } {
    return {
      withCredentials: true,
      // A unique URL avoids Safari/CDN reuse without adding custom headers or CORS preflights.
      params: new HttpParams().set('_kahveCartTs', `${Date.now()}-${this.refreshSequence}`),
    };
  }

  refreshCartCount(delayMs: number = 0): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }

    const runRefresh = () => {
      this.refreshSubscription?.unsubscribe();

      const requestSequence = ++this.refreshSequence;
      this.refreshSubscription = this.http
        .get<any>(`${this.baseUrl}/cart`, this.getNoCacheOptions())
        .subscribe({
          next: (response) => {
            if (requestSequence !== this.refreshSequence) return;
            this.updateCartCountFromResponse(response);
          },
          error: (error) => {
            if (requestSequence !== this.refreshSequence) return;
            console.warn('Refresh cart count failed:', error);
            // Do not erase a valid visible count because of a temporary mobile/network error.
          },
        });
    };

    if (delayMs > 0) {
      this.refreshTimer = setTimeout(() => {
        this.refreshTimer = null;
        runRefresh();
      }, delayMs);
      return;
    }

    runRefresh();
  }

  private handleError(operation: string) {
    return (error: any) => {
      console.error(`${operation} error:`, error);
      return throwError(() => error);
    };
  }

  addToCart(product: { name: string; price: number; image: string; productId: string; amount?: number }): Observable<any> {
    const amount = Math.max(1, Math.floor(Number(product?.amount || 1)));

    return this.http
      .post<any>(`${this.baseUrl}/cart`, product, { withCredentials: true })
      .pipe(
        tap((response) => {
          const responseContainsCart = this.updateCartCountFromResponse(response);
          if (!responseContainsCart) {
            this.incrementCartCount(amount);
          }

          // Reconcile once after the write. Cache-busting and request cancellation prevent stale Safari responses.
          this.refreshCartCount(250);
        }),
        catchError(this.handleError('Add to cart')),
      );
  }

  getUserCart(): Observable<any> {
    const requestSequence = ++this.refreshSequence;

    return this.http
      .get<any>(`${this.baseUrl}/cart`, this.getNoCacheOptions())
      .pipe(
        tap((response) => {
          if (requestSequence === this.refreshSequence) {
            this.updateCartCountFromResponse(response);
          }
        }),
        catchError(this.handleError('Get user cart')),
      );
  }

  saveCartItem(cartId: string, amount: number): Observable<any> {
    return this.http
      .patch<any>(`${this.baseUrl}/cart/save`, { cartId, amount }, { withCredentials: true })
      .pipe(catchError(this.handleError('Save cart item')));
  }

  deleteCartItem(cartId: string): Observable<any> {
    return this.http
      .delete<any>(`${this.baseUrl}/cart/delete`, {
        body: { cartId },
        withCredentials: true,
      })
      .pipe(catchError(this.handleError('Delete cart item')));
  }

  clearCart(): Observable<any> {
    return this.http
      .delete<any>(`${this.baseUrl}/cart/all`, { withCredentials: true })
      .pipe(
        tap(() => this.clearLocalCartCount()),
        catchError(this.handleError('Clear cart')),
      );
  }

  getDeliveryDetails(cartId: string): Observable<any> {
    return this.http
      .get<any>(`${this.baseUrl}/deliveryDetails/${cartId}`, {
        withCredentials: true,
      })
      .pipe(catchError(this.handleError('Get delivery details')));
  }
}
