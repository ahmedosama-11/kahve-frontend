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

  private refreshRequestId = 0;
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;

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

  private setCartCount(count: number): void {
    const safeCount = Math.max(0, Math.floor(Number(count || 0)));

    // Update Angular first. Safari storage errors must never block the visible badge.
    this.cartCountSubject.next(safeCount);

    try {
      localStorage.setItem('kahveCartCount', String(safeCount));
    } catch (error) {
      console.warn('Could not persist cart count:', error);
    }
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
    this.setCartCount(0);
    try {
      localStorage.removeItem('kahveCartCount');
    } catch (error) {
      console.warn('Could not clear stored cart count:', error);
    }
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

  /**
   * Loads the authoritative cart count.
   * A timestamp prevents Safari/Vercel from reusing an old GET /cart response.
   * The request id prevents an older, slower request from overwriting a newer count.
   */
  refreshCartCount(delayMs: number = 0): void {
    const requestId = ++this.refreshRequestId;

    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }

    const run = () => {
      this.refreshTimer = null;
      this.http.get<any>(`${this.baseUrl}/cart`, {
        withCredentials: true,
        params: { _ts: String(Date.now()) },
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
        },
      }).subscribe({
        next: (response) => {
          if (requestId === this.refreshRequestId) {
            this.updateCartCountFromResponse(response);
          }
        },
        error: (error) => {
          // Keep the last known count during a temporary mobile-network failure.
          console.warn('Could not refresh cart count:', error);
        },
      });
    };

    if (delayMs > 0) {
      this.refreshTimer = setTimeout(run, delayMs);
    } else {
      run();
    }
  }

  private handleError(operation: string) {
    return (error: any) => {
      console.error(`${operation} error:`, error);
      return throwError(() => error);
    };
  }

  addToCart(product: { name: string; price: number; image: string; productId: string; amount?: number }): Observable<any> {
    const amount = Math.max(1, Math.floor(Number(product?.amount || 1)));

    return this.http.post(`${this.baseUrl}/cart`, product, { withCredentials: true }).pipe(
      tap(() => {
        // POST succeeded, so update the badge immediately.
        this.incrementCartCount(amount);
        // Then reconcile once with a fresh server response.
        this.refreshCartCount(350);
      }),
      catchError(this.handleError('Add to cart')),
    );
  }

  getUserCart(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/cart`, {
      withCredentials: true,
      params: { _ts: String(Date.now()) },
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
      },
    }).pipe(
      tap((response) => this.updateCartCountFromResponse(response)),
      catchError(this.handleError('Get user cart')),
    );
  }

  saveCartItem(cartId: string, amount: number): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/cart/save`, { cartId, amount }, { withCredentials: true }).pipe(
      tap(() => this.refreshCartCount(350)),
      catchError(this.handleError('Save cart item')),
    );
  }

  deleteCartItem(cartId: string, removedAmount: number = 1): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/cart/delete`, {
      body: { cartId },
      withCredentials: true,
    }).pipe(
      tap(() => {
        // DELETE succeeded, so update the badge immediately.
        this.decrementCartCount(removedAmount);
        this.refreshCartCount(350);
      }),
      catchError(this.handleError('Delete cart item')),
    );
  }

  clearCart(): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/cart/all`, { withCredentials: true }).pipe(
      tap(() => this.clearLocalCartCount()),
      catchError(this.handleError('Clear cart')),
    );
  }

  getDeliveryDetails(cartId: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/deliveryDetails/${cartId}`, { withCredentials: true }).pipe(
      catchError(this.handleError('Get delivery details')),
    );
  }
}
