import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { OrderService } from '../../services/order.service';
import { CartService } from '../../services/cart.service';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-delivery',
  templateUrl: './delivery-details.component.html',
  styleUrls: ['./delivery-details.component.css'],
})
export class DeliveryDetailsComponent implements OnInit {
  deliveryData = {
    name: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: '',
    phone: '',
    email: '',
  };

  checkoutItems: any[] = [];
  submitting = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private route: ActivatedRoute,
    private orderService: OrderService,
    private cartService: CartService,
    private router: Router,
    public languageService: LanguageService,
  ) {}

  ngOnInit(): void {
    this.prefillUserData();

    this.route.queryParams.subscribe((params) => {
      const mode = params['mode'];
      if (mode === 'cart') {
        this.loadCheckoutItemsFromSession();
        return;
      }

      this.checkoutItems = [
        {
          cartId: params['cartId'],
          price: Number(params['price'] || 0),
          total: Number(params['price'] || 0),
          name: params['name'],
          title: params['name'],
          amount: Number(params['amount'] || 1),
          productId: params['productId'],
          image: params['image'],
        },
      ].filter((item) => item.productId || item.cartId || item.name);
    });
  }

  prefillUserData(): void {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      this.deliveryData.name = user?.name || '';
      this.deliveryData.email = user?.email || localStorage.getItem('email') || '';
      this.deliveryData.phone = user?.phone || '';
    } catch {
      this.deliveryData.email = localStorage.getItem('email') || '';
    }
  }

  loadCheckoutItemsFromSession(): void {
    try {
      const stored = sessionStorage.getItem('kahveCheckoutItems');
      const parsed = stored ? JSON.parse(stored) : [];
      this.checkoutItems = Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Could not read checkout items:', error);
      this.checkoutItems = [];
    }
  }

  getTotalQuantity(): number {
    return this.checkoutItems.reduce((total, item) => total + Number(item.amount || 1), 0);
  }

  getGrandTotal(): number {
    return this.checkoutItems.reduce((total, item) => {
      const amount = Number(item.amount || 1);
      const price = Number(item.price || 0);
      return total + amount * price;
    }, 0);
  }

  getItemsSummary(): string {
    return this.languageService.translate('checkout.productsItems', {
      products: this.checkoutItems.length,
      items: this.getTotalQuantity(),
    });
  }

  moneyLabel(): string {
    return this.languageService.moneyLabel();
  }

  getItemName(item: any): string {
    const product = item?.currentProduct || item?.product || item;
    return this.languageService.localizeProduct(product, 'title') || item?.name || item?.title || '';
  }

  submitDeliveryDetails(): void {
    if (!this.checkoutItems.length) {
      this.errorMessage = this.languageService.translate('checkout.emptyList');
      return;
    }

    this.submitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const checkoutBatchId = `kahve-${Date.now()}`;

    const requests = this.checkoutItems.map((item) => {
      const amount = Number(item.amount || 1);
      const price = Number(item.price || 0);
      const itemName = this.getItemName(item);
      const product = item?.currentProduct || item?.product || item;
      const orderData = {
        checkoutBatchId,
        cartId: item.cartId,
        price,
        title: itemName,
        name: itemName,
        title_en: product?.title_en || item?.title_en || '',
        title_ar: product?.title_ar || item?.title_ar || '',
        amount,
        image: item.image,
        productId: item.productId,
        address: this.deliveryData.address,
        username: this.deliveryData.name,
        phone: this.deliveryData.phone,
        email: this.deliveryData.email,
        city: this.deliveryData.city,
        state: this.deliveryData.state,
        zip: this.deliveryData.zip,
        country: this.deliveryData.country,
      };

      return this.orderService.checkout(orderData);
    });

    forkJoin(requests).subscribe({
      next: () => {
        this.successMessage = this.languageService.translate('checkout.success');
        this.clearCartAfterCheckout();
      },
      error: (error) => {
        console.error('Checkout error:', error);
        this.errorMessage = error?.error?.message || this.languageService.translate('checkout.error');
        this.submitting = false;
      },
    });
  }

  private clearCartAfterCheckout(): void {
    this.cartService.clearCart().pipe(
      catchError((error) => {
        console.warn('Bulk cart clear failed, trying item-by-item cleanup:', error);
        const deleteRequests = this.checkoutItems
          .filter((item) => item.cartId)
          .map((item) => this.cartService.deleteCartItem(item.cartId).pipe(catchError(() => of(null))));

        return deleteRequests.length ? forkJoin(deleteRequests) : of(null);
      })
    ).subscribe({
      next: () => this.finishCheckout(),
      error: () => this.finishCheckout(),
    });
  }

  private finishCheckout(): void {
    sessionStorage.removeItem('kahveCheckoutItems');
    this.cartService.clearLocalCartCount();
    this.submitting = false;
    this.router.navigate(['/orders']);
  }
}
