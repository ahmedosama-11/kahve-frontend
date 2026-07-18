import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AddProductService } from '../../../services/add-product.service';
import { CategoryService } from '../../../services/category.service';

@Component({
  selector: 'app-add-product',
  templateUrl: './add-product.component.html',
  styleUrl: './add-product.component.css',
})
export class AddProductComponent implements OnInit {
  flavorNotes = [
    { label: 'Classic', value: 'Classic' },
    { label: 'Light Roast', value: 'Light Roast' },
    { label: 'Medium Roast', value: 'Medium Roast' },
    { label: 'Dark Roast', value: 'Dark Roast' },
    { label: 'Hazelnut', value: 'Hazelnut' },
    { label: 'Cardamom', value: 'Cardamom' },
  ];

  categories: any[] = [];
  categoriesLoading = false;
  categoryError = '';
  previewImage: string | ArrayBuffer | null = null;
  currentPage: string = '';
  selectedFlavorNotes: string[] = [];
  selectedFile: File | null = null;
  selectedCategoryId = '';
  isBestSeller = false;

  constructor(
    private router: Router,
    private addProductService: AddProductService,
    private categoryService: CategoryService
  ) {}

  ngOnInit() {
    this.currentPage = this.router.url.split('/')[1];
    this.loadCategories();
  }

  loadCategories(): void {
    this.categoriesLoading = true;
    this.categoryService.getCategories(true).subscribe({
      next: (res) => {
        this.categories = (res?.categories || res?.data || []).filter((category: any) => category.isActive !== false);
      },
      error: (err) => {
        this.categoryError = err?.error?.message || 'Could not load categories. Add categories from Dashboard > Categories.';
      },
      complete: () => {
        this.categoriesLoading = false;
      },
    });
  }

  getSelectedCategory(): any {
    return this.categories.find((category) => category._id === this.selectedCategoryId);
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.previewImage = URL.createObjectURL(file);
      const input = event.target;
      const label = input.nextElementSibling;
      if (label) label.innerText = file.name;
    }
  }

  onSubmit(form: any) {
    if (!form.valid || !this.selectedFile) {
      alert('Please fill in all required fields and select an image.');
      return;
    }

    const selectedCategory = this.getSelectedCategory();
    if (!selectedCategory) {
      alert('Please choose a category. You can add categories from Dashboard > Categories.');
      return;
    }

    const formData = new FormData();
    const titleEn = form.value.title_en || form.value.name_en || form.value.name || '';
    const titleAr = form.value.title_ar || form.value.name_ar || titleEn;
    const descriptionEn = form.value.description_en || form.value.description || '';
    const descriptionAr = form.value.description_ar || '';

    formData.append('code', form.value.code);
    formData.append('title', titleEn || titleAr);
    formData.append('title_en', titleEn);
    formData.append('title_ar', titleAr);
    formData.append('price', form.value.price);
    formData.append('description', descriptionEn || descriptionAr);
    formData.append('description_en', descriptionEn);
    formData.append('description_ar', descriptionAr);
    formData.append('categoryId', selectedCategory._id);
    formData.append('category', selectedCategory.name_en || selectedCategory.name_ar);
    formData.append('category_en', selectedCategory.name_en || '');
    formData.append('category_ar', selectedCategory.name_ar || '');
    formData.append('Quantity', form.value.Quantity);
    formData.append('face_shape', JSON.stringify(this.selectedFlavorNotes || []));
    formData.append('isBestSeller', String(this.isBestSeller));
    formData.append('image', this.selectedFile);

    this.addProductService.AddProduct(formData).subscribe({
      next: () => this.router.navigate(['/dashboard/view']),
      error: (err) => console.error('Error adding product:', err),
    });
  }
}
