import { Component, OnInit } from '@angular/core';
import { CategoryService } from '../../../services/category.service';

@Component({
  selector: 'app-category-settings',
  templateUrl: './category-settings.component.html',
  styleUrls: ['./category-settings.component.css'],
})
export class CategorySettingsComponent implements OnInit {
  categories: any[] = [];
  isSaving = false;
  isLoading = false;
  message = '';
  error = '';
  editingId = '';

  form: any = {
    name_en: '',
    name_ar: '',
    sortOrder: 100,
    isActive: true,
    showInHome: true,
  };

  constructor(private categoryService: CategoryService) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.isLoading = true;
    this.categoryService.getCategories(true).subscribe({
      next: (res) => {
        this.categories = res?.categories || res?.data || [];
      },
      error: (err) => {
        this.error = err?.error?.message || 'Could not load categories.';
      },
      complete: () => {
        this.isLoading = false;
      },
    });
  }

  resetForm(): void {
    this.editingId = '';
    this.form = {
      name_en: '',
      name_ar: '',
      sortOrder: 100,
      isActive: true,
      showInHome: true,
    };
    this.message = '';
    this.error = '';
  }

  editCategory(category: any): void {
    this.editingId = category._id;
    this.form = {
      name_en: category.name_en || '',
      name_ar: category.name_ar || '',
      sortOrder: category.sortOrder ?? 100,
      isActive: category.isActive !== false,
      showInHome: category.showInHome !== false,
    };
    this.message = '';
    this.error = '';
    document.querySelector('.main-content')?.scrollTo({ top: 0, behavior: 'smooth' });
  }

  saveCategory(): void {
    this.message = '';
    this.error = '';

    if (!String(this.form.name_en || '').trim() || !String(this.form.name_ar || '').trim()) {
      this.error = 'English and Arabic category names are required.';
      return;
    }

    this.isSaving = true;
    const payload = {
      name_en: String(this.form.name_en || '').trim(),
      name_ar: String(this.form.name_ar || '').trim(),
      sortOrder: Number(this.form.sortOrder || 100),
      isActive: !!this.form.isActive,
      showInHome: !!this.form.showInHome,
    };

    const request = this.editingId
      ? this.categoryService.updateCategory(this.editingId, payload)
      : this.categoryService.createCategory(payload);

    request.subscribe({
      next: (res) => {
        this.message = res?.message || (this.editingId ? 'Category updated.' : 'Category added.');
        this.resetForm();
        this.loadCategories();
      },
      error: (err) => {
        this.error = err?.error?.message || 'Could not save category.';
      },
      complete: () => {
        this.isSaving = false;
      },
    });
  }


  syncFromProducts(): void {
    this.message = '';
    this.error = '';
    this.isLoading = true;
    this.categoryService.syncFromProducts().subscribe({
      next: (res) => {
        this.message = res?.message || 'Categories synced from existing products.';
        this.categories = res?.categories || res?.data || [];
      },
      error: (err) => {
        this.error = err?.error?.message || 'Could not sync categories from products.';
      },
      complete: () => {
        this.isLoading = false;
      },
    });
  }

  deleteCategory(category: any): void {
    if (!category?._id) return;
    const ok = confirm(`Delete category "${category.name_en}"? Products will stay, but will move to Uncategorized.`);
    if (!ok) return;

    this.categoryService.deleteCategory(category._id).subscribe({
      next: (res) => {
        this.message = res?.message || 'Category deleted.';
        this.loadCategories();
      },
      error: (err) => {
        this.error = err?.error?.message || 'Could not delete category.';
      },
    });
  }
}
