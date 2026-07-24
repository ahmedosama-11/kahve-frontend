import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CategoryUrlService {
  getCategorySlug(category: any): string {
    const name = String(
      category?.name_en ||
      category?.name ||
      category?.category_en ||
      category?.category ||
      category?.name_ar ||
      category?.category_ar ||
      'kahve-coffee',
    ).trim();

    return this.slugify(name) || 'kahve-coffee';
  }

  getCategoryPath(category: any): string {
    return `/category/${encodeURIComponent(this.getCategorySlug(category))}`;
  }

  slugify(value: string): string {
    return String(value || '')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/&/g, ' and ')
      .replace(/[^a-z0-9\u0600-\u06FF]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-{2,}/g, '-')
      .slice(0, 90);
  }
}
