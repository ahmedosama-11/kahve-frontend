import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { OrderService } from '../../services/order.service';
import { CartService } from '../../services/cart.service';
import { LanguageService } from '../../services/language.service';
import { CheckoutSettingsService, DeliveryArea, PaymentSettings } from '../../services/checkout-settings.service';

type PaymentMethod = 'cash' | 'instapay';

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
    areaId: '',
    area_en: '',
    area_ar: '',
    zip: '',
    country: '',
    phone: '',
    email: '',
  };

  checkoutItems: any[] = [];
  deliveryAreas: DeliveryArea[] = [];
  filteredAreas: DeliveryArea[] = [];
  selectedArea: DeliveryArea | null = null;
  availableCities: string[] = [];
  couponCode = '';
  appliedCouponCode = '';
  discountAmount = 0;
  couponMessage = '';
  couponError = '';
  paymentMethod: PaymentMethod = 'cash';
  paymentSettings: PaymentSettings = {
    instapayEnabled: true,
    instapayLink: '',
    instapayShortName: '',
    manualPaymentInstructionsEn: 'Open the InstaPay payment link, complete the transfer, then return and press I paid to submit the order for review.',
    manualPaymentInstructionsAr: 'افتح لينك إنستا باي ونفذ التحويل، ثم ارجع واضغط تم الدفع لإرسال الطلب للمراجعة.',
  };
  instapayLinkOpened = false;
  paymentProof = {
    senderPhone: '',
    reference: '',
    note: '',
  };
  submitting = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private route: ActivatedRoute,
    private orderService: OrderService,
    private cartService: CartService,
    private router: Router,
    public languageService: LanguageService,
    private checkoutSettingsService: CheckoutSettingsService,
  ) {}

  ngOnInit(): void {
    this.prefillUserData();
    this.loadPaymentSettings();
    this.loadDeliveryAreas();

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

  loadPaymentSettings(): void {
    this.checkoutSettingsService.getPaymentSettings().subscribe({
      next: (response) => {
        const settings = response?.settings || response?.data;
        if (settings) this.paymentSettings = { ...this.paymentSettings, ...settings };
      },
      error: () => {
        // Keep defaults; checkout will show an error only if the customer chooses InstaPay without a configured link.
      },
    });
  }

  isManualPayment(): boolean {
    return this.paymentMethod === 'instapay';
  }

  onPaymentMethodChange(): void {
    this.instapayLinkOpened = false;
    this.errorMessage = '';
    this.paymentProof = { senderPhone: '', reference: '', note: '' };
  }

  isOrderDataComplete(): boolean {
    const required = [
      this.deliveryData.name,
      this.deliveryData.phone,
      this.deliveryData.email,
      this.deliveryData.address,
      this.deliveryData.city,
      this.deliveryData.state || this.deliveryData.areaId,
      this.deliveryData.country,
    ];

    const hasMissing = required.some((value) => !String(value || '').trim());
    if (hasMissing) return false;

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(this.deliveryData.email || '').trim());
    if (!emailOk) return false;

    if (this.deliveryAreas.length && !this.selectedArea) return false;
    return true;
  }

  canOpenInstapayLink(): boolean {
    return this.paymentMethod === 'instapay'
      && !!String(this.paymentSettings.instapayLink || '').trim()
      && this.isOrderDataComplete();
  }

  onOpenInstapayLink(event?: Event): void {
    if (!this.canOpenInstapayLink()) {
      if (event) event.preventDefault();
      this.instapayLinkOpened = false;
      this.errorMessage = this.languageService.currentLanguage === 'ar'
        ? 'كمّل بيانات الطلب الأول قبل فتح لينك الدفع.'
        : 'Please complete order details before opening the payment link.';
      return;
    }

    this.errorMessage = '';
    this.instapayLinkOpened = true;
  }

  getManualPaymentNote(): string {
    const fallbackAr = 'افتح لينك إنستا باي ونفذ التحويل، ثم ارجع واضغط زر تم الدفع لإرسال الطلب للمراجعة.';
    const fallbackEn = 'Open the InstaPay payment link, complete the transfer, then return and press I paid to submit the order for review.';

    if (this.paymentMethod === 'instapay') {
      return this.languageService.currentLanguage === 'ar'
        ? (this.paymentSettings.manualPaymentInstructionsAr || fallbackAr)
        : (this.paymentSettings.manualPaymentInstructionsEn || fallbackEn);
    }

    return '';
  }

  getManualDestinationLabel(): string {
    return this.paymentSettings.instapayShortName || 'KAHVE';
  }

  getSubmitButtonLabel(): string {
    if (this.submitting) return this.languageService.translate('checkout.creating');
    if (this.isManualPayment()) {
      return this.instapayLinkOpened
        ? this.languageService.translate('checkout.confirmPaymentButton')
        : this.languageService.translate('checkout.openPaymentFirst');
    }
    return this.languageService.translate('checkout.placeOrder');
  }

  loadDeliveryAreas(): void {
    this.checkoutSettingsService.getDeliveryAreas().subscribe({
      next: (response) => {
        const areas = response?.areas || response?.data || [];
        this.deliveryAreas = Array.isArray(areas) ? areas : [];
        this.availableCities = Array.from(new Set(this.deliveryAreas.map((area) => this.getAreaCity(area)).filter(Boolean)));
        if (!this.deliveryData.city && this.availableCities.length) {
          this.deliveryData.city = this.availableCities[0];
          this.onCityChange();
        }
      },
      error: () => {
        this.deliveryAreas = [];
        this.availableCities = [];
      },
    });
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

  getSubtotal(): number {
    return this.checkoutItems.reduce((total, item) => {
      const amount = Number(item.amount || 1);
      const price = Number(item.price || 0);
      return total + amount * price;
    }, 0);
  }

  getDeliveryFee(): number {
    return Number(this.selectedArea?.deliveryFee || 0);
  }

  getFinalTotal(): number {
    return Math.max(0, this.getSubtotal() + this.getDeliveryFee() - Number(this.discountAmount || 0));
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

  getAreaCity(area: DeliveryArea): string {
    return this.languageService.currentLanguage === 'ar'
      ? (area.city_ar || area.city_en || '')
      : (area.city_en || area.city_ar || '');
  }

  getAreaName(area: DeliveryArea): string {
    return this.languageService.currentLanguage === 'ar'
      ? (area.area_ar || area.area_en || '')
      : (area.area_en || area.area_ar || '');
  }

  onCityChange(): void {
    this.filteredAreas = this.deliveryAreas.filter((area) => this.getAreaCity(area) === this.deliveryData.city);
    this.deliveryData.areaId = '';
    this.deliveryData.state = '';
    this.selectedArea = null;
    this.clearCoupon(false);
  }

  onAreaChange(): void {
    this.selectedArea = this.deliveryAreas.find((area) => area._id === this.deliveryData.areaId) || null;
    if (this.selectedArea) {
      this.deliveryData.state = this.getAreaName(this.selectedArea);
      this.deliveryData.area_en = this.selectedArea.area_en;
      this.deliveryData.area_ar = this.selectedArea.area_ar;
      this.deliveryData.city = this.getAreaCity(this.selectedArea);
    }
  }

  applyCoupon(): void {
    const code = this.couponCode.trim();
    this.couponError = '';
    this.couponMessage = '';
    this.discountAmount = 0;
    this.appliedCouponCode = '';

    if (!code) {
      this.couponError = this.languageService.translate('checkout.couponRequired');
      return;
    }

    this.checkoutSettingsService.validateCoupon(code, this.getSubtotal()).subscribe({
      next: (response) => {
        const coupon = response?.coupon || response?.data || {};
        this.discountAmount = Number(coupon.discountAmount || 0);
        this.appliedCouponCode = coupon.code || code.toUpperCase();
        this.couponMessage = this.languageService.translate('checkout.couponApplied');
      },
      error: (error) => {
        this.couponError = error?.error?.message || this.languageService.translate('checkout.couponInvalid');
      },
    });
  }

  clearCoupon(resetInput = true): void {
    if (resetInput) this.couponCode = '';
    this.appliedCouponCode = '';
    this.discountAmount = 0;
    this.couponMessage = '';
    this.couponError = '';
  }


  validateDeliveryData(): boolean {
    const required = [
      { key: 'name', value: this.deliveryData.name },
      { key: 'phone', value: this.deliveryData.phone },
      { key: 'email', value: this.deliveryData.email },
      { key: 'address', value: this.deliveryData.address },
      { key: 'city', value: this.deliveryData.city },
      { key: 'area', value: this.deliveryData.state || this.deliveryData.areaId },
      { key: 'country', value: this.deliveryData.country },
    ];

    const missing = required.filter((item) => !String(item.value || '').trim());
    if (missing.length) {
      this.errorMessage = this.languageService.currentLanguage === 'ar'
        ? 'من فضلك كمّل بيانات التوصيل قبل تأكيد الطلب.'
        : 'Please complete delivery information before placing the order.';
      return false;
    }

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(this.deliveryData.email || '').trim());
    if (!emailOk) {
      this.errorMessage = this.languageService.currentLanguage === 'ar'
        ? 'من فضلك اكتب بريد إلكتروني صحيح.'
        : 'Please enter a valid email address.';
      return false;
    }

    return true;
  }

  canSubmitCheckout(): boolean {
    if (this.submitting || this.checkoutItems.length === 0) return false;
    if (this.deliveryAreas.length && !this.selectedArea) return false;
    if (this.isManualPayment()) {
      if (!String(this.paymentSettings.instapayLink || '').trim()) return false;
      if (!this.instapayLinkOpened) return false;
    }
    return true;
  }

  submitDeliveryDetails(): void {
    if (!this.checkoutItems.length) {
      this.errorMessage = this.languageService.translate('checkout.emptyList');
      return;
    }

    if (!this.validateDeliveryData()) {
      return;
    }

    if (this.deliveryAreas.length && !this.selectedArea) {
      this.errorMessage = this.languageService.translate('checkout.areaRequired');
      return;
    }

    if (this.isManualPayment() && !String(this.paymentSettings.instapayLink || '').trim()) {
      this.errorMessage = this.languageService.currentLanguage === 'ar'
        ? 'لينك إنستا باي غير متسجل. من فضلك تواصل مع المتجر.'
        : 'InstaPay link is not configured. Please contact the store.';
      return;
    }

    if (this.isManualPayment() && !this.instapayLinkOpened) {
      this.errorMessage = this.languageService.currentLanguage === 'ar'
        ? 'افتح لينك الدفع بعد إكمال بيانات الطلب، وبعد التحويل اضغط تم الدفع.'
        : 'Complete order details, open the payment link, then press I paid after completing the transfer.';
      return;
    }

    this.submitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const checkoutBatchId = `kahve-${Date.now()}`;

    const paymentProof = this.isManualPayment()
      ? {
          senderPhone: '',
          reference: '',
          note: this.languageService.currentLanguage === 'ar'
            ? 'العميل ضغط تم الدفع بعد فتح لينك إنستا باي. مطلوب مراجعة التحويل من الأدمن.'
            : 'Customer clicked I paid after opening the InstaPay link. Admin review is required.',
        }
      : null;

    const items = this.checkoutItems.map((item) => {
      const amount = Number(item.amount || 1);
      const price = Number(item.price || 0);
      const itemName = this.getItemName(item);
      const product = item?.currentProduct || item?.product || item;
      return {
        cartId: item.cartId,
        price,
        title: itemName,
        name: itemName,
        title_en: product?.title_en || item?.title_en || '',
        title_ar: product?.title_ar || item?.title_ar || '',
        amount,
        image: item.image,
        productId: item.productId,
      };
    });

    this.orderService.checkoutBatch({
      checkoutBatchId,
      deliveryData: {
        name: this.deliveryData.name,
        username: this.deliveryData.name,
        address: this.deliveryData.address,
        phone: this.deliveryData.phone,
        email: this.deliveryData.email,
        city: this.deliveryData.city,
        state: this.deliveryData.state,
        areaId: this.deliveryData.areaId,
        area_en: this.deliveryData.area_en,
        area_ar: this.deliveryData.area_ar,
        zip: this.deliveryData.zip,
        country: this.deliveryData.country,
        deliveryFee: this.getDeliveryFee(),
      },
      items,
      couponCode: this.appliedCouponCode || this.couponCode.trim(),
      paymentMethod: this.paymentMethod,
      paymentProof,
    }).subscribe({
      next: (response) => {
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
