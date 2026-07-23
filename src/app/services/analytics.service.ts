import { Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { GA_MEASUREMENT_ID } from '../config/analytics.config';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private initialized = false;

  constructor(private router: Router) {}

  initialize(): void {
    if (this.initialized || !this.isConfigured()) return;
    this.initialized = true;

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_MEASUREMENT_ID)}`;
    document.head.appendChild(script);

    const win = window as any;
    win.dataLayer = win.dataLayer || [];
    win.gtag = win.gtag || function (...args: any[]) {
      win.dataLayer.push(args);
    };

    win.gtag('js', new Date());
    win.gtag('config', GA_MEASUREMENT_ID, { send_page_view: false });

    this.trackPageView(this.router.url);
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => this.trackPageView(event.urlAfterRedirects));
  }

  trackEvent(name: string, params: Record<string, any> = {}): void {
    if (!this.isConfigured()) return;
    const gtag = (window as any).gtag;
    if (typeof gtag === 'function') gtag('event', name, params);
  }

  trackPageView(url: string): void {
    this.trackEvent('page_view', {
      page_title: document.title,
      page_location: window.location.href,
      page_path: url,
    });
  }

  trackAddToCart(product: any, quantity: number): void {
    this.trackEvent('add_to_cart', {
      currency: 'EGP',
      value: Number(product?.price || 0) * Number(quantity || 1),
      items: [this.toAnalyticsItem(product, quantity)],
    });
  }

  trackViewItem(product: any): void {
    this.trackEvent('view_item', {
      currency: 'EGP',
      value: Number(product?.price || 0),
      items: [this.toAnalyticsItem(product, 1)],
    });
  }

  trackSearch(term: string): void {
    const searchTerm = String(term || '').trim();
    if (searchTerm) this.trackEvent('search', { search_term: searchTerm });
  }

  trackPurchase(response: any, items: any[], value: number): void {
    const orders = response?.orders || response?.data || [];
    const firstOrder = Array.isArray(orders) ? orders[0] : orders;
    const transactionId = String(
      firstOrder?.orderNumber ||
      response?.orderNumber ||
      response?.checkoutBatchId ||
      firstOrder?._id ||
      '',
    );

    if (!transactionId) return;

    this.trackEvent('purchase', {
      transaction_id: transactionId,
      currency: 'EGP',
      value: Number(value || 0),
      items: items.map((item) => this.toAnalyticsItem(item, Number(item?.amount || 1))),
    });
  }

  private toAnalyticsItem(product: any, quantity: number): Record<string, any> {
    return {
      item_id: String(product?._id || product?.productId || product?.id || product?.SKU || ''),
      item_name: String(product?.title || product?.name || product?.title_en || product?.title_ar || 'KAHVE Product'),
      item_category: String(product?.category || product?.category_en || product?.category_ar || 'Coffee'),
      price: Number(product?.price || 0),
      quantity: Number(quantity || 1),
    };
  }

  private isConfigured(): boolean {
    return /^G-[A-Z0-9]+$/i.test(GA_MEASUREMENT_ID) && GA_MEASUREMENT_ID !== 'G-REPLACE_ME';
  }
}
