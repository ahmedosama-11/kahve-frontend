import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ProductUrlService {
  getProductId(product: any): string {
    return String(product?._id || product?.id || product?.productId || product?.SKU || product?.sku || '').trim();
  }

  getProductSlug(product: any): string {
    const title = String(
      product?.title_en ||
      product?.title ||
      product?.name ||
      product?.title_ar ||
      'kahve-product',
    );

    return this.slugify(title) || 'kahve-product';
  }

  getProductPath(product: any): string {
    const id = this.getProductId(product);
    if (!id) return '/home';
    return `/product/${encodeURIComponent(id)}/${this.getProductSlug(product)}`;
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
