import { Component, OnInit } from '@angular/core';
import { CheckoutSettingsService, DeliveryArea, PaymentSettings } from '../../../services/checkout-settings.service';
import { LanguageService } from '../../../services/language.service';

@Component({
  selector: 'app-delivery-settings',
  templateUrl: './delivery-settings.component.html',
  styleUrls: ['./delivery-settings.component.css'],
})
export class DeliverySettingsComponent implements OnInit {
  areas: DeliveryArea[] = [];
  loading = false;
  saving = false;
  importing = false;
  replaceAreas = false;
  selectedFile: File | null = null;
  importErrors: string[] = [];
  errorMessage = '';
  successMessage = '';
  editingId = '';
  paymentSaving = false;
  paymentSettings: PaymentSettings = {
    instapayEnabled: true,
    instapayLink: '',
    instapayShortName: '',
    manualPaymentInstructionsEn: 'Open the InstaPay payment link, complete the transfer, then return and press I paid to submit the order for review.',
    manualPaymentInstructionsAr: 'افتح لينك إنستا باي ونفذ التحويل، ثم ارجع واضغط تم الدفع لإرسال الطلب للمراجعة.',
  };

  form: DeliveryArea = {
    city_en: 'Cairo',
    city_ar: 'القاهرة',
    area_en: '',
    area_ar: '',
    deliveryFee: 0,
    active: true,
  };

  constructor(
    private settingsService: CheckoutSettingsService,
    public languageService: LanguageService
  ) {}

  ngOnInit(): void {
    this.loadAreas();
    this.loadPaymentSettings();
  }

  isArabic(): boolean {
    return this.languageService.currentLanguage === 'ar';
  }


  loadPaymentSettings(): void {
    this.settingsService.getAdminPaymentSettings().subscribe({
      next: (response) => {
        const settings = response?.settings || response?.data;
        if (settings) this.paymentSettings = { ...this.paymentSettings, ...settings };
      },
      error: () => {
        this.errorMessage = this.isArabic() ? 'فشل تحميل إعدادات الدفع.' : 'Failed to load payment settings.';
      },
    });
  }

  savePaymentSettings(): void {
    this.paymentSaving = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.settingsService.updatePaymentSettings(this.paymentSettings).subscribe({
      next: (response) => {
        const settings = response?.settings || response?.data;
        if (settings) this.paymentSettings = { ...this.paymentSettings, ...settings };
        this.paymentSaving = false;
        this.successMessage = this.isArabic() ? 'تم حفظ إعدادات الدفع.' : 'Payment settings saved.';
      },
      error: (error) => {
        this.paymentSaving = false;
        this.errorMessage = error?.error?.message || (this.isArabic() ? 'فشل حفظ إعدادات الدفع.' : 'Failed to save payment settings.');
      },
    });
  }

  loadAreas(): void {
    this.loading = true;
    this.settingsService.getAdminDeliveryAreas().subscribe({
      next: (response) => {
        this.areas = response?.areas || response?.data || [];
        this.loading = false;
      },
      error: () => {
        this.errorMessage = this.isArabic() ? 'فشل تحميل مناطق التوصيل.' : 'Failed to load delivery areas.';
        this.loading = false;
      },
    });
  }

  saveArea(): void {
    if (!this.form.area_en && !this.form.area_ar) {
      this.errorMessage = this.isArabic() ? 'اكتب اسم المنطقة.' : 'Please enter area name.';
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const request = this.editingId
      ? this.settingsService.updateDeliveryArea(this.editingId, this.form)
      : this.settingsService.createDeliveryArea(this.form);

    request.subscribe({
      next: () => {
        this.successMessage = this.isArabic() ? 'تم حفظ منطقة التوصيل.' : 'Delivery area saved.';
        this.saving = false;
        this.resetForm();
        this.loadAreas();
    this.loadPaymentSettings();
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || (this.isArabic() ? 'فشل حفظ المنطقة.' : 'Failed to save area.');
        this.saving = false;
      },
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] || null;
    this.importErrors = [];
  }

  importAreas(): void {
    if (!this.selectedFile) {
      this.errorMessage = this.isArabic() ? 'اختار ملف Excel أو CSV الأول.' : 'Choose an Excel or CSV file first.';
      return;
    }

    this.importing = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.importErrors = [];

    this.settingsService.importDeliveryAreas(this.selectedFile, this.replaceAreas).subscribe({
      next: (response) => {
        this.areas = response?.areas || response?.data || [];
        this.importErrors = response?.errors || [];
        const inserted = response?.inserted || 0;
        const updated = response?.updated || 0;
        this.successMessage = this.isArabic()
          ? `تم رفع مناطق التوصيل. جديد: ${inserted} / تحديث: ${updated}`
          : `Delivery areas imported. Inserted: ${inserted} / Updated: ${updated}`;
        this.importing = false;
        this.selectedFile = null;
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || (this.isArabic() ? 'فشل رفع الشيت.' : 'Failed to import sheet.');
        this.importErrors = error?.error?.errors || [];
        this.importing = false;
      }
    });
  }

  editArea(area: DeliveryArea): void {
    this.editingId = area._id || '';
    this.form = {
      _id: area._id,
      city_en: area.city_en || '',
      city_ar: area.city_ar || '',
      area_en: area.area_en || '',
      area_ar: area.area_ar || '',
      deliveryFee: Number(area.deliveryFee || 0),
      active: area.active !== false,
    };
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  deleteArea(area: DeliveryArea): void {
    if (!area._id) return;
    const ok = confirm(this.isArabic() ? 'هل تريد حذف المنطقة؟' : 'Delete this delivery area?');
    if (!ok) return;

    this.settingsService.deleteDeliveryArea(area._id).subscribe({
      next: () => this.loadAreas(),
      error: () => {
        this.errorMessage = this.isArabic() ? 'فشل حذف المنطقة.' : 'Failed to delete area.';
      },
    });
  }

  resetForm(): void {
    this.editingId = '';
    this.form = {
      city_en: 'Cairo',
      city_ar: 'القاهرة',
      area_en: '',
      area_ar: '',
      deliveryFee: 0,
      active: true,
    };
  }
}
