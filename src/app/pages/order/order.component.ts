import { Component, OnInit } from '@angular/core';
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

  constructor(
    private titleService: Title,
    private orderService: OrderService,
    public languageService: LanguageService,
  ) {
    this.titleService.setTitle(this.title);
  }

  ngOnInit(): void {
    this.loadOrderItems();
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
          amount: 0,
        });
      }

      const group = groups.get(key);
      group.orderIds.push(order._id);
      group.products.push(order);
      group.total += this.getSingleOrderTotal(order);
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
    return Number(item?.total || this.getSingleOrderTotal(item));
  }

  getOrderAddress(item: any): string {
    const parts = [item?.address, item?.city, item?.state].filter(Boolean);
    return parts.length ? parts.join(', ') : (item?.deliveryAddress || item?.shippingAddress || this.languageService.translate('orders.noAddress'));
  }

  getOrderStatus(item: any): string {
    return item?.status || 'pending';
  }

  getStatusLabel(item: any): string {
    const status = this.getOrderStatus(item);
    return this.languageService.translate(`orders.${status}`) || status;
  }

  getOrderQuantity(item: any): number {
    return Number(item?.amount || 1);
  }

  moneyLabel(): string {
    return this.languageService.moneyLabel();
  }
}
