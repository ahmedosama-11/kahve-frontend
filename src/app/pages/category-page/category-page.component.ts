import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AnalyticsService } from '../../services/analytics.service';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { CategoryUrlService } from '../../services/category-url.service';
import { FavoritesService } from '../../services/favorites.service';
import { HomeService } from '../../services/home.service';
import { LanguageService } from '../../services/language.service';
import { ProductUrlService } from '../../services/product-url.service';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-category-page',
  templateUrl: './category-page.component.html',
  styleUrls: ['../home/home.component.css', './category-page.component.css'],
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
    private homeService: HomeService,
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
        this.requestedSlug = decodeURIComponent(params.get('slug') || '').trim().toLowerCase();
        this.loadCategory();
      }),
    );

    this.subscriptions.add(
      this.languageService.language$.subscribe(() => {
        if (this.category) this.applyCategorySeo();
      }),
    );
  }

  private loadCategory(): void {
    this.loading = true;
    this.notFound = false;
    this.category = null;
    this.products = [];

    this.homeService.getHomeData().subscribe({
      next: (data: any) => {
        const allProducts = this.extractProducts(data);
        const categories = this.extractCategories(data, allProducts);
        const found = categories.find((category: any) => this.categoryUrlService.getCategorySlug(category) === this.requestedSlug);

        if (!found) {
          this.showNotFound();
          return;
        }

        this.category = found;
        this.products = allProducts.filter((product: any) => this.productBelongsToCategory(product, found));
        this.loading = false;
        this.notFound = false;
        this.applyCategorySeo();
      },
      error: (error: any) => {
        console.error('CATEGORY PAGE API ERROR:', error);
        this.showNotFound();
      },
    });
  }

  private extractProducts(data: any): any[] {
    const products = Array.isArray(data)
      ? data
      : data?.products || data?.data?.products || data?.data || data?.result || [];
    return Array.isArray(products) ? products : [];
  }

  private extractCategories(data: any, products: any[]): any[] {
    const categories = data?.categories || data?.data?.categories || [];
    if (Array.isArray(categories) && categories.length) {
      return categories.filter((category: any) => category?.isActive !== false);
    }

    const map = new Map<string, any>();
    for (const product of products) {
      const nameEn = String(product?.category_en || product?.category || product?.categoryId?.name_en || '').trim();
      const nameAr = String(product?.category_ar || product?.categoryId?.name_ar || nameEn).trim();
      if (!nameEn) continue;
      const slug = this.categoryUrlService.slugify(nameEn);
      if (!slug || map.has(slug)) continue;
      map.set(slug, {
        _id: product?.categoryId?._id || product?.categoryId || '',
        name_en: nameEn,
        name_ar: nameAr,
        name: nameEn,
      });
    }
    return Array.from(map.values());
  }

  private productBelongsToCategory(product: any, category: any): boolean {
    const categoryId = String(category?._id || '').trim();
    const productCategoryId = String(product?.categoryId?._id || product?.categoryId || '').trim();
    if (categoryId && productCategoryId && categoryId === productCategoryId) return true;

    const categorySlug = this.categoryUrlService.getCategorySlug(category);
    const candidates = [
      product?.category_en,
      product?.category,
      product?.category_ar,
      product?.categoryId?.name_en,
      product?.categoryId?.name_ar,
    ];

    return candidates.some((value) => value && this.categoryUrlService.slugify(String(value)) === categorySlug);
  }

  private showNotFound(): void {
    this.loading = false;
    this.notFound = true;
    this.category = null;
    this.products = [];
    this.seoService.setNotFound(
      this.languageService.currentLanguage === 'ar' ? 'القسم غير موجود | KAHVE' : 'Category Not Found | KAHVE',
      this.router.url,
    );
  }

  private applyCategorySeo(): void {
    if (!this.category) return;
    const name = this.getCategoryName(this.category);
    this.seoService.setCategory({
      categoryName: name,
      path: this.categoryUrlService.getCategoryPath(this.category),
      products: this.products,
      description: this.languageService.currentLanguage === 'ar'
        ? `تسوق منتجات ${name} من KAHVE في مصر. اكتشف الأسعار والتوفر واطلب أونلاين.`
        : `Shop ${name} from KAHVE Egypt. Discover prices, availability and order premium coffee online.`,
    });
  }

  getCategoryName(category: any): string {
    if (!category) return '';
    const suffix = this.languageService.currentLanguage === 'ar' ? '_ar' : '_en';
    return String(category[`name${suffix}`] || category.name || category.name_en || category.name_ar || '').trim();
  }

  getProductPath(product: any): string {
    return this.productUrlService.getProductPath(product);
  }

  getProductTitle(product: any): string {
    return this.languageService.localizeProduct(product, 'title') || 'KAHVE Product';
  }

  getProductDescription(product: any): string {
    return this.languageService.localizeProduct(product, 'description');
  }

  getProductImage(product: any): string {
    const candidates = [
      product?.image,
      product?.images?.[0],
      product?.imageUrl,
      product?.productImage,
      product?.currentProduct?.image,
      product?.currentProduct?.images?.[0],
    ];

    const image = candidates.find((value) => typeof value === 'string' && value.trim().length > 0);
    return image ? String(image).trim() : '/assets/images/kahve-products.jpg';
  }

  getProductPrice(product: any): number {
    const value = Number(product?.price ?? product?.currentProduct?.price ?? 0);
    return Number.isFinite(value) ? value : 0;
  }

  getProductCategory(product: any): string {
    return this.languageService.localizeProduct(product, 'category') || this.getCategoryName(this.category) || 'KAHVE Coffee';
  }

  getProductId(product: any): string {
    return this.productUrlService.getProductId(product);
  }

  getAvailableQuantity(product: any): number {
    const qty = Number(product?.Quantity ?? product?.quantity ?? product?.currentProduct?.Quantity ?? product?.currentProduct?.quantity ?? 0);
    return Number.isFinite(qty) && qty > 0 ? Math.floor(qty) : 0;
  }

  getSelectedQuantity(product: any): number {
    const id = this.getProductId(product);
    const available = this.getAvailableQuantity(product);
    const current = Number(this.productQuantities[id] || 1);
    return Math.max(1, Math.min(current, available || 1));
  }

  setProductQuantity(product: any, value: any): void {
    const id = this.getProductId(product);
    if (!id) return;
    const available = this.getAvailableQuantity(product) || 1;
    this.productQuantities[id] = Math.max(1, Math.min(Number(value) || 1, available));
  }

  increaseProductQuantity(product: any): void {
    this.setProductQuantity(product, this.getSelectedQuantity(product) + 1);
  }

  decreaseProductQuantity(product: any): void {
    this.setProductQuantity(product, this.getSelectedQuantity(product) - 1);
  }

  addToCart(product: any): void {
    if (!this.authService.isLoggedInValue) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.categoryUrlService.getCategoryPath(this.category) } });
      return;
    }

    const id = this.getProductId(product);
    if (!id || product.isInCart || this.addingProducts[id]) return;

    const amount = this.getSelectedQuantity(product);
    this.addingProducts[id] = true;
    this.productMessages[id] = '';

    this.cartService.addToCart({
      name: this.getProductTitle(product),
      price: this.getProductPrice(product),
      image: this.getProductImage(product),
      productId: id,
      amount,
    }).subscribe({
      next: (response: any) => {
        product.isInCart = true;
        product.cartAmount = amount;
        this.productMessages[id] = response?.message || 'Added to cart';
        window.dispatchEvent(new CustomEvent('kahve-cart-updated'));
        this.analyticsService.trackAddToCart(product, amount);
        setTimeout(() => { this.productMessages[id] = ''; }, 2500);
      },
      error: (error: any) => {
        console.error('CATEGORY ADD TO CART ERROR:', error);
        this.productMessages[id] = error?.error?.message || 'Could not add to cart';
        this.addingProducts[id] = false;
      },
      complete: () => { this.addingProducts[id] = false; },
    });
  }

  toggleFavorite(product: any): void {
    if (!this.authService.isLoggedInValue) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.categoryUrlService.getCategoryPath(this.category) } });
      return;
    }

    const id = this.getProductId(product);
    if (!id) return;

    const request = product.isFavorite
      ? this.favoritesService.deleteFavItem(id)
      : this.favoritesService.addToFavorites({
          name: this.getProductTitle(product),
          price: this.getProductPrice(product),
          image: this.getProductImage(product),
          productId: id,
        });

    request.subscribe({
      next: () => { product.isFavorite = !product.isFavorite; },
      error: (error: any) => console.error('CATEGORY FAVORITE ERROR:', error),
    });
  }

  isAddingProduct(product: any): boolean {
    return !!this.addingProducts[this.getProductId(product)];
  }

  getProductMessage(product: any): string {
    return this.productMessages[this.getProductId(product)] || '';
  }

  moneyLabel(): string {
    return this.languageService.moneyLabel();
  }

  trackByProductId(index: number, product: any): string {
    return this.getProductId(product) || String(index);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
