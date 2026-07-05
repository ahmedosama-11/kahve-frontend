import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-manage-orders',
  templateUrl: './manage-orders.component.html',
  styleUrls: ['./manage-orders.component.css']
})
export class ManageOrdersComponent implements OnInit {
  rawOrders: any[] = [];
  orders: any[] = [];
  loading = true;
  errorMessage = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchOrders();
  }

  fetchOrders(): void {
    this.loading = true;
    this.errorMessage = '';

    this.http.get<any>('http://localhost:3000/admin/orders', { withCredentials: true }).subscribe({
      next: (response) => {
        const orders = response?.orders || response?.data || response?.items || response || [];
        this.rawOrders = Array.isArray(orders) ? orders : [];
        this.orders = this.groupOrders(this.rawOrders);
        this.loading = false;
        console.log('ADMIN RAW ORDERS:', this.rawOrders);
        console.log('ADMIN GROUPED ORDERS:', this.orders);
      },
      error: (err) => {
        console.error('Failed to load orders:', err);
        this.errorMessage = 'Failed to load store orders.';
        this.loading = false;
      }
    });
  }

  private groupOrders(orders: any[]): any[] {
    const groups = new Map<string, any>();

    orders.forEach((order) => {
      const explicitKey = order.checkoutBatchId || order.batchId || order.groupId || order.orderGroupId;
      const createdAt = String(order.createdAt || order.updatedAt || '');
      const minuteKey = createdAt ? createdAt.slice(0, 16) : String(order.timestamp || '').slice(0, 10);
      const userKey = String(order.userId?._id || order.userId || order.email || order.username || 'guest').trim().toLowerCase();
      const addressKey = String(order.address || order.deliveryAddress || order.shippingAddress || '').trim().toLowerCase();
      const phoneKey = String(order.phone || '').trim().toLowerCase();
      const key = explicitKey || `${userKey}|${minuteKey}|${addressKey}|${phoneKey}`;

      if (!groups.has(key)) {
        groups.set(key, {
          _id: order._id,
          key,
          orderIds: [],
          products: [],
          username: order.username || order.name || order.user?.name || 'Customer',
          email: order.email || order.user?.email || '',
          phone: order.phone || '',
          address: order.address || order.deliveryAddress || order.shippingAddress || '',
          city: order.city || '',
          state: order.state || '',
          country: order.country || '',
          status: order.status || 'pending',
          createdAt: order.createdAt || order.updatedAt,
          total: 0,
          amount: 0,
        });
      }

      const group = groups.get(key);
      group.orderIds.push(order._id);
      group.products.push(order);
      group.total += this.getSingleOrderTotal(order);
      group.amount += Number(order.amount || 1);

      if (order.status && group.status === 'pending' && order.status !== 'pending') {
        group.status = order.status;
      }
    });

    return Array.from(groups.values()).sort((a, b) => {
      const da = new Date(a.createdAt || 0).getTime();
      const db = new Date(b.createdAt || 0).getTime();
      return db - da;
    });
  }

  updateStatus(order: any, action: 'accept' | 'reject'): void {
    const ids = Array.isArray(order?.orderIds) ? order.orderIds : [order?._id || order];
    const validIds = ids.filter(Boolean);
    if (!validIds.length) return;

    const requests = validIds.map((id: string) => {
      const url = `http://localhost:3000/admin/order/${action}/${id}`;
      return this.http.post(url, {}, { withCredentials: true });
    });

    forkJoin(requests).subscribe({
      next: () => {
        const newStatus = action === 'accept' ? 'accepted' : 'rejected';
        this.orders = this.orders.map((item) => {
          if (item.key === order.key) {
            return {
              ...item,
              status: newStatus,
              products: item.products.map((product: any) => ({ ...product, status: newStatus }))
            };
          }
          return item;
        });
      },
      error: (error) => {
        console.error('Error updating grouped order status:', error);
        alert('Error updating order status');
      }
    });
  }

  getSingleOrderTotal(order: any): number {
    const amount = Number(order?.amount || 1);
    const price = Number(order?.price || 0);
    return Number(order?.total || order?.totalAmount || amount * price || 0);
  }

  getOrderTotal(order: any): number {
    return Number(order?.total || 0);
  }

  getProductTitle(product: any): string {
    return product?.title || product?.productName || product?.name || product?.product?.title || 'KAHVE Product';
  }

  getProductQuantity(product: any): number {
    return Number(product?.amount || product?.quantity || 1);
  }

  getOrderLocation(order: any): string {
    const parts = [order?.address, order?.city, order?.state, order?.country].filter(Boolean);
    return parts.length ? parts.join(', ') : 'No location';
  }

  getOrderStatus(order: any): string {
    return order?.status || 'pending';
  }
}
