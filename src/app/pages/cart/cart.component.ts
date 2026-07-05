import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css',
})
export class CartComponent implements OnInit {
  title: string = 'KAHVE | Cart';
  items: any[] = [];
  loading: boolean = false;
  checkoutMessage: string = '';

  constructor(
    private titleService: Title,
    private cartService: CartService,
    private router: Router,
    public languageService: LanguageService,
  ) {
    this.titleService.setTitle(this.title);
  }

  ngOnInit(): void {
    this.loadCartItems();
  }

  loadCartItems(): void {
    this.loading = true;
    this.cartService.getUserCart().subscribe({
      next: (response: any) => {
        const items = response?.data || response?.items || response?.cart || [];
        this.items = Array.isArray(items)
          ? items.map((item) => {
              const available = this.getAvailableQuantity(item);
              const amount = this.normalizeAmount(item.amount);
              return {
                ...item,
                amount: available > 0 ? Math.min(amount, available) : amount,
                stockMessage: available <= 0 ? this.languageService.translate('cart.outOfStock') : '',
              };
            })
          : [];
        this.cartService.updateCartCountFromItems(this.items);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading cart items:', error);
        this.loading = false;
      },
    });
  }

  normalizeAmount(value: any): number {
    const amount = Number(value || 1);
    return Number.isFinite(amount) && amount > 0 ? Math.floor(amount) : 1;
  }

  getAvailableQuantity(item: any): number {
    const value = Number(item?.availableQuantity ?? item?.productStock ?? item?.currentProduct?.Quantity ?? item?.Quantity ?? 0);
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
  }

  isOutOfStock(item: any): boolean {
    return this.getAvailableQuantity(item) <= 0 || item?.isOutOfStock === true;
  }

  hasStockIssue(): boolean {
    return this.items.some((item) => this.isOutOfStock(item) || this.normalizeAmount(item.amount) > this.getAvailableQuantity(item));
  }

  getItemName(item: any): string {
    const product = item?.currentProduct || item?.product || item;
    return this.languageService.localizeProduct(product, 'title') || item?.name || item?.title || '';
  }

  getSku(item: any): string {
    return item?.currentProduct?.SKU || item?.SKU || item?.productId?.slice?.(0, 8) || '';
  }

  getCartSummaryText(): string {
    return this.languageService.translate('cart.summary', {
      products: this.items.length,
      items: this.getTotalQuantity(),
    });
  }

  getItemsAcrossText(): string {
    return this.languageService.translate('cart.itemsAcross', {
      products: this.items.length,
      items: this.getTotalQuantity(),
    });
  }

  moneyLabel(): string {
    return this.languageService.moneyLabel();
  }

  clampItemAmount(item: any): void {
    const available = this.getAvailableQuantity(item);
    const amount = this.normalizeAmount(item.amount);

    if (available <= 0) {
      item.stockMessage = this.languageService.translate('cart.stockOutMessage');
      item.amount = amount;
      return;
    }

    if (amount > available) {
      item.amount = available;
      item.stockMessage = this.languageService.translate('cart.onlyAvailable', { available });
      return;
    }

    item.amount = amount;
    item.stockMessage = '';
  }

  increaseItem(item: any): void {
    const available = this.getAvailableQuantity(item);
    if (available <= 0) {
      item.stockMessage = this.languageService.translate('cart.stockOutMessage');
      return;
    }

    const nextAmount = this.normalizeAmount(item.amount) + 1;
    if (nextAmount > available) {
      item.stockMessage = this.languageService.translate('cart.onlyAvailable', { available });
      item.amount = available;
      return;
    }

    item.amount = nextAmount;
    item.stockMessage = '';
    this.cartService.updateCartCountFromItems(this.items);
  }

  decreaseItem(item: any): void {
    item.amount = Math.max(1, this.normalizeAmount(item.amount) - 1);
    this.clampItemAmount(item);
    this.cartService.updateCartCountFromItems(this.items);
  }

