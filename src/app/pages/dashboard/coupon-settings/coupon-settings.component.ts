import { Component, OnInit } from '@angular/core';
import { CheckoutSettingsService, Coupon } from '../../../services/checkout-settings.service';
import { LanguageService } from '../../../services/language.service';

@Component({
  selector: 'app-coupon-settings',
  templateUrl: './coupon-settings.component.html',
  styleUrls: ['./coupon-settings.component.css'],
})
export class CouponSettingsComponent implements OnInit {
  coupons: Coupon[] = [];
  loading = false;
  saving = false;
  errorMessage = '';
  successMessage = '';
  editingId = '';

  form: Coupon = {
    code: '',
    type: 'fixed',
    value: 0,
    minOrder: 0,
    maxDiscount: 0,
    active: true,
    expiresAt: '',
    usageLimit: 0,
    oneUsePerUser: false,
  };

  constructor(
    private settingsService: CheckoutSettingsService,
    public languageService: LanguageService
  ) {}

  ngOnInit(): void {
    this.loadCoupons();
  }

  isArabic(): boolean {
    return this.languageService.currentLanguage === 'ar';
  }

  loadCoupons(): void {
    this.loading = true;
    this.settingsService.getCoupons().subscribe({
      next: (response) => {
        this.coupons = response?.coupons || response?.data || [];
        this.loading = false;
      },
      error: () => {
        this.errorMessage = this.isArabic() ? 'فشل تحميل أكواد الخصم.' : 'Failed to load coupons.';
        this.loading = false;
      },
    });
  }

  saveCoupon(): void {
    if (!this.form.code) {
      this.errorMessage = this.isArabic() ? 'اكتب كود الخصم.' : 'Please enter coupon code.';
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';
    const payload = { ...this.form, code: this.form.code.trim().toUpperCase() };

    const request = this.editingId
      ? this.settingsService.updateCoupon(this.editingId, payload)
      : this.settingsService.createCoupon(payload);

    request.subscribe({
      next: () => {
        this.successMessage = this.isArabic() ? 'تم حفظ كود الخصم.' : 'Coupon saved.';
        this.saving = false;
        this.resetForm();
        this.loadCoupons();
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || (this.isArabic() ? 'فشل حفظ كود الخصم.' : 'Failed to save coupon.');
        this.saving = false;
      },
    });
  }

  editCoupon(coupon: Coupon): void {
    this.editingId = coupon._id || '';
    this.form = {
      _id: coupon._id,
      code: coupon.code || '',
      type: coupon.type || 'fixed',
      value: Number(coupon.value || 0),
      minOrder: Number(coupon.minOrder || 0),
      maxDiscount: Number(coupon.maxDiscount || 0),
      active: coupon.active !== false,
      expiresAt: coupon.expiresAt ? String(coupon.expiresAt).slice(0, 10) : '',
      usageLimit: Number(coupon.usageLimit || 0),
      usedCount: Number(coupon.usedCount || 0),
      oneUsePerUser: coupon.oneUsePerUser === true,
      usedBy: coupon.usedBy || [],
    };
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  deleteCoupon(coupon: Coupon): void {
    if (!coupon._id) return;
    const ok = confirm(this.isArabic() ? 'هل تريد حذف كود الخصم؟' : 'Delete this coupon?');
    if (!ok) return;

    this.settingsService.deleteCoupon(coupon._id).subscribe({
      next: () => this.loadCoupons(),
      error: () => {
        this.errorMessage = this.isArabic() ? 'فشل حذف كود الخصم.' : 'Failed to delete coupon.';
      },
    });
  }

  resetForm(): void {
    this.editingId = '';
    this.form = {
      code: '',
      type: 'fixed',
      value: 0,
      minOrder: 0,
      maxDiscount: 0,
      active: true,
      expiresAt: '',
      usageLimit: 0,
      oneUsePerUser: false,
    };
  }
}
