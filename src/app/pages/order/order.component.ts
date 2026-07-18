import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { forkJoin } from 'rxjs';
import { OrderService } from '../../services/order.service';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-order',
  templateUrl: './order.component.html',
  styleUrl: './order.component.css',
})
export class OrderComponent implements OnInit {
  title: string = 'KAHVE | My Orders';
  rawOrders: any[] = [];
  items: any[] = [];
  loading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  confirmingPayment: boolean = false;

  constructor(
    private titleService: Title,
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService,
    public languageService: LanguageService,
  ) {
    this.titleService.setTitle(this.title);
  }

  ngOnInit(): void {
    this.loadOrderItems();
  }

  confirmCardCheckout(sessionId: string): void {
    this.errorMessage = this.languageService.currentLanguage === 'ar'
      ? 'الدفع بالكارت متوقف حاليًا.'
      : 'Card payment is currently disabled.';
  }

  loadOrderItems(): void {
    this.loading = true;
    this.errorMessage = '';

    this.orderService.getUserOrders().subscribe({
      next: (response: any) => {
        console.log('USER ORDERS:', response);
        const orders = response?.data || response?.orders || response?.items || response || [];
        this.rawOrders = Array.isArray(orders) ? orders : [];
        this.items = this.groupOrders(this.rawOrders);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading orders:', error);
        this.errorMessage = this.languageService.translate('orders.loadError');
        this.loading = false;
      },
    });
  }

  private groupOrders(orders: any[]): any[] {
    const groups = new Map<string, any>();

    orders.forEach((order) => {
      const createdAt = String(order.createdAt || order.updatedAt || '');
      const minuteKey = createdAt ? createdAt.slice(0, 16) : String(order.timestamp || order._id || '');
      const addressKey = String(order.address || '').trim().toLowerCase();
      const phoneKey = String(order.phone || '').trim().toLowerCase();
      const emailKey = String(order.email || '').trim().toLowerCase();
      const explicitKey = order.checkoutBatchId || order.batchId || order.groupId;
      const key = explicitKey || `${minuteKey}|${addressKey}|${phoneKey}|${emailKey}`;

      if (!groups.has(key)) {
        groups.set(key, {
          _id: order._id,
          orderNumber: order.orderNumber || order.orderNo || order.code || '',
          checkoutBatchId: order.checkoutBatchId || order.batchId || order.groupId || '',
          orderIds: [],
          products: [],
          address: order.address,
          city: order.city,
          state: order.state,
          country: order.country,
          phone: order.phone,
          email: order.email,
          status: order.status || 'pending',
          createdAt: order.createdAt,
          total: 0,
          subtotal: Number(order.subtotal || 0),
          deliveryFee: Number(order.deliveryFee || 0),
          discountAmount: Number(order.discountAmount || 0),
          grandTotal: Number(order.grandTotal || 0),
          couponCode: order.couponCode || '',
          paymentMethod: order.paymentMethod || 'cash',
          paymentStatus: order.paymentStatus || 'pending',
          amount: 0,
        });
      }

      const group = groups.get(key);
      group.orderIds.push(order._id);
      group.products.push(order);
      if (Number(order.grandTotal || 0) > 0) {
        group.total = Number(order.grandTotal || 0);
        group.subtotal = Number(order.subtotal || group.subtotal || 0);
        group.deliveryFee = Number(order.deliveryFee || group.deliveryFee || 0);
        group.discountAmount = Number(order.discountAmount || group.discountAmount || 0);
        group.couponCode = order.couponCode || group.couponCode || '';
        group.paymentMethod = order.paymentMethod || group.paymentMethod || 'cash';
        group.paymentStatus = order.paymentStatus || group.paymentStatus || 'pending';
      } else {
        group.total += this.getSingleOrderTotal(order);
      }
      group.amount += Number(order.amount || 1);

      if (order.status && order.status !== group.status) {
        group.status = group.status === 'pending' ? order.status : group.status;
      }
    });

    return Array.from(groups.values()).sort((a, b) => {
      const da = new Date(a.createdAt || 0).getTime();
      const db = new Date(b.createdAt || 0).getTime();
      return db - da;
    });
  }

