import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AddProductService } from '../../../services/add-product.service';

@Component({
  selector: 'app-add-product',
  templateUrl: './add-product.component.html',
  styleUrl: './add-product.component.css',
})
export class AddProductComponent {
  flavorNotes = [
    { label: 'Classic', value: 'Classic' },
    { label: 'Light Roast', value: 'Light Roast' },
    { label: 'Medium Roast', value: 'Medium Roast' },
    { label: 'Dark Roast', value: 'Dark Roast' },
    { label: 'Hazelnut', value: 'Hazelnut' },
    { label: 'Cardamom', value: 'Cardamom' },
  ];

  previewImage: string | ArrayBuffer | null = null;
  currentPage: string = '';
  selectedFlavorNotes: string[] = [];
  selectedFile: File | null = null;

  constructor(
    private router: Router,
    private addProductService: AddProductService
  ) {}

  ngOnInit() {
    this.currentPage = this.router.url.split('/')[1];
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
    if (form.valid && this.selectedFile) {
      const formData = new FormData();
      const titleEn = form.value.title_en || form.value.name_en || form.value.name || '';
      const titleAr = form.value.title_ar || form.value.name_ar || titleEn;
      const descriptionEn = form.value.description_en || form.value.description || '';
      const descriptionAr = form.value.description_ar || '';
      const categoryEn = form.value.category_en || form.value.category || '';
      const categoryAr = form.value.category_ar || categoryEn;

      formData.append('code', form.value.code);
      formData.append('title', titleEn || titleAr);
      formData.append('title_en', titleEn);
      formData.append('title_ar', titleAr);
      formData.append('price', form.value.price);
      formData.append('description', descriptionEn || descriptionAr);
      formData.append('description_en', descriptionEn);
      formData.append('description_ar', descriptionAr);
      formData.append('category', categoryEn || categoryAr);
      formData.append('category_en', categoryEn);
      formData.append('category_ar', categoryAr);
      formData.append('Quantity', form.value.Quantity);
      formData.append('face_shape', JSON.stringify(form.value.flavorNotes || []));
      formData.append('image', this.selectedFile);

      this.addProductService.AddProduct(formData).subscribe({
        next: () => this.router.navigate(['/dashboard/view']),
        error: (err) => console.error('Error adding product:', err),
      });
    } else {
      alert('Please fill in all required fields and select an image.');
    }
  }
}
