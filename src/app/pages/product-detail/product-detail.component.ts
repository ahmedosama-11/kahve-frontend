import { Component, OnDestroy, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AnalyticsService } from '../../services/analytics.service';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { FavoritesService } from '../../services/favorites.service';
import { HomeService } from '../../services/home.service';
import { LanguageService } from '../../services/language.service';
import { ProductUrlService } from '../../services/product-url.service';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.css'],
})
export class ProductDetailComponent implements OnInit, OnDestroy {
  product: any | null = null;
  loading = true;
  notFound = false;
  quantity = 1;
  adding = false;
  favoriteBusy = false;
  message = '';

  private requestedProductId = '';
  private readonly subscriptions = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private homeService: HomeService,
    private cartService: CartService,
    private favoritesService: FavoritesService,
    private authService: AuthService,
    public languageService: LanguageService,
    private productUrlService: ProductUrlService,
    private seoService: SeoService,
    private analyticsService: AnalyticsService,
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.route.paramMap.subscribe((params: ParamMap) => {
        this.requestedProductId = decodeURIComponent(params.get('id') || '').trim();
        this.loadProduct();
      }),
    );

    this.subscriptions.add(
      this.languageService.language$.subscribe(() => {
        if (this.product) this.applyProductSeo();
      }),
    );
  }

  private loadProduct(): void {
    this.loading = true;
    this.notFound = false;
    this.message = '';

    this.homeService.getHomeData().subscribe({
      next: (data: any) => {
        const products = this.extractProducts(data);
        const found = products.find((item: any) => this.productUrlService.getProductId(item) === this.requestedProductId);

        if (!found) {
          this.showNotFound();
          return;
        }

        this.product = found;
        this.quantity = 1;
        this.loading = false;
        this.notFound = false;

        const canonicalPath = this.productUrlService.getProductPath(found);
        if (this.cleanCurrentPath() !== canonicalPath) this.location.replaceState(canonicalPath);

        this.applyProductSeo();
        this.analyticsService.trackViewItem(found);
      },
      error: (error: any) => {
        console.error('PRODUCT DETAILS API ERROR:', error);
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

  private showNotFound(): void {
    this.loading = false;
    this.product = null;
    this.notFound = true;
    this.seoService.setNotFound(
      this.languageService.currentLanguage === 'ar' ? 'المنتج غير موجود | KAHVE' : 'Product Not Found | KAHVE',
      this.router.url,
    );
  }

  private applyProductSeo(): void {
    if (!this.product) return;

    this.seoService.setProduct({
      product: this.product,
      title: this.getProductTitle(this.product),
      description: this.getProductDescription(this.product),
      category: this.getProductCategory(this.product),
      path: this.productUrlService.getProductPath(this.product),
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

  getAvailableQuantity(product: any): number {
    const quantity = Number(product?.Quantity ?? product?.quantity ?? 0);
    return Number.isFinite(quantity) && quantity > 0 ? Math.floor(quantity) : 0;
  }

  getProductSku(product: any): string {
    return String(product?.SKU || product?.sku || product?.code || product?.barcode || '').trim();
  }

  decreaseQuantity(): void {
    this.quantity = Math.max(1, this.quantity - 1);
  }

  increaseQuantity(): void {
    const available = this.getAvailableQuantity(this.product);
    this.quantity = Math.min(available || 1, this.quantity + 1);
  }

  setQuantity(value: any): void {
    const available = this.getAvailableQuantity(this.product) || 1;
    this.quantity = Math.max(1, Math.min(Number(value) || 1, available));
  }

  addToCart(): void {
    const product = this.product;
    if (!product || this.adding || product.isInCart) return;

    if (!this.authService.isLoggedInValue) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.productUrlService.getProductPath(product) } });
      return;
    }

    const productId = this.productUrlService.getProductId(product);
    if (!productId) return;

    this.adding = true;
    this.message = '';

    this.cartService.addToCart({
      name: this.getProductTitle(product),
      price: Number(product.price || 0),
      image: product.image,
      productId,
      amount: this.quantity,
    }).subscribe({
      next: (response: any) => {
        product.isInCart = true;
        product.cartAmount = this.quantity;
        this.message = response?.message || this.languageService.translate('product.addedMessage');
        window.dispatchEvent(new CustomEvent('kahve-cart-updated'));
        this.analyticsService.trackAddToCart(product, this.quantity);
      },
      error: (error: any) => {
        console.error('PRODUCT DETAILS ADD TO CART ERROR:', error);
        this.message = error?.error?.message || this.languageService.translate('product.addError');
        this.adding = false;
      },
      complete: () => {
        this.adding = false;
      },
    });
  }

  toggleFavorite(): void {
    const product = this.product;
    if (!product || this.favoriteBusy) return;

    if (!this.authService.isLoggedInValue) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.productUrlService.getProductPath(product) } });
      return;
    }

    const productId = this.productUrlService.getProductId(product);
    if (!productId) return;

    this.favoriteBusy = true;
    const request = product.isFavorite
      ? this.favoritesService.deleteFavItem(productId)
      : this.favoritesService.addToFavorites({
          name: this.getProductTitle(product),
          price: Number(product.price || 0),
          image: product.image,
          productId,
        });

    request.subscribe({
      next: () => {
        product.isFavorite = !product.isFavorite;
      },
      error: (error: any) => {
        console.error('PRODUCT DETAILS FAVORITE ERROR:', error);
        this.favoriteBusy = false;
      },
      complete: () => {
        this.favoriteBusy = false;
      },
    });
  }

  moneyLabel(): string {
    return this.languageService.moneyLabel();
  }

  private cleanCurrentPath(): string {
    return String(this.router.url || '').split('?')[0].split('#')[0];
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
