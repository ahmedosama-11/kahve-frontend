import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import {
  CheckoutSettingsService,
  DeliveryArea,
  DeliveryAreasImportSummary,
  PaymentSettings,
} from '../../../services/checkout-settings.service';
import { LanguageService } from '../../../services/language.service';

@Component({
  selector: 'app-delivery-settings',
  templateUrl: './delivery-settings.component.html',
  styleUrls: ['./delivery-settings.component.css'],
})
export class DeliverySettingsComponent implements OnInit {
  @ViewChild('areasFileInput') areasFileInput?: ElementRef<HTMLInputElement>;
  areas: DeliveryArea[] = [];
  loading = false;
  saving = false;
  editingId = '';
  errorMessage = '';
  successMessage = '';
  paymentSaving = false;

  selectedFile: File | null = null;
  importing = false;
  importSummary: DeliveryAreasImportSummary | null = null;
  importErrors: string[] = [];

  paymentSettings: PaymentSettings = {
    instapayEnabled: true,
    instapayLink: '',
    instapayShortName: '',
    manualPaymentInstructionsEn: 'Open the InstaPay payment link, complete the transfer, then return and press I paid to submit the order for review.',
    manualPaymentInstructionsAr: 'افتح لينك إنستا باي ونفذ التحويل، ثم ارجع واضغط تم الدفع لإرسال الطلب للمراجعة.',
  };

  form: DeliveryArea = this.emptyAreaForm();

  constructor(
    private settingsService: CheckoutSettingsService,
    public languageService: LanguageService,
  ) {}

  ngOnInit(): void {
    this.loadAreas();
    this.loadPaymentSettings();
  }

  isArabic(): boolean {
    return this.languageService.currentLanguage === 'ar';
  }

  private emptyAreaForm(): DeliveryArea {
    return {
      area_en: '',
      area_ar: '',
      deliveryFee: 0,
    };
  }

  loadAreas(): void {
    this.loading = true;
    this.settingsService.getAdminDeliveryAreas().subscribe({
      next: (response) => {
        const areas = response?.areas || response?.data || [];
        this.areas = Array.isArray(areas) ? areas : [];
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error?.error?.message || (this.isArabic()
          ? 'فشل تحميل مناطق التوصيل.'
          : 'Failed to load delivery areas.');
      },
    });
  }

  saveArea(): void {
    const areaEn = String(this.form.area_en || '').trim();
    const areaAr = String(this.form.area_ar || '').trim();
    const fee = Number(this.form.deliveryFee);

    if (!areaEn || !areaAr) {
      this.errorMessage = this.isArabic()
        ? 'اكتب اسم المنطقة بالعربي والإنجليزي.'
        : 'Enter the area name in Arabic and English.';
      return;
    }

    if (!Number.isFinite(fee) || fee < 0) {
      this.errorMessage = this.isArabic()
        ? 'اكتب سعر توصيل صحيح.'
        : 'Enter a valid delivery fee.';
      return;
    }

    this.saving = true;
    this.clearMessages();
    const payload: Partial<DeliveryArea> = {
      area_en: areaEn,
      area_ar: areaAr,
      deliveryFee: fee,
    };

    const request = this.editingId
      ? this.settingsService.updateDeliveryArea(this.editingId, payload)
      : this.settingsService.createDeliveryArea(payload);

    request.subscribe({
      next: () => {
        this.saving = false;
        this.successMessage = this.isArabic()
          ? 'تم حفظ المنطقة وسعر التوصيل.'
          : 'Delivery area and fee saved.';
        this.resetForm();
        this.loadAreas();
      },
      error: (error) => {
        this.saving = false;
        this.errorMessage = error?.error?.message || (this.isArabic()
          ? 'فشل حفظ المنطقة.'
          : 'Failed to save delivery area.');
      },
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] || null;
    this.importSummary = null;
    this.importErrors = [];
    this.clearMessages();
  }

  importAreas(): void {
    if (!this.selectedFile) {
      this.errorMessage = this.isArabic()
        ? 'اختار ملف Excel أو CSV الأول.'
        : 'Choose an Excel or CSV file first.';
      return;
    }

    this.importing = true;
    this.importSummary = null;
    this.importErrors = [];
    this.clearMessages();

    this.settingsService.importDeliveryAreas(this.selectedFile).subscribe({
      next: (response) => {
        this.importing = false;
        this.importSummary = response?.summary || null;
        this.importErrors = Array.isArray(this.importSummary?.errors)
          ? this.importSummary!.errors
          : [];
        this.successMessage = this.isArabic()
          ? `تم رفع المناطق: ${this.importSummary?.inserted || 0} جديد و${this.importSummary?.updated || 0} تم تحديثه.`
          : `Areas imported: ${this.importSummary?.inserted || 0} inserted and ${this.importSummary?.updated || 0} updated.`;
        this.selectedFile = null;
        if (this.areasFileInput) this.areasFileInput.nativeElement.value = '';
        this.loadAreas();
      },
      error: (error) => {
        this.importing = false;
        this.errorMessage = error?.error?.message || (this.isArabic()
          ? 'فشل رفع شيت المناطق.'
          : 'Failed to import the delivery areas sheet.');
      },
    });
  }

  downloadTemplate(): void {
    this.clearMessages();
    this.settingsService.downloadDeliveryAreasTemplate().subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = 'KAHVE_Delivery_Areas_Template.xlsx';
        anchor.click();
        URL.revokeObjectURL(url);
      },
      error: () => {
        this.errorMessage = this.isArabic()
          ? 'فشل تحميل نموذج الشيت.'
          : 'Failed to download the sheet template.';
      },
    });
  }

  editArea(area: DeliveryArea): void {
    this.editingId = area._id || '';
    this.form = {
      _id: area._id,
      area_en: area.area_en || '',
      area_ar: area.area_ar || '',
      deliveryFee: Number(area.deliveryFee || 0),
    };
    this.clearMessages();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  deleteArea(area: DeliveryArea): void {
    if (!area._id) return;
    const confirmed = window.confirm(this.isArabic()
      ? `حذف منطقة ${area.area_ar || area.area_en}؟`
      : `Delete ${area.area_en || area.area_ar}?`);
    if (!confirmed) return;

    this.clearMessages();
    this.settingsService.deleteDeliveryArea(area._id).subscribe({
      next: () => {
        this.successMessage = this.isArabic() ? 'تم حذف المنطقة.' : 'Delivery area deleted.';
        if (this.editingId === area._id) this.resetForm();
        this.loadAreas();
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || (this.isArabic()
          ? 'فشل حذف المنطقة.'
          : 'Failed to delete delivery area.');
      },
    });
  }

  resetForm(): void {
    this.editingId = '';
    this.form = this.emptyAreaForm();
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
    this.clearMessages();
    this.settingsService.updatePaymentSettings(this.paymentSettings).subscribe({
      next: (response) => {
        const settings = response?.settings || response?.data;
        if (settings) this.paymentSettings = { ...this.paymentSettings, ...settings };
        this.paymentSaving = false;
        this.successMessage = this.isArabic() ? 'تم حفظ إعدادات الدفع.' : 'Payment settings saved.';
      },
      error: (error) => {
        this.paymentSaving = false;
        this.errorMessage = error?.error?.message || (this.isArabic()
          ? 'فشل حفظ إعدادات الدفع.'
          : 'Failed to save payment settings.');
      },
    });
  }

  clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }
}
