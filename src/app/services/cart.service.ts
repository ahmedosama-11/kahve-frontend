import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { API_BASE_URL } from '../config/api.config';

@Injectable({ providedIn: 'root' })
export class CartService {
  private baseUrl = API_BASE_URL;
  private cartCountSubject = new BehaviorSubject<number>(this.readStoredCartCount());
  private cartItemAmounts = new Map<string, number>();
  private cartItemProducts = new Map<string, string>();

  cartCount$ = this.cartCountSubject.asObservable();

  constructor(private http: HttpClient) {}

  get cartCountValue(): number {
    return this.cartCountSubject.value;
  }

  private normalizeAmount(value: any): number {
    const amount = Number(value || 1);
    return Number.isFinite(amount) && amount > 0 ? Math.floor(amount) : 1;
  }

  private readStoredCartCount(): number {
    const value = Number(localStorage.getItem('kahveCartCount') || 0);
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
  }

  private setCartCount(count: number): void {
    const safeCount = Math.max(0, Math.floor(Number(count || 0)));
    localStorage.setItem('kahveCartCount', String(safeCount));
    this.cartCountSubject.next(safeCount);
  }

  private changeCartCount(delta: number): void {
    this.setCartCount(this.cartCountSubject.value + Number(delta || 0));
  }

  clearLocalCartCount(): void {
    this.cartItemAmounts.clear();
    this.cartItemProducts.clear();
    localStorage.removeItem('kahveCartCount');
    this.cartCountSubject.next(0);
  }

  private extractItems(response: any): any[] {
    const candidates = [
      response?.items,
      response?.data?.items,
      response?.cart?.items,
      response?.data,
      response?.cart,
      response,
    ];

    const items = candidates.find((candidate) => Array.isArray(candidate));
    return Array.isArray(items) ? items : [];
  }

  private getCartItemId(item: any): string {
    return String(item?._id || item?.cartId || item?.id || '').trim();
  }

  private getProductId(item: any): string {
    const value = item?.productId?._id || item?.productId || item?.currentProduct?._id || item?.product?._id || '';
    return String(value || '').trim();
  }

  private calculateItemsCount(items: any[]): number {
    return items.reduce((total, item) => total + this.normalizeAmount(item?.amount), 0);
  }

  private rebuildCartIndex(items: any[]): void {
    this.cartItemAmounts.clear();
    this.cartItemProducts.clear();

    items.forEach((item) => {
      const cartId = this.getCartItemId(item);
      if (!cartId) return;

      this.cartItemAmounts.set(cartId, this.normalizeAmount(item?.amount));

      const productId = this.getProductId(item);
      if (productId) this.cartItemProducts.set(cartId, productId);
    });
  }

  updateCartCountFromItems(items: any[]): void {
    const safeItems = Array.isArray(items) ? items : [];
    this.rebuildCartIndex(safeItems);
    this.setCartCount(this.calculateItemsCount(safeItems));
  }

  updateCartCountFromResponse(response: any): void {
    this.updateCartCountFromItems(this.extractItems(response));
  }

  refreshCartCount(): void {
    this.http.get<any>(`${this.baseUrl}/cart`).subscribe({
      next: (response) => this.updateCartCountFromResponse(response),
      // Keep the last known value on temporary mobile/network failures.
      error: (error) => console.warn('Refresh cart count failed:', error),
    });
  }

  private handleError(operation: string) {
    return (error: any) => {
      console.error(`${operation} error:`, error);
      return throwError(() => error);
    };
  }

  addToCart(product: { name: string; price: number; image: string; productId: string; amount?: number }): Observable<any> {
    const requestedAmount = this.normalizeAmount(product?.amount);

    return this.http.post<any>(`${this.baseUrl}/cart`, product).pipe(
      tap((response) => {
        // Update the header immediately from the successful mutation.
        // Do not issue a second GET because mobile browsers may receive a stale cached response.
        this.changeCartCount(requestedAmount);

        const createdItem = response?.data || response?.item || response?.cartItem || response?.cart;
        const cartId = this.getCartItemId(createdItem);
        if (cartId) {
          this.cartItemAmounts.set(cartId, requestedAmount);
          if (product.productId) this.cartItemProducts.set(cartId, String(product.productId));
        }
      }),
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
    const safeAmount = this.normalizeAmount(amount);
    const previousAmount = this.cartItemAmounts.get(String(cartId)) ?? safeAmount;

    return this.http.patch<any>(`${this.baseUrl}/cart/save`, { cartId, amount: safeAmount }).pipe(
      tap(() => {
        this.cartItemAmounts.set(String(cartId), safeAmount);
        this.changeCartCount(safeAmount - previousAmount);
      }),
      catchError(this.handleError('Save cart item')),
    );
  }

  deleteCartItem(cartId: string, removedAmount?: number): Observable<any> {
    const normalizedCartId = String(cartId || '');
    const knownAmount = removedAmount != null
      ? this.normalizeAmount(removedAmount)
      : (this.cartItemAmounts.get(normalizedCartId) || 1);

    return this.http.delete<any>(`${this.baseUrl}/cart/delete`, { body: { cartId } }).pipe(
      tap(() => {
        this.cartItemAmounts.delete(normalizedCartId);
        this.cartItemProducts.delete(normalizedCartId);
        this.changeCartCount(-knownAmount);
      }),
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
