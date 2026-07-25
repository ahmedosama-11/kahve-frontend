import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { API_BASE_URL } from '../../config/api.config';
import { AnalyticsService } from '../../services/analytics.service';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { CategoryUrlService } from '../../services/category-url.service';
import { FavoritesService } from '../../services/favorites.service';
import { LanguageService } from '../../services/language.service';
import { ProductUrlService } from '../../services/product-url.service';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-category-page',
  templateUrl: './category-page.component.html',
  styleUrls: ['./category-page.component.css'],
})
export class CategoryPageComponent implements OnInit, OnDestroy {
  category: any | null = null;
  products: any[] = [];

  loading = true;
  notFound = false;
  requestedSlug = '';

  productQuantities: Record<string, number> = {};
  addingProducts: Record<string, boolean> = {};
  productMessages: Record<string, string> = {};

  private readonly subscriptions = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private cartService: CartService,
    private favoritesService: FavoritesService,
    private authService: AuthService,
    public languageService: LanguageService,
    private productUrlService: ProductUrlService,
    private categoryUrlService: CategoryUrlService,
    private seoService: SeoService,
    private analyticsService: AnalyticsService,
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.route.paramMap.subscribe((params: ParamMap) => {
        this.requestedSlug = this.normalizeSlug(
          decodeURIComponent(params.get('slug') || '')
        );

        this.loadCategory();
      })
    );

    this.subscriptions.add(
      this.languageService.language$.subscribe(() => {
        if (this.category) {
          this.applyCategorySeo();
        }
      })
    );
  }

  private loadCategory(): void {
    this.loading = true;
    this.notFound = false;
    this.category = null;
    this.products = [];

    if (!this.requestedSlug) {
      this.showNotFound();
      return;
    }

    /*
     * مهم:
     * نستخدم /home الموجود أصلًا في الباك.
     * لا نستخدم /categories/slug/... نهائيًا.
     */
    this.http.get<any>(`${API_BASE_URL}/home`).subscribe({
      next: (response: any) => {
        const allProducts = this.extractProducts(response);
        const allCategories = this.extractCategories(response);

        let matchedCategory =
          allCategories.find((category: any) =>
            this.categoryMatchesSlug(category, this.requestedSlug)
          ) || null;

        let matchedProducts = allProducts.filter((product: any) =>
          this.productMatchesCategory(
            product,
            this.requestedSlug,
            matchedCategory
          )
        );

        /*
         * لو /home مش بيرجع categories كـ array منفصلة،
         * نبني الـcategory من product.category نفسه.
         */
        if (!matchedCategory && matchedProducts.length > 0) {
          matchedCategory = this.buildCategoryFromProduct(
            matchedProducts[0]
          );
        }

        /*
         * محاولة إضافية:
         * بعض المنتجات ممكن يكون category داخل currentProduct/product.
         */
        if (!matchedCategory) {
          const matchingProduct = allProducts.find((product: any) => {
            const values = this.getProductCategoryValues(product);

            return values.some(
              (value: any) =>
                this.normalizeSlug(this.categoryValueToName(value)) ===
                this.requestedSlug
            );
          });

          if (matchingProduct) {
            matchedCategory =
              this.buildCategoryFromProduct(matchingProduct);

            matchedProducts = allProducts.filter((product: any) =>
              this.productMatchesCategory(
                product,
                this.requestedSlug,
                matchedCategory
              )
            );
          }
        }

        if (!matchedCategory) {
          console.warn(
            'CATEGORY NOT FOUND FROM /home:',
            this.requestedSlug,
            response
          );

          this.showNotFound();
          return;
        }

        this.category = matchedCategory;
        this.products = matchedProducts;

        this.loading = false;
        this.notFound = false;

        this.applyCategorySeo();
      },

      error: (error: any) => {
        console.error('CATEGORY /home API ERROR:', error);
        this.showNotFound();
      },
    });
  }

  private extractProducts(response: any): any[] {
    const candidates = [
      response?.products,
      response?.data?.products,
      response?.data?.data?.products,
      response?.home?.products,
      response?.data?.home?.products,
    ];

    for (const candidate of candidates) {
      if (Array.isArray(candidate)) {
        return candidate;
      }
    }

    if (Array.isArray(response?.data)) {
      return response.data;
    }

    if (Array.isArray(response)) {
      return response;
    }

    return [];
  }

  private extractCategories(response: any): any[] {
    const candidates = [
      response?.categories,
      response?.data?.categories,
      response?.data?.data?.categories,
      response?.home?.categories,
      response?.data?.home?.categories,
    ];

    for (const candidate of candidates) {
      if (Array.isArray(candidate)) {
        return candidate;
      }
    }

    return [];
  }

  private normalizeSlug(value: any): string {
    return String(value ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase()
      .replace(/&/g, ' and ')
      .replace(/[^a-z0-9\u0600-\u06ff]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private categoryMatchesSlug(category: any, slug: string): boolean {
    if (!category) return false;

    const values = [
      category?.slug,
      category?.name,
      category?.name_en,
      category?.name_ar,
      category?.title,
      category?.title_en,
      category?.title_ar,
    ];

    return values.some(
      (value) =>
        value !== undefined &&
        value !== null &&
        this.normalizeSlug(value) === slug
    );
  }

  private getProductCategoryValues(product: any): any[] {
    return [
      product?.category,
      product?.Category,
      product?.categoryName,
      product?.category_name,
      product?.categorySlug,
      product?.category_slug,

      product?.currentProduct?.category,
      product?.currentProduct?.Category,
      product?.currentProduct?.categoryName,

      product?.product?.category,
      product?.product?.Category,
      product?.product?.categoryName,
    ].filter(
      (value) =>
        value !== undefined &&
        value !== null &&
        value !== ''
    );
  }

  private categoryValueToName(value: any): string {
    if (typeof value === 'string' || typeof value === 'number') {
      return String(value);
    }

    if (typeof value === 'object' && value) {
      return String(
        value.slug ||
          value.name_en ||
          value.name ||
          value.name_ar ||
          value.title ||
          ''
      );
    }

    return '';
  }

  private productMatchesCategory(
    product: any,
    slug: string,
    category?: any
  ): boolean {
    const values = this.getProductCategoryValues(product);

    const matchesByName = values.some((value: any) => {
      if (typeof value === 'object' && value) {
        return [
          value?.slug,
          value?.name,
          value?.name_en,
          value?.name_ar,
          value?.title,
        ].some(
          (item) =>
            item !== undefined &&
            this.normalizeSlug(item) === slug
        );
      }

      return this.normalizeSlug(value) === slug;
    });

    if (matchesByName) {
      return true;
    }

    /*
     * دعم حالة إن المنتج مخزن category ID بدل الاسم.
     */
    if (category) {
      const categoryId = String(
        category?._id || category?.id || ''
      );

      if (categoryId) {
        return values.some((value: any) => {
          if (typeof value === 'object' && value) {
            return String(value?._id || value?.id || '') === categoryId;
          }

          return String(value) === categoryId;
        });
      }
    }

    return false;
  }

  private buildCategoryFromProduct(product: any): any | null {
    const values = this.getProductCategoryValues(product);

    for (const value of values) {
      if (typeof value === 'object' && value) {
        if (
          this.categoryMatchesSlug(value, this.requestedSlug)
        ) {
          return value;
        }
      } else {
        const name = String(value || '').trim();

        if (
          name &&
          this.normalizeSlug(name) === this.requestedSlug
        ) {
          return {
            name,
            name_en: name,
            name_ar: name,
            slug: this.requestedSlug,
          };
        }
      }
    }

    return null;
  }

  private showNotFound(): void {
    this.loading = false;
    this.notFound = true;
    this.category = null;
    this.products = [];

    this.seoService.setNotFound(
      this.languageService.currentLanguage === 'ar'
        ? 'القسم غير موجود | KAHVE'
        : 'Category Not Found | KAHVE',
      this.router.url
    );
  }

  private applyCategorySeo(): void {
    if (!this.category) return;

    const name = this.getCategoryName(this.category);

    this.seoService.setCategory({
      categoryName: name,
      path: this.categoryUrlService.getCategoryPath(this.category),
      products: this.products,
      description:
        this.languageService.currentLanguage === 'ar'
          ? `تسوق منتجات ${name} من KAHVE في مصر. اكتشف الأسعار والتوفر واطلب أونلاين.`
          : `Shop ${name} from KAHVE Egypt. Discover prices, availability and order premium coffee online.`,
    });
  }

  getCategoryName(category: any): string {
    if (!category) return '';

    return String(
      this.languageService.currentLanguage === 'ar'
        ? category.name_ar ||
            category.name_en ||
            category.name ||
            category.title ||
            ''
        : category.name_en ||
            category.name_ar ||
            category.name ||
            category.title ||
            ''
    ).trim();
  }

  getProductPath(product: any): string {
    return this.productUrlService.getProductPath(
      product?.currentProduct || product?.product || product
    );
  }

  getProductTitle(product: any): string {
    const source =
      product?.currentProduct || product?.product || product;

    return (
      this.languageService.localizeProduct(source, 'title') ||
      source?.title ||
      source?.name ||
      'KAHVE Product'
    );
  }

  getProductDescription(product: any): string {
    const source =
      product?.currentProduct || product?.product || product;

    return this.languageService.localizeProduct(
      source,
      'description'
    );
  }

  getProductImage(product: any): string {
    const source =
      product?.currentProduct || product?.product || product;

    const candidates = [
      source?.image,
      source?.images?.[0],
      source?.imageUrl,
      source?.productImage,
      product?.image,
    ];

    const image = candidates.find(
      (value) =>
        typeof value === 'string' &&
        value.trim().length > 0
    );

    return image
      ? String(image).trim()
      : '/assets/images/kahve-products.jpg';
  }

  getProductPrice(product: any): number {
    const source =
      product?.currentProduct || product?.product || product;

    const value = Number(source?.price ?? product?.price ?? 0);

    return Number.isFinite(value) ? value : 0;
  }

  getProductCategory(product: any): string {
    const source =
      product?.currentProduct || product?.product || product;

    const localized =
      this.languageService.localizeProduct(
        source,
        'category'
      );

    return (
      localized ||
      this.categoryValueToName(source?.category) ||
      this.getCategoryName(this.category) ||
      'KAHVE Coffee'
    );
  }

  getProductId(product: any): string {
    return this.productUrlService.getProductId(
      product?.currentProduct || product?.product || product
    );
  }

  getAvailableQuantity(product: any): number {
    const source =
      product?.currentProduct || product?.product || product;

    const qty = Number(
      source?.Quantity ??
        source?.quantity ??
        product?.Quantity ??
        product?.quantity ??
        0
    );

    return Number.isFinite(qty) && qty > 0
      ? Math.floor(qty)
      : 0;
  }

  getSelectedQuantity(product: any): number {
    const id = this.getProductId(product);
    const available = this.getAvailableQuantity(product);
    const current = Number(this.productQuantities[id] || 1);

    return Math.max(
      1,
      Math.min(current, available || 1)
    );
  }

  setProductQuantity(product: any, value: any): void {
    const id = this.getProductId(product);

    if (!id) return;

    const available =
      this.getAvailableQuantity(product) || 1;

    this.productQuantities[id] = Math.max(
      1,
      Math.min(Number(value) || 1, available)
    );
  }

  increaseProductQuantity(product: any): void {
    this.setProductQuantity(
      product,
      this.getSelectedQuantity(product) + 1
    );
  }

  decreaseProductQuantity(product: any): void {
    this.setProductQuantity(
      product,
      this.getSelectedQuantity(product) - 1
    );
  }

  addToCart(product: any): void {
    if (!this.authService.isLoggedInValue) {
      this.router.navigate(['/login'], {
        queryParams: {
          returnUrl:
            this.categoryUrlService.getCategoryPath(
              this.category
            ),
        },
      });

      return;
    }

    const id = this.getProductId(product);

    if (
      !id ||
      product?.isInCart ||
      this.addingProducts[id]
    ) {
      return;
    }

    const amount =
      this.getSelectedQuantity(product);

    this.addingProducts[id] = true;
    this.productMessages[id] = '';

    this.cartService
      .addToCart({
        name: this.getProductTitle(product),
        price: this.getProductPrice(product),
        image: this.getProductImage(product),
        productId: id,
        amount,
      })
      .subscribe({
        next: (response: any) => {
          product.isInCart = true;
          product.cartAmount = amount;

          this.productMessages[id] =
            response?.message || 'Added to cart';

          window.dispatchEvent(
            new CustomEvent('kahve-cart-updated')
          );

          this.analyticsService.trackAddToCart(
            product,
            amount
          );

          setTimeout(() => {
            this.productMessages[id] = '';
          }, 2500);
        },

        error: (error: any) => {
          console.error(
            'CATEGORY ADD TO CART ERROR:',
            error
          );

          this.productMessages[id] =
            error?.error?.message ||
            'Could not add to cart';

          this.addingProducts[id] = false;
        },

        complete: () => {
          this.addingProducts[id] = false;
        },
      });
  }

  toggleFavorite(product: any): void {
    if (!this.authService.isLoggedInValue) {
      this.router.navigate(['/login'], {
        queryParams: {
          returnUrl:
            this.categoryUrlService.getCategoryPath(
              this.category
            ),
        },
      });

      return;
    }

    const id = this.getProductId(product);

    if (!id) return;

    const request = product?.isFavorite
      ? this.favoritesService.deleteFavItem(id)
      : this.favoritesService.addToFavorites({
          name: this.getProductTitle(product),
          price: this.getProductPrice(product),
          image: this.getProductImage(product),
          productId: id,
        });

    request.subscribe({
      next: () => {
        product.isFavorite = !product.isFavorite;
      },

      error: (error: any) =>
        console.error(
          'CATEGORY FAVORITE ERROR:',
          error
        ),
    });
  }

  isAddingProduct(product: any): boolean {
    return !!this.addingProducts[
      this.getProductId(product)
    ];
  }

  getProductMessage(product: any): string {
    return (
      this.productMessages[
        this.getProductId(product)
      ] || ''
    );
  }

  moneyLabel(): string {
    return this.languageService.moneyLabel();
  }

  onImageError(event: Event): void {
    const image =
      event.target as HTMLImageElement | null;

    if (image) {
      image.src =
        '/assets/images/kahve-products.jpg';
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}