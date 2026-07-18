import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { LanguageService } from '../../../services/language.service';
import { CategoryService } from '../../../services/category.service';
import { API_BASE_URL } from '../../../config/api.config';

@Component({
  selector: 'app-view-products',
  templateUrl: './view-products.component.html',
  styleUrls: ['./view-products.component.css']
})
export class ViewProductsComponent implements OnInit {
  products: any[] = [];
  pagedProducts: any[] = [];
  categories: any[] = [];

  currentPage: number = 1;
  pageSize: number = 12;
  totalPages: number = 0;

  isEditOpen = false;
  isUpdating = false;
  editError = '';
  editSuccess = '';
  selectedProduct: any = null;
  selectedImageFile: File | null = null;
  editImagePreview = '';

  stockFile: File | null = null;
  stockImporting = false;
  stockMessage = '';
  stockError = '';
  stockReport: any = null;

  productImportFile: File | null = null;
  productImporting = false;
  productImportReplace = true;
  productImportMessage = '';
  productImportError = '';
  productImportReport: any = null;

  editForm: any = {
    code: '',
    title: '',
    title_en: '',
    title_ar: '',
    price: '',
    Quantity: '',
    description: '',
    description_en: '',
    description_ar: '',
    category: '',
    category_en: '',
    category_ar: '',
    SKU: '',
    face_shape: '',
    categoryId: '',
    isBestSeller: false,
  };

  coffeeCategories: string[] = [
    'Turkish Coffee',
    'Instant Coffee',
    'Coffee Mixes',
    'Nescafe',
    'Premium Coffee',
  ];

  flavorNotes: string[] = [
    'Light Roast',
    'Medium Roast',
    'Dark Roast',
    'Cardamom',
    'Classic',
    'Gold',
    'Hazelnut',
    'Caramel',
    'Chocolate',
    'Espresso',
    'Family Pack',
    'Gift Box',
  ];

  private categoryDisplayMap: Record<string, string> = {
    'men eye glasses': 'Turkish Coffee',
    'men sun glasses': 'Instant Coffee',
    'women eye glasses': 'Coffee Mixes',
    'women sun glasses': 'Nescafe',
    'kids glasses': 'Premium Coffee',
  };

  constructor(
    private http: HttpClient,
    public languageService: LanguageService,
    private categoryService: CategoryService
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadProducts();
  }

  loadCategories(): void {
    this.categoryService.getCategories(true).subscribe({
      next: (res) => {
        this.categories = (res?.categories || res?.data || []).filter((category: any) => category.isActive !== false);
      },
      error: (err) => console.error('Load categories error:', err),
    });
  }

  getCategoryById(id: string): any {
    return this.categories.find((category) => category._id === id);
  }

  loadProducts() {
    this.http.get<any>(`${API_BASE_URL}/product`).subscribe(data => {
      const products = data?.products || data?.data?.products || data?.data || [];
      this.products = Array.isArray(products) ? products : [];
      this.calculatePagination();
    });
  }

  getProductTitle(product: any): string {
    return this.languageService.localizeProduct(product, 'title') || 'KAHVE Product';
  }

  getProductDescription(product: any): string {
    return this.languageService.localizeProduct(product, 'description');
  }

  getProductCategory(product: any): string {
    return this.languageService.localizeProduct(product, 'category') || 'KAHVE Coffee';
  }

  getDisplayCategory(category: string): string {
    const key = String(category || '').toLowerCase().trim();
    return this.categoryDisplayMap[key] || category || 'KAHVE Coffee';
  }

  getStock(product: any): number {
    const qty = Number(product?.Quantity ?? product?.quantity ?? 0);
    return Number.isFinite(qty) && qty > 0 ? Math.floor(qty) : 0;
  }

  isOutOfStock(product: any): boolean {
    return this.getStock(product) <= 0;
  }

  calculatePagination() {
    this.totalPages = Math.ceil(this.products.length / this.pageSize);
    if (this.currentPage > this.totalPages) this.currentPage = this.totalPages || 1;
    this.updatePagedProducts();
  }

