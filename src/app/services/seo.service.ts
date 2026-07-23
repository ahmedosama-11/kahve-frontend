import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRouteSnapshot } from '@angular/router';
import { KAHVE_CONTACT } from '../config/store-contact';
import { ProductUrlService } from './product-url.service';

export interface SeoRouteData {
  title?: string;
  description?: string;
  canonical?: string;
  image?: string;
  noindex?: boolean;
  type?: string;
}

export interface ProductSeoOptions {
  product: any;
  title: string;
  description?: string;
  category?: string;
  path: string;
}

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly siteUrl = 'https://www.kahve-egy.com';
  private readonly defaultImage = `${this.siteUrl}/assets/images/kahve-products.jpg`;

  constructor(
    private title: Title,
    private meta: Meta,
    private productUrlService: ProductUrlService,
    @Inject(DOCUMENT) private document: Document,
  ) {}

  applyRoute(snapshot: ActivatedRouteSnapshot, currentUrl: string): void {
    const data = (snapshot.data || {}) as SeoRouteData;
    const title = data.title || 'KAHVE Coffee Egypt | Premium Coffee Online';
    const description = data.description || 'Shop premium KAHVE coffee in Egypt. Discover fresh Turkish coffee, coffee blends and carefully selected products online.';
    const canonicalPath = data.canonical ?? this.cleanPath(currentUrl);
    const canonicalUrl = this.absoluteUrl(canonicalPath);
    const image = this.absoluteUrl(data.image || this.defaultImage);
    const robots = data.noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large';

    this.applyMeta({ title, description, canonicalUrl, image, robots, type: data.type || 'website' });
    this.removeStructuredData('kahve-products-schema');
    this.removeStructuredData('kahve-product-schema');
    this.removeStructuredData('kahve-product-breadcrumb-schema');
  }

  setProductList(products: any[]): void {
    if (!Array.isArray(products) || !products.length) return;

    const itemList = products.slice(0, 50).map((product, index) => {
      const name = String(product?.title_en || product?.title || product?.title_ar || 'KAHVE Product').trim();
      const description = String(product?.description_en || product?.description || product?.description_ar || '').trim();
      const image = this.absoluteUrl(product?.image || this.defaultImage);
      const available = Number(product?.Quantity ?? product?.quantity ?? 0) > 0;
      const productUrl = this.absoluteUrl(this.productUrlService.getProductPath(product));

      return {
        '@type': 'ListItem',
        position: index + 1,
        url: productUrl,
        item: {
          '@type': 'Product',
          '@id': `${productUrl}#product`,
          name,
          url: productUrl,
          image: [image],
          description,
          sku: String(product?.SKU || product?.sku || product?._id || ''),
          brand: { '@type': 'Brand', name: 'KAHVE' },
          offers: {
            '@type': 'Offer',
            priceCurrency: 'EGP',
            price: Number(product?.price || 0),
            availability: available ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            url: productUrl,
          },
        },
      };
    });

    this.setStructuredData('kahve-products-schema', {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'KAHVE Coffee Products',
      itemListElement: itemList,
    });
  }

  setProduct(options: ProductSeoOptions): void {
    const product = options.product;
    const productName = String(options.title || 'KAHVE Product').trim();
    const description = String(
      options.description ||
      `${productName} from KAHVE Egypt. View price, availability and order premium coffee online.`,
    ).trim();
    const canonicalUrl = this.absoluteUrl(options.path);
    const image = this.absoluteUrl(product?.image || this.defaultImage);
    const available = Number(product?.Quantity ?? product?.quantity ?? 0) > 0;
    const title = `${productName} | KAHVE Egypt`;
    const sku = String(product?.SKU || product?.sku || product?._id || '').trim();
    const category = String(options.category || product?.category || 'Coffee').trim();

    this.applyMeta({
      title,
      description,
      canonicalUrl,
      image,
      robots: 'index, follow, max-image-preview:large',
      type: 'product',
    });

    this.removeStructuredData('kahve-products-schema');
    this.setStructuredData('kahve-product-schema', {
      '@context': 'https://schema.org',
      '@type': 'Product',
      '@id': `${canonicalUrl}#product`,
      name: productName,
      url: canonicalUrl,
      image: [image],
      description,
      sku,
      category,
      brand: {
        '@type': 'Brand',
        name: 'KAHVE',
      },
      offers: {
        '@type': 'Offer',
        url: canonicalUrl,
        priceCurrency: 'EGP',
        price: Number(product?.price || 0),
        availability: available ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        itemCondition: 'https://schema.org/NewCondition',
      },
    });

    this.setStructuredData('kahve-product-breadcrumb-schema', {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'KAHVE',
          item: `${this.siteUrl}/home`,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: category,
          item: `${this.siteUrl}/home`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: productName,
          item: canonicalUrl,
        },
      ],
    });
  }

  setNotFound(title: string, currentUrl: string): void {
    const canonicalUrl = this.absoluteUrl(this.cleanPath(currentUrl));
    this.applyMeta({
      title,
      description: 'The requested KAHVE product could not be found.',
      canonicalUrl,
      image: this.defaultImage,
      robots: 'noindex, nofollow',
      type: 'website',
    });
    this.removeStructuredData('kahve-products-schema');
    this.removeStructuredData('kahve-product-schema');
    this.removeStructuredData('kahve-product-breadcrumb-schema');
  }

  setGlobalStructuredData(): void {
    this.setStructuredData('kahve-global-schema', {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          '@id': `${this.siteUrl}/#organization`,
          name: 'KAHVE',
          url: this.siteUrl,
          logo: `${this.siteUrl}/assets/kahve-favicon.svg`,
          contactPoint: {
            '@type': 'ContactPoint',
            telephone: KAHVE_CONTACT.phoneDisplay,
            contactType: 'customer service',
            areaServed: 'EG',
            availableLanguage: ['Arabic', 'English'],
          },
          sameAs: [KAHVE_CONTACT.instagram, KAHVE_CONTACT.facebook].filter(Boolean),
        },
        {
          '@type': 'WebSite',
          '@id': `${this.siteUrl}/#website`,
          url: this.siteUrl,
          name: 'KAHVE',
          publisher: { '@id': `${this.siteUrl}/#organization` },
          inLanguage: ['en', 'ar'],
        },
      ],
    });
  }

  private applyMeta(options: {
    title: string;
    description: string;
    canonicalUrl: string;
    image: string;
    robots: string;
    type: string;
  }): void {
    this.title.setTitle(options.title);
    this.updateName('description', options.description);
    this.updateName('robots', options.robots);
    this.updateName('googlebot', options.robots);

    this.updateProperty('og:site_name', 'KAHVE');
    this.updateProperty('og:type', options.type);
    this.updateProperty('og:title', options.title);
    this.updateProperty('og:description', options.description);
    this.updateProperty('og:url', options.canonicalUrl);
    this.updateProperty('og:image', options.image);
    this.updateProperty('og:image:alt', options.title);
    this.updateProperty('og:locale', this.document.documentElement.lang === 'ar' ? 'ar_EG' : 'en_US');

    this.updateName('twitter:card', 'summary_large_image');
    this.updateName('twitter:title', options.title);
    this.updateName('twitter:description', options.description);
    this.updateName('twitter:image', options.image);

    this.setCanonical(options.canonicalUrl);
  }

  private cleanPath(url: string): string {
    const path = String(url || '/').split('?')[0].split('#')[0];
    return path === '/welcome' ? '/' : (path || '/');
  }

  private absoluteUrl(value: string): string {
    if (/^https?:\/\//i.test(value)) return value;
    if (value.startsWith('//')) return `https:${value}`;
    const path = value.startsWith('/') ? value : `/${value}`;
    return `${this.siteUrl}${path}`;
  }

  private updateName(name: string, content: string): void {
    this.meta.updateTag({ name, content });
  }

  private updateProperty(property: string, content: string): void {
    this.meta.updateTag({ property, content });
  }

  private setCanonical(url: string): void {
    let link = this.document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.rel = 'canonical';
      this.document.head.appendChild(link);
    }
    link.href = url;
  }

  private setStructuredData(id: string, data: unknown): void {
    this.removeStructuredData(id);
    const script = this.document.createElement('script');
    script.id = id;
    script.type = 'application/ld+json';
    script.text = JSON.stringify(data);
    this.document.head.appendChild(script);
  }

  private removeStructuredData(id: string): void {
    this.document.getElementById(id)?.remove();
  }
}