  onAmountChange(item: any): void {
    this.clampItemAmount(item);
    this.cartService.updateCartCountFromItems(this.items);
  }

  getItemTotal(item: any): number {
    return Number(item?.price || 0) * this.normalizeAmount(item?.amount);
  }

  getCartTotal(): number {
    return this.items.reduce((total, item) => total + this.getItemTotal(item), 0);
  }

  getTotalQuantity(): number {
    return this.items.reduce((total, item) => total + this.normalizeAmount(item.amount), 0);
  }

  saveItem(cartId: string, amount: number): void {
    if (!cartId || !amount || amount <= 0) {
      console.error('Invalid cartId or amount');
      return;
    }

    const item = this.items.find((cartItem) => cartItem._id === cartId);
    if (item) this.clampItemAmount(item);
    const safeAmount = item ? this.normalizeAmount(item.amount) : this.normalizeAmount(amount);

    this.cartService.saveCartItem(cartId, safeAmount).subscribe({
      next: (response: any) => {
        const index = this.items.findIndex((cartItem) => cartItem._id === cartId);

        if (index !== -1) {
          this.items[index] = {
            ...this.items[index],
            ...(response.data || {}),
            amount: this.normalizeAmount(response?.data?.amount || safeAmount),
            isSaved: true,
            stockMessage: '',
          };

          setTimeout(() => {
            if (this.items[index]) this.items[index].isSaved = false;
          }, 2000);
        }
      },
      error: (error) => {
        console.error('Error saving item:', error);
        if (item) item.stockMessage = error?.error?.message || this.languageService.translate('cart.saveError');
      },
    });
  }

  saveAllItems(): Promise<boolean> {
    const invalid = this.items.filter((item) => {
      this.clampItemAmount(item);
      return this.isOutOfStock(item) || this.normalizeAmount(item.amount) > this.getAvailableQuantity(item);
    });

    if (invalid.length) {
      this.checkoutMessage = this.languageService.translate('cart.checkoutInvalid');
      return Promise.resolve(false);
    }

    const requests = this.items.map((item) =>
      new Promise<boolean>((resolve) => {
        this.cartService.saveCartItem(item._id, this.normalizeAmount(item.amount)).subscribe({
          next: () => resolve(true),
          error: (error) => {
            item.stockMessage = error?.error?.message || this.languageService.translate('cart.saveError');
            console.error('Error saving cart item before checkout:', error);
            resolve(false);
          },
        });
      })
    );

    return Promise.all(requests).then((results) => results.every(Boolean));
  }

  async checkoutAll(): Promise<void> {
    if (!this.items.length) return;

    this.checkoutMessage = this.languageService.translate('cart.preparing');
    const saved = await this.saveAllItems();
    if (!saved) return;

    const checkoutItems = this.items.map((item) => ({
      cartId: item._id,
      price: Number(item.price || 0),
      total: this.getItemTotal(item),
      name: this.getItemName(item),
      title: this.getItemName(item),
      title_en: item?.currentProduct?.title_en || item?.title_en || item?.name || '',
      title_ar: item?.currentProduct?.title_ar || item?.title_ar || '',
      amount: this.normalizeAmount(item.amount),
      image: item.image,
      productId: item.productId,
      currentProduct: item.currentProduct || null,
    }));

    sessionStorage.setItem('kahveCheckoutItems', JSON.stringify(checkoutItems));
    this.router.navigate(['/deliveryDetails'], { queryParams: { mode: 'cart' } });
  }

  deleteItem(cartId: string): void {
    this.cartService.deleteCartItem(cartId).subscribe({
      next: () => {
        this.items = this.items.filter((item) => item._id !== cartId);
        this.cartService.updateCartCountFromItems(this.items);
      },
      error: (error) => console.error('Error deleting item:', error),
    });
  }
}