  updatePagedProducts() {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.pagedProducts = this.products.slice(startIndex, endIndex);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagedProducts();
      document.querySelector('.main-content')?.scrollTo(0, 0);
    }
  }

  openEdit(product: any): void {
    this.selectedProduct = product;
    this.selectedImageFile = null;
    this.editImagePreview = product?.image || '';
    this.editError = '';
    this.editSuccess = '';

    this.editForm = {
      code: product?.code || '',
      title: product?.title || product?.title_en || product?.title_ar || '',
      title_en: product?.title_en || product?.title || '',
      title_ar: product?.title_ar || product?.title || '',
      price: product?.price ?? '',
      Quantity: product?.Quantity ?? product?.quantity ?? 1,
      description: product?.description || product?.description_en || product?.description_ar || '',
      description_en: product?.description_en || product?.description || '',
      description_ar: product?.description_ar || product?.description || '',
      category: this.getDisplayCategory(product?.category || product?.category_en || product?.category_ar || ''),
      category_en: product?.category_en || product?.category || '',
      category_ar: product?.category_ar || product?.category || '',
      SKU: product?.SKU || product?.sku || '',
      face_shape: Array.isArray(product?.face_shape)
        ? product.face_shape.join(', ')
        : (product?.face_shape || ''),
      categoryId: String(product?.categoryId?._id || product?.categoryId || ''),
      isBestSeller: product?.isBestSeller === true,
    };

    this.isEditOpen = true;
  }

  closeEdit(): void {
    if (this.isUpdating) return;
    this.isEditOpen = false;
    this.selectedProduct = null;
    this.selectedImageFile = null;
    this.editImagePreview = '';
    this.editError = '';
    this.editSuccess = '';
  }

  onEditImageChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.editError = 'Please choose an image file only.';
      input.value = '';
      return;
    }

    this.selectedImageFile = file;
    this.editImagePreview = URL.createObjectURL(file);
    this.editError = '';
  }

  updateProduct(): void {
    if (!this.selectedProduct?._id) return;

    this.editError = '';
    this.editSuccess = '';

    if (!String(this.editForm.title_en || this.editForm.title_ar || this.editForm.title || '').trim()) {
      this.editError = 'Product name is required.';
      return;
    }

    const selectedCategory = this.getCategoryById(this.editForm.categoryId);
    if (!selectedCategory) {
      this.editError = 'Please choose a category.';
      return;
    }

    const formData = new FormData();
    formData.append('code', String(this.editForm.code || '').trim());
    formData.append('title', String(this.editForm.title_en || this.editForm.title_ar || this.editForm.title || '').trim());
    formData.append('title_en', String(this.editForm.title_en || '').trim());
    formData.append('title_ar', String(this.editForm.title_ar || '').trim());
    formData.append('price', String(this.editForm.price || 0));
    formData.append('Quantity', String(Math.max(0, Number(this.editForm.Quantity || 0))));
    formData.append('description', String(this.editForm.description_en || this.editForm.description_ar || this.editForm.description || '').trim());
    formData.append('description_en', String(this.editForm.description_en || '').trim());
    formData.append('description_ar', String(this.editForm.description_ar || '').trim());
    formData.append('categoryId', String(selectedCategory._id));
    formData.append('category', String(selectedCategory.name_en || selectedCategory.name_ar || '').trim());
    formData.append('category_en', String(selectedCategory.name_en || '').trim());
    formData.append('category_ar', String(selectedCategory.name_ar || '').trim());
    formData.append('SKU', String(this.editForm.SKU || '').trim());
    formData.append('face_shape', String(this.editForm.face_shape || '').trim());
    formData.append('isBestSeller', String(!!this.editForm.isBestSeller));

    if (this.selectedImageFile) {
      formData.append('image', this.selectedImageFile);
    }

    this.isUpdating = true;

    this.http.patch<any>(`${API_BASE_URL}/product/${this.selectedProduct._id}`, formData, {
      withCredentials: true,
    }).subscribe({
      next: (res) => {
        const updated = res?.product || res?.data || res;
        const index = this.products.findIndex((p) => p._id === this.selectedProduct._id);

        if (index !== -1) {
          this.products[index] = { ...this.products[index], ...updated };
        }

        this.calculatePagination();
        this.editSuccess = 'Product updated successfully.';

        setTimeout(() => this.closeEdit(), 700);
      },
      error: (error: HttpErrorResponse) => {
        this.editError = error?.error?.message || 'Failed to update product.';
        console.error('Update product error:', error);
      },
      complete: () => {
        this.isUpdating = false;
      }
    });
  }

  deleteProduct(id: string) {
    if (confirm('Are you sure you want to delete this product?')) {
      this.http.delete(`${API_BASE_URL}/product/${id}`, { withCredentials: true }).subscribe(() => {
        this.products = this.products.filter(p => p._id !== id);
        this.calculatePagination();
      });
    }
  }

  onStockFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] || null;
    this.stockFile = file;
    this.stockMessage = '';
    this.stockError = '';
    this.stockReport = null;

    if (file && !file.name.toLowerCase().endsWith('.csv')) {
      this.stockError = 'Please upload CSV only. You can save Excel as CSV.';
      this.stockFile = null;
      input.value = '';
    }
  }

  uploadStockSheet(): void {
    if (!this.stockFile) {
      this.stockError = 'Choose a CSV stock sheet first.';
      return;
    }

    const formData = new FormData();
    formData.append('file', this.stockFile);

    this.stockImporting = true;
    this.stockError = '';
    this.stockMessage = '';
    this.stockReport = null;

    this.http.post<any>(`${API_BASE_URL}/product/stock/import`, formData, {
      withCredentials: true,
    }).subscribe({
      next: (response) => {
        this.stockReport = response?.report || null;
        this.stockMessage = response?.message || 'Stock updated successfully.';
        this.loadProducts();
      },
      error: (error: HttpErrorResponse) => {
        this.stockError = error?.error?.message || 'Stock import failed.';
        console.error('Stock import error:', error);
      },
      complete: () => {
        this.stockImporting = false;
      },
    });
  }

  onProductImportFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] || null;
    this.productImportFile = file;
    this.productImportMessage = '';
    this.productImportError = '';
    this.productImportReport = null;

    if (!file) return;

    const name = file.name.toLowerCase();
    if (!name.endsWith('.csv') && !name.endsWith('.xlsx') && !name.endsWith('.xls')) {
      this.productImportError = 'Please upload Excel (.xlsx/.xls) or CSV only.';
      this.productImportFile = null;
      input.value = '';
    }
  }

  uploadProductsSheet(): void {
    if (!this.productImportFile) {
      this.productImportError = 'Choose an Excel or CSV products sheet first.';
      return;
    }

    const confirmMessage = this.productImportReplace
      ? 'This will delete all current products and import the sheet products. Continue?'
      : 'This will update existing products by barcode/SKU and add missing products. Continue?';

    if (!confirm(confirmMessage)) return;

    const formData = new FormData();
    formData.append('file', this.productImportFile);
    formData.append('replace', String(this.productImportReplace));

    this.productImporting = true;
    this.productImportError = '';
    this.productImportMessage = '';
    this.productImportReport = null;

    this.http.post<any>(`${API_BASE_URL}/product/import`, formData, {
      withCredentials: true,
    }).subscribe({
      next: (response) => {
        this.productImportReport = response?.report || null;
        this.productImportMessage = response?.message || 'Products imported successfully.';
        this.currentPage = 1;
        this.loadProducts();
      },
      error: (error: HttpErrorResponse) => {
        this.productImportError = error?.error?.message || 'Products import failed.';
        console.error('Products import error:', error);
      },
      complete: () => {
        this.productImporting = false;
      },
    });
  }

  downloadProductsImportTemplate(): void {
    const rows = [
      ['Barcode', 'Name EN', 'Name AR', 'Category EN', 'Category AR', 'Description EN', 'Description AR', 'Sales Price', 'Quantity On Hand', 'Best Seller'],
      ['0726529606461', 'Kahve Dark Plain Coffee 250 g', 'قهوة كافيه دارك سادة 250 جم', 'Hot Drinks', 'مشروبات ساخنة', 'Premium dark plain coffee with rich aroma.', 'قهوة دارك فاخرة برائحة غنية.', '205', '58', 'yes'],
      ['726529606492', 'Kahve Dark Spiced Coffee 250 g', 'قهوة كافيه دارك بالتحويجة 250 جم', 'Hot Drinks', 'مشروبات ساخنة', 'Dark spiced Turkish coffee blend.', 'قهوة تركية دارك بالتحويجة.', '215', '42', 'no'],
    ];

    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'kahve_products_odoo_style_template.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  downloadStockTemplate(): void {
    const rows = [
      ['code', 'SKU', 'title', 'Quantity'],
      ...this.products.map((product) => [
        product.code || '',
        product.SKU || '',
        this.getProductTitle(product) || '',
        this.getStock(product),
      ]),
    ];

    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'kahve_stock_update_template.csv';
    link.click();
    URL.revokeObjectURL(url);
  }
}
