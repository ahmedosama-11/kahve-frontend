import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ImageOptimizationService {
  private readonly optimizedCache = new Map<string, string>();
  private readonly srcsetCache = new Map<string, string>();

  optimize(url: string, width: number, height?: number): string {
    const source = String(url || '').trim();
    if (!source || !Number.isFinite(width) || width <= 0) return source;

    const cacheKey = `${source}|${width}|${height || 0}`;
    const cached = this.optimizedCache.get(cacheKey);
    if (cached) return cached;

    const optimized =
      this.optimizeCloudinary(source, width, height) ||
      this.optimizeUnsplash(source, width, height) ||
      this.optimizeLocalAsset(source, width) ||
      source;

    this.optimizedCache.set(cacheKey, optimized);
    return optimized;
  }

  srcset(url: string, widths: number[], heightRatio?: number): string {
    const source = String(url || '').trim();
    const cleanWidths = Array.from(
      new Set((widths || []).map((value) => Math.round(Number(value))).filter((value) => value > 0)),
    ).sort((a, b) => a - b);

    if (!source || !cleanWidths.length || !this.canGenerateResponsiveUrl(source)) return '';

    const cacheKey = `${source}|${cleanWidths.join(',')}|${heightRatio || 0}`;
    const cached = this.srcsetCache.get(cacheKey);
    if (cached) return cached;

    const value = cleanWidths
      .map((width) => {
        const height = heightRatio ? Math.round(width * heightRatio) : undefined;
        return `${this.optimize(source, width, height)} ${width}w`;
      })
      .join(', ');

    this.srcsetCache.set(cacheKey, value);
    return value;
  }

  private canGenerateResponsiveUrl(url: string): boolean {
    return (
      /res\.cloudinary\.com/i.test(url) ||
      /images\.unsplash\.com/i.test(url) ||
      /\/assets\/images\/kahve-products(?:-hero)?(?:\.webp|\.jpg)$/i.test(url)
    );
  }

  private optimizeCloudinary(url: string, width: number, height?: number): string {
    if (!/res\.cloudinary\.com/i.test(url) || !url.includes('/image/upload/')) return '';

    const heightPart = height ? `,h_${height}` : '';
    const transformation = `f_auto,q_auto:eco,c_limit,w_${width}${heightPart}`;
    return url.replace('/image/upload/', `/image/upload/${transformation}/`);
  }

  private optimizeUnsplash(url: string, width: number, height?: number): string {
    if (!/images\.unsplash\.com/i.test(url)) return '';

    try {
      const parsed = new URL(url);
      parsed.searchParams.set('auto', 'format');
      parsed.searchParams.set('fit', 'crop');
      parsed.searchParams.set('q', '70');
      parsed.searchParams.set('w', String(width));
      if (height) parsed.searchParams.set('h', String(height));
      return parsed.toString();
    } catch {
      return '';
    }
  }

  private optimizeLocalAsset(url: string, width: number): string {
    const normalized = url.split('?')[0];

    if (/\/assets\/images\/kahve-products-hero(?:\.webp|\.jpg)$/i.test(normalized)) {
      const selected = width <= 640 ? 640 : width <= 960 ? 960 : 1440;
      return `/assets/images/kahve-products-hero-${selected}.webp`;
    }

    if (/\/assets\/images\/kahve-products(?:\.webp|\.jpg)$/i.test(normalized)) {
      const selected = width <= 480 ? 480 : width <= 800 ? 800 : 1200;
      return `/assets/images/kahve-products-${selected}.webp`;
    }

    return '';
  }
}
