import { Component, OnDestroy, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { LanguageService } from '../../../services/language.service';
import { API_BASE_URL } from '../../../config/api.config';

type KahveOrderStatus = 'pending' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'rejected' | 'accepted' | 'success';

@Component({
  selector: 'app-manage-orders',
  templateUrl: './manage-orders.component.html',
  styleUrls: ['./manage-orders.component.css']
})
export class ManageOrdersComponent implements OnInit, OnDestroy {
  rawOrders: any[] = [];
  orders: any[] = [];
  loading = true;
  errorMessage = '';
  newOrderMessage = '';
  openStatusMenuKey = '';
  private pollingTimer: any;
  private seenOrderIds = new Set<string>();
  private firstLoadDone = false;

  statuses: { value: KahveOrderStatus; labelAr: string; labelEn: string; icon: string }[] = [
    { value: 'preparing', labelAr: 'جاري التجهيز', labelEn: 'Preparing', icon: 'fa-mug-hot' },
    { value: 'out_for_delivery', labelAr: 'خرج للتوصيل', labelEn: 'Out for delivery', icon: 'fa-truck-fast' },
    { value: 'delivered', labelAr: 'تم التوصيل', labelEn: 'Delivered', icon: 'fa-circle-check' },
    { value: 'cancelled', labelAr: 'تم الإلغاء', labelEn: 'Cancelled', icon: 'fa-ban' },
  ];

  constructor(private http: HttpClient, public languageService: LanguageService) {}

  ngOnInit(): void {
    this.fetchOrders(true);
    this.pollingTimer = setInterval(() => this.fetchOrders(false), 12000);
  }

  ngOnDestroy(): void {
    if (this.pollingTimer) clearInterval(this.pollingTimer);
  }

  fetchOrders(showLoading = true): void {
    if (showLoading) this.loading = true;
    this.errorMessage = '';

    this.http.get<any>(`${API_BASE_URL}/admin/orders`, { withCredentials: true }).subscribe({
      next: (response) => {
        const orders = response?.orders || response?.data || response?.items || response || [];
        const newRawOrders = Array.isArray(orders) ? orders : [];
        this.handleNewOrderNotification(newRawOrders);
        this.rawOrders = newRawOrders;
        this.orders = this.groupOrders(this.rawOrders);
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load orders:', err);
        this.errorMessage = this.isArabic() ? 'فشل تحميل طلبات المتجر.' : 'Failed to load store orders.';
        this.loading = false;
      }
    });
  }

  private handleNewOrderNotification(newRawOrders: any[]): void {
    const currentIds = new Set(newRawOrders.map((order) => String(order._id)).filter(Boolean));

    if (!this.firstLoadDone) {
      this.seenOrderIds = currentIds;
      this.firstLoadDone = true;
      return;
    }

    const newIds = [...currentIds].filter((id) => !this.seenOrderIds.has(id));
    if (newIds.length) {
      this.newOrderMessage = this.isArabic()
        ? `وصلك طلب جديد (${newIds.length} منتج)`
        : `New order received (${newIds.length} item)`;
      this.playSoftAlert();
      this.showBrowserNotification(this.newOrderMessage);
      setTimeout(() => this.newOrderMessage = '', 7000);
    }

    this.seenOrderIds = currentIds;
  }

  private playSoftAlert(): void {
    try {
      const audio = new Audio();
      audio.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=';
      audio.play().catch(() => undefined);
    } catch {}
  }

  private showBrowserNotification(message: string): void {
    try {
      if (!('Notification' in window)) return;
      if (Notification.permission === 'granted') {
        new Notification('KAHVE', { body: message });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission();
      }
    } catch {}
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
          orderNumber: order.orderNumber || order.orderNo || order.code || '',
          checkoutBatchId: order.checkoutBatchId || order.batchId || order.groupId || '',
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
          subtotal: Number(order.subtotal || 0),
          deliveryFee: Number(order.deliveryFee || 0),
          discountAmount: Number(order.discountAmount || 0),
          grandTotal: Number(order.grandTotal || 0),
          couponCode: order.couponCode || '',
          paymentMethod: order.paymentMethod || 'cash',
          paymentStatus: order.paymentStatus || 'pending',
          paymentProofPhone: order.paymentProofPhone || '',
          paymentReference: order.paymentReference || '',
          paymentProofNote: order.paymentProofNote || '',
          paymentConfirmedAt: order.paymentConfirmedAt || null,
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
        group.paymentProofPhone = order.paymentProofPhone || group.paymentProofPhone || '';
        group.paymentReference = order.paymentReference || group.paymentReference || '';
        group.paymentProofNote = order.paymentProofNote || group.paymentProofNote || '';
        group.paymentConfirmedAt = order.paymentConfirmedAt || group.paymentConfirmedAt || null;
      } else {
        group.total += this.getSingleOrderTotal(order);
      }
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

  toggleStatusMenu(order: any): void {
    this.openStatusMenuKey = this.openStatusMenuKey === order.key ? '' : order.key;
  }

  updateStatus(order: any, status: KahveOrderStatus): void {
    const ids = Array.isArray(order?.orderIds) ? order.orderIds : [order?._id || order];
    const validIds = ids.filter(Boolean);
    if (!validIds.length) return;

    const requests = validIds.map((id: string) => {
      const url = `${API_BASE_URL}/admin/order/status/${id}`;
      return this.http.post(url, { status }, { withCredentials: true });
    });

    forkJoin(requests).subscribe({
      next: () => {
        this.openStatusMenuKey = '';
        this.orders = this.orders.map((item) => {
          if (item.key === order.key) {
            const cashDeliveredPaid = status === 'delivered' && (item.paymentMethod || 'cash') === 'cash';
            return {
              ...item,
              status,
              paymentStatus: cashDeliveredPaid ? 'paid' : item.paymentStatus,
              paymentConfirmedAt: cashDeliveredPaid ? new Date().toISOString() : item.paymentConfirmedAt,
              products: item.products.map((product: any) => ({
                ...product,
                status,
                paymentStatus: cashDeliveredPaid ? 'paid' : product.paymentStatus,
                paymentConfirmedAt: cashDeliveredPaid ? new Date().toISOString() : product.paymentConfirmedAt,
              }))
            };
          }
          return item;
        });
      },
      error: (error) => {
        console.error('Error updating grouped order status:', error);
        alert(this.isArabic() ? 'حدث خطأ أثناء تحديث حالة الطلب' : 'Error updating order status');
      }
    });
  }


  canConfirmPayment(order: any): boolean {
    return order?.paymentMethod === 'instapay' && order?.paymentStatus !== 'paid';
  }

  confirmManualPayment(order: any): void {
    const firstId = Array.isArray(order?.orderIds) ? order.orderIds[0] : (order?._id || order);
    if (!firstId) return;
    const ok = confirm(this.isArabic() ? 'تأكيد الدفع وتحويل الطلب إلى جاري التجهيز؟' : 'Confirm payment and move order to Preparing?');
    if (!ok) return;

    this.http.post<any>(`${API_BASE_URL}/admin/order/payment/confirm/${firstId}`, {}, { withCredentials: true }).subscribe({
      next: () => {
        this.orders = this.orders.map((item) => {
          if (item.key === order.key) {
            return {
              ...item,
              paymentStatus: 'paid',
              status: 'preparing',
              products: item.products.map((product: any) => ({ ...product, paymentStatus: 'paid', status: 'preparing' })),
            };
          }
          return item;
        });
      },
      error: (error) => {
        console.error('Error confirming manual payment:', error);
        alert(error?.error?.message || (this.isArabic() ? 'فشل تأكيد الدفع' : 'Failed to confirm payment'));
      },
    });
  }

  onStatusSelect(event: Event, order: any): void {
    const select = event.target as HTMLSelectElement;
    const status = select.value as KahveOrderStatus;
    if (!status) return;
    this.updateStatus(order, status);
    select.value = '';
  }

  cancelOrder(order: any): void {
    this.updateStatus(order, 'cancelled');
  }

  getSingleOrderTotal(order: any): number {
    const amount = Number(order?.amount || 1);
    const price = Number(order?.price || 0);
    return Number(order?.total || order?.totalAmount || amount * price || 0);
  }

  getOrderTotal(order: any): number {
    return Number(order?.grandTotal || order?.total || 0);
  }


  getOrderNumber(item: any): string {
    const raw = item?.orderNumber || item?.orderNo || item?.code || item?.checkoutBatchId || item?._id || '';
    const digits = String(raw).replace(/\D/g, '');
    if (!digits) return '—';
    return digits.length > 8 ? digits.slice(-8) : digits;
  }

  getPaymentLabel(method: string): string {
    const labels: Record<string, { ar: string; en: string }> = {
      cash: { ar: 'كاش', en: 'Cash' },
      instapay: { ar: 'إنستا باي', en: 'InstaPay' },
    };
    const item = labels[method || 'cash'] || labels['cash'];
    return this.isArabic() ? item.ar : item.en;
  }


  getResolvedPaymentStatus(order: any): string {
    if ((order?.paymentMethod || 'cash') === 'cash' && order?.status === 'delivered') {
      return 'cash_done';
    }
    return order?.paymentStatus || 'pending';
  }

  getPaymentStatusLabel(statusOrOrder: any): string {
    const status = typeof statusOrOrder === 'string'
      ? statusOrOrder
      : this.getResolvedPaymentStatus(statusOrOrder);

    const labels: Record<string, { ar: string; en: string }> = {
      pending: { ar: 'لم يتم الدفع', en: 'Pending' },
      pending_payment: { ar: 'بانتظار مراجعة الدفع', en: 'Waiting review' },
      paid: { ar: 'تم تأكيد الدفع', en: 'Paid' },
      cash_done: { ar: 'تم الدفع كاش', en: 'Done' },
      failed: { ar: 'فشل الدفع', en: 'Failed' },
    };
    const item = labels[status || 'pending'] || labels['pending'];
    return this.isArabic() ? item.ar : item.en;
  }

  getProductTitle(product: any): string {
    const productData = product?.productId || product?.product || product;
    return this.languageService.localizeProduct(productData, 'title')
      || this.languageService.localizeProduct(product, 'title')
      || product?.productName
      || product?.name
      || 'KAHVE Product';
  }

  getProductQuantity(product: any): number {
    return Number(product?.amount || product?.quantity || 1);
  }

  getOrderLocation(order: any): string {
    const parts = [order?.address, order?.city, order?.state, order?.country].filter(Boolean);
    return parts.length ? parts.join(', ') : (this.isArabic() ? 'لا يوجد عنوان' : 'No location');
  }

  getOrderStatus(order: any): string {
    return order?.status || 'pending';
  }

  getStatusLabel(statusOrOrder: any): string {
    const status = typeof statusOrOrder === 'string' ? statusOrOrder : this.getOrderStatus(statusOrOrder);
    const key = `orders.${status}`;
    const translated = this.languageService.translate(key);
    return translated && translated !== key ? translated : status;
  }

  isArabic(): boolean {
    return this.languageService.currentLanguage === 'ar';
  }

  moneyLabel(): string {
    return this.languageService.moneyLabel();
  }

  exportOrdersReport(): void {
    const rows = [
      ['Order Number', 'Order ID', 'Customer', 'Email', 'Phone', 'Products', 'Total', 'Payment Method', 'Payment Status', 'Status', 'Address', 'Date'],
      ...this.orders.map((order) => [
        this.getOrderNumber(order),
        order.orderIds?.join(' | ') || order._id,
        order.username || '',
        order.email || '',
        order.phone || '',
        order.products.map((p: any) => `${this.getProductTitle(p)} x ${this.getProductQuantity(p)}`).join(' | '),
        this.getOrderTotal(order),
        this.getPaymentLabel(order.paymentMethod),
        order.paymentStatus || '',
        this.getStatusLabel(order),
        this.getOrderLocation(order),
        order.createdAt ? new Date(order.createdAt).toLocaleString() : '',
      ])
    ];
    this.downloadCsv(rows, 'kahve-orders-report.csv');
  }

  exportProductsReport(): void {
    const map = new Map<string, { product: string; quantity: number; sales: number }>();
    this.rawOrders.forEach((item) => {
      const name = this.getProductTitle(item);
      const quantity = this.getProductQuantity(item);
      const sales = this.getSingleOrderTotal(item);
      const old = map.get(name) || { product: name, quantity: 0, sales: 0 };
      old.quantity += quantity;
      old.sales += sales;
      map.set(name, old);
    });

    const rows = [
      ['Product', 'Sold Quantity', 'Sales Total'],
      ...Array.from(map.values()).map((item) => [item.product, item.quantity, item.sales])
    ];
    this.downloadCsv(rows, 'kahve-products-sales-report.csv');
  }

  private downloadCsv(rows: any[][], filename: string): void {
    const csv = rows.map((row) => row.map((cell) => {
      const value = String(cell ?? '').replace(/"/g, '""');
      return `"${value}"`;
    }).join(',')).join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }
}
