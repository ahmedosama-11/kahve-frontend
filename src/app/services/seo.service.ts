import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRouteSnapshot } from '@angular/router';
import { KAHVE_CONTACT } from '../config/store-contact';

export interface SeoRouteData {
  title?: string;
  description?: string;
  canonical?: string;
  image?: string;
  noindex?: boolean;
  type?: string;
}

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly siteUrl = 'https://www.kahve-egy.com';
  private readonly defaultImage = `${this.siteUrl}/assets/images/kahve-products.jpg`;

  constructor(
    private title: Title,
    private meta: Meta,
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

    this.title.setTitle(title);
    this.updateName('description', description);
    this.updateName('robots', robots);
    this.updateName('googlebot', robots);

    this.updateProperty('og:site_name', 'KAHVE');
    this.updateProperty('og:type', data.type || 'website');
    this.updateProperty('og:title', title);
    this.updateProperty('og:description', description);
    this.updateProperty('og:url', canonicalUrl);
    this.updateProperty('og:image', image);
    this.updateProperty('og:image:alt', title);
    this.updateProperty('og:locale', document.documentElement.lang === 'ar' ? 'ar_EG' : 'en_US');

    this.updateName('twitter:card', 'summary_large_image');
    this.updateName('twitter:title', title);
    this.updateName('twitter:description', description);
    this.updateName('twitter:image', image);

    this.setCanonical(canonicalUrl);
    this.removeStructuredData('kahve-products-schema');
  }

  setProductList(products: any[]): void {
    if (!Array.isArray(products) || !products.length) return;

    const itemList = products.slice(0, 30).map((product, index) => {
      const name = String(product?.title_en || product?.title || product?.title_ar || 'KAHVE Product').trim();
      const description = String(product?.description_en || product?.description || product?.description_ar || '').trim();
      const image = this.absoluteUrl(product?.image || this.defaultImage);
      const available = Number(product?.Quantity ?? product?.quantity ?? 0) > 0;

      return {
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Product',
          name,
          image: [image],
          description,
          sku: String(product?.SKU || product?.sku || product?._id || ''),
          brand: { '@type': 'Brand', name: 'KAHVE' },
          offers: {
            '@type': 'Offer',
            priceCurrency: 'EGP',
            price: Number(product?.price || 0),
            availability: available ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            url: `${this.siteUrl}/home`,
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

  private cleanPath(url: string): string {
    const path = String(url || '/').split('?')[0].split('#')[0];
    return path === '/welcome' ? '/' : (path || '/');
  }

  private absoluteUrl(value: string): string {
    if (/^https?:\/\//i.test(value)) return value;
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
