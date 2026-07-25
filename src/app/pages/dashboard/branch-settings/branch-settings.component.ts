import { Component, OnInit } from '@angular/core';
import { Branch, CheckoutSettingsService } from '../../../services/checkout-settings.service';
import { LanguageService } from '../../../services/language.service';

@Component({
  selector: 'app-branch-settings',
  templateUrl: './branch-settings.component.html',
  styleUrls: ['./branch-settings.component.css'],
})
export class BranchSettingsComponent implements OnInit {
  branches: Branch[] = [];
  loading = false;
  saving = false;
  editingId = '';
  errorMessage = '';
  successMessage = '';

  form: Branch = {
    nameEn: '',
    nameAr: '',
    code: '',
    active: true,
  };

  constructor(
    private settingsService: CheckoutSettingsService,
    public languageService: LanguageService,
  ) {}

  ngOnInit(): void {
    this.loadBranches();
  }

  isArabic(): boolean {
    return this.languageService.currentLanguage === 'ar';
  }

  loadBranches(): void {
    this.loading = true;
    this.settingsService.getAdminBranches().subscribe({
      next: (response) => {
        this.branches = response?.branches || response?.data || [];
        this.loading = false;
      },
      error: () => {
        this.errorMessage = this.isArabic() ? 'فشل تحميل الفروع.' : 'Failed to load branches.';
        this.loading = false;
      },
    });
  }

  saveBranch(): void {
    if (!this.form.nameEn.trim() || !this.form.nameAr.trim() || !this.form.code.trim()) {
      this.errorMessage = this.isArabic()
        ? 'اكتب اسم الفرع بالعربي والإنجليزي وكود الفرع.'
        : 'Enter Branch Name EN, Branch Name AR and Branch Code.';
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';
    const payload = { ...this.form, code: this.form.code.trim().toUpperCase() };
    const request = this.editingId
      ? this.settingsService.updateBranch(this.editingId, payload)
      : this.settingsService.createBranch(payload);

    request.subscribe({
      next: () => {
        this.successMessage = this.isArabic() ? 'تم حفظ الفرع.' : 'Branch saved.';
        this.saving = false;
        this.resetForm();
        this.loadBranches();
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || (this.isArabic() ? 'فشل حفظ الفرع.' : 'Failed to save branch.');
        this.saving = false;
      },
    });
  }

  editBranch(branch: Branch): void {
    this.editingId = branch._id || '';
    this.form = {
      _id: branch._id,
      nameEn: branch.nameEn || '',
      nameAr: branch.nameAr || '',
      code: branch.code || '',
      active: branch.active !== false,
    };
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  deleteBranch(branch: Branch): void {
    if (!branch._id) return;
    const ok = confirm(this.isArabic()
      ? 'سيتم حذف الفرع مع الاحتفاظ بمناطقه كـ مناطق غير مرتبطة. هل تريد المتابعة؟'
      : 'The branch will be deleted and its areas will be kept as unassigned. Continue?');
    if (!ok) return;

    this.settingsService.deleteBranch(branch._id).subscribe({
      next: () => {
        this.successMessage = this.isArabic()
          ? 'تم حذف الفرع والاحتفاظ بالمناطق بدون ربط.'
          : 'Branch deleted and its areas were kept unassigned.';
        this.loadBranches();
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || (this.isArabic() ? 'فشل حذف الفرع.' : 'Failed to delete branch.');
      },
    });
  }

  resetForm(): void {
    this.editingId = '';
    this.form = { nameEn: '', nameAr: '', code: '', active: true };
  }
}