  cancelOrder(item: any): void {
    const ids = Array.isArray(item?.orderIds) ? item.orderIds : [item?._id || item];
    const validIds = ids.filter(Boolean);
    if (!validIds.length) return;

    forkJoin(validIds.map((id: string) => this.orderService.cancelOrder(id))).subscribe({
      next: () => this.loadOrderItems(),
      error: (error) => {
        console.error('Error canceling order:', error);
      },
    });
  }


  isArabic(): boolean {
    return this.languageService.currentLanguage === 'ar';
  }

  getOrderNumber(item: any): string {
    const raw = item?.orderNumber || item?.orderNo || item?.code || item?.checkoutBatchId || item?._id || '';
    const digits = String(raw).replace(/\D/g, '');
    if (!digits) return '—';
    return digits.length > 8 ? digits.slice(-8) : digits;
  }

  getSingleOrderTotal(item: any): number {
    const amount = Number(item?.amount || 1);
    const price = Number(item?.price || 0);
    return Number(item?.total || item?.totalAmount || amount * price || 0);
  }

  getProductName(product: any): string {
    const productData = product?.product || product?.productId || product;
    return this.languageService.localizeProduct(productData, 'title')
      || this.languageService.localizeProduct(product, 'title')
      || product?.productName
      || product?.name
      || this.languageService.translate('orders.defaultTitle');
  }

  getOrderTitle(item: any): string {
    const products = Array.isArray(item?.products) ? item.products : [item];

    if (products.length > 1) {
      const names = products.map((product: any) => this.getProductName(product)).filter(Boolean);
      const label = this.languageService.translate('orders.multiProducts', { count: products.length });
      return `${label}: ${names.slice(0, 2).join(', ')}${names.length > 2 ? '...' : ''}`;
    }

    return this.getProductName(products[0] || item);
  }

  getOrderProducts(item: any): any[] {
    return Array.isArray(item?.products) ? item.products : [item];
  }

  getOrderTotal(item: any): number {
    return Number(item?.grandTotal || item?.total || this.getSingleOrderTotal(item));
  }

  getOrderAddress(item: any): string {
    const parts = [item?.address, item?.city, item?.state].filter(Boolean);
    return parts.length ? parts.join(', ') : (item?.deliveryAddress || item?.shippingAddress || this.languageService.translate('orders.noAddress'));
  }

  getOrderStatus(item: any): string {
    return item?.status || 'pending';
  }

  canCancelOrder(item: any): boolean {
    const status = this.getOrderStatus(item);
    return !['out_for_delivery', 'delivered', 'cancelled', 'rejected'].includes(status);
  }

  getStatusLabel(item: any): string {
    const status = this.getOrderStatus(item);
    return this.languageService.translate(`orders.${status}`) || status;
  }

  getOrderQuantity(item: any): number {
    return Number(item?.amount || 1);
  }


  getPaymentLabel(method: string): string {
    const labels: Record<string, { ar: string; en: string }> = {
      cash: { ar: 'كاش عند الاستلام', en: 'Cash on Delivery' },
      instapay: { ar: 'إنستا باي', en: 'InstaPay' },
    };
    const item = labels[method || 'cash'] || labels['cash'];
    return this.isArabic() ? item.ar : item.en;
  }

  getResolvedPaymentStatus(item: any): string {
    if ((item?.paymentMethod || 'cash') === 'cash' && item?.status === 'delivered') {
      return 'cash_done';
    }
    return item?.paymentStatus || 'pending';
  }

  getPaymentStatusLabel(statusOrOrder: any): string {
    const status = typeof statusOrOrder === 'string'
      ? statusOrOrder
      : this.getResolvedPaymentStatus(statusOrOrder);

    const labels: Record<string, { ar: string; en: string }> = {
      pending: { ar: 'لم يتم الدفع بعد', en: 'Pending' },
      pending_payment: { ar: 'بانتظار مراجعة الدفع', en: 'Waiting payment review' },
      paid: { ar: 'تم تأكيد الدفع', en: 'Paid' },
      cash_done: { ar: 'تم الدفع كاش', en: 'Done' },
      failed: { ar: 'فشل الدفع', en: 'Failed' },
    };
    const item = labels[status || 'pending'] || labels['pending'];
    return this.isArabic() ? item.ar : item.en;
  }

  moneyLabel(): string {
    return this.languageService.moneyLabel();
  }
}
