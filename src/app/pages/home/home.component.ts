import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { HomeService } from '../../services/home.service';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';
import { FavoritesService } from '../../services/favorites.service';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit, OnDestroy {
  showScrollBtn: boolean = false;
  products: any[] = [];
  filteredProducts: any[] = [];
  searchTerm: string = '';
  searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;
  private languageSubscription?: Subscription;

  activeFragment: string = 'newArrivals';

  currentSlide = 0;
  autoSlideInterval: any;

  productQuantities: Record<string, number> = {};
  addingProducts: Record<string, boolean> = {};
  productMessages: Record<string, string> = {};
  selectedProduct: any | null = null;

  heroSlides = [
    {
      image: '/assets/images/kahve-products.jpg',
      tagKey: 'home.hero1Tag',
      titleKey: 'home.hero1Title',
      descKey: 'home.hero1Desc',
      link1: 'home#newArrivals',
      link1TextKey: 'home.shopCoffee',
      link2: '/aboutUs',
      link2TextKey: 'home.ourStory',
    },
    {
      image: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?q=80&w=2070&auto=format&fit=crop',
      tagKey: 'home.hero2Tag',
      titleKey: 'home.hero2Title',
      descKey: 'home.hero2Desc',
      link1: 'home#TurkishCoffee',
      link1TextKey: 'home.turkishCoffee',
      link2: 'home#InstantCoffee',
      link2TextKey: 'home.instantCoffee',
    },
    {
      image: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=2071&auto=format&fit=crop',
      tagKey: 'home.hero3Tag',
      titleKey: 'home.hero3Title',
      descKey: 'home.hero3Desc',
      link1: 'home#CoffeeMixes',
      link1TextKey: 'home.coffeeMixes',
      link2: 'home#Nescafe',
      link2TextKey: 'home.nescafe',
    },
  ];

  categories: { name: string }[] = [];

  private preferredCategories: string[] = [
    'Turkish Coffee',
    'Instant Coffee',
    'Coffee Mixes',
    'Nescafe',
    'Premium Coffee',
  ];

  private categoryDisplayMap: Record<string, string> = {
    'men eye glasses': 'Turkish Coffee',
    'men sun glasses': 'Instant Coffee',
    'women eye glasses': 'Coffee Mixes',
    'women sun glasses': 'Nescafe',
    'kids glasses': 'Premium Coffee',
    'turkish coffee': 'Turkish Coffee',
    'instant coffee': 'Instant Coffee',
    'coffee mixes': 'Coffee Mixes',
    nescafe: 'Nescafe',
    'premium coffee': 'Premium Coffee',
  };

  constructor(
    private titleService: Title,
    private homeService: HomeService,
    private cartService: CartService,
    private favoritesService: FavoritesService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private location: Location,
    public languageService: LanguageService,
  ) {
    this.titleService.setTitle('KAHVE | Home');
  }

  ngOnInit(): void {
    this.loadHomeData();
    this.startAutoSlide();

    this.searchSubscription = this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((term) => {
        this.searchTerm = term;
        this.filterProducts(term);
      });

    this.route.fragment.subscribe((frag) => {
      if (frag) {
        this.activeFragment = frag;
        setTimeout(() => this.scrollToAnchor(frag), 500);
      }
    });

    this.languageSubscription = this.languageService.language$.subscribe(() => {
      this.buildCategoriesFromProducts();
      this.filterProducts(this.searchTerm);
    });
  }

  startAutoSlide(): void {
    this.autoSlideInterval = setInterval(() => {
      this.nextSlide();
    }, 5000);
  }

  nextSlide(): void {
    this.currentSlide = (this.currentSlide + 1) % this.heroSlides.length;
  }

  setSlide(index: number): void {
    this.currentSlide = index;
    clearInterval(this.autoSlideInterval);
    this.startAutoSlide();
  }

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    if (this.searchTerm.trim() !== '') return;

    const sections = [
      'newArrivals',
      ...this.categories.map((category) => this.getCategoryId(category.name)),
    ];
    const scrollPosition = window.pageYOffset + 150;

    for (const section of sections) {
      const element = document.getElementById(section);
      if (element) {
        const offset = element.offsetTop;
        const height = element.offsetHeight;
        if (scrollPosition >= offset && scrollPosition < offset + height) {
          if (this.activeFragment !== section) {
            this.activeFragment = section;
            this.location.replaceState(`/home#${section}`);
          }
          break;
        }
      }
    }

    this.showScrollBtn = window.pageYOffset > 400;
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent): void {
    if (this.selectedProduct) {
      event.preventDefault();
      this.closeProductModal();
    }
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  scrollToAnchor(frag: string): void {
    const element = document.getElementById(frag);
    if (element) element.scrollIntoView({ behavior: 'smooth' });
  }

  loadHomeData(): void {
    this.homeService.getHomeData().subscribe({
      next: (data: any) => {
        console.log('HOME RESPONSE:', data);

        const products = Array.isArray(data)
          ? data
          : data?.products ||
            data?.data?.products ||
            data?.data ||
            data?.result ||
            [];

        this.products = Array.isArray(products) ? products : [];
        this.filteredProducts = [...this.products];
        this.buildCategoriesFromProducts();

        console.log('PRODUCTS LOADED:', this.products);
        console.log('CATEGORIES LOADED:', this.categories);
      },
      error: (error: HttpErrorResponse) => console.error('HOME API ERROR:', error),
    });
  }

  buildCategoriesFromProducts(): void {
    const categorySet = new Set<string>();

    this.products.forEach((product: any) => {
      const displayCategory = this.getDisplayCategory(this.getProductCategory(product)).trim();
      if (displayCategory) categorySet.add(displayCategory);
    });

    const orderedCategories = [
      ...this.preferredCategories.filter((category) => categorySet.has(category)),
      ...Array.from(categorySet).filter((category) => !this.preferredCategories.includes(category)).sort(),
    ];

    this.categories = orderedCategories.map((name) => ({ name }));
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

  getDisplayCategory(category: string): string {
    const key = String(category || '').toLowerCase().trim();
    return this.categoryDisplayMap[key] || category || 'KAHVE Coffee';
  }

  getCategoryId(categoryName: string): string {
    return String(categoryName || '')
      .replace(/\s+/g, '')
      .replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '');
  }

  onSearchChange(event: any): void {
    this.searchSubject.next(event.target.value);
  }

  filterProducts(term: string): void {
    const searchValue = term.toLowerCase().trim();

    if (!searchValue) {
      this.filteredProducts = [...this.products];
      return;
    }

    this.filteredProducts = this.products.filter((product: any) => {
      const title = String(this.getProductTitle(product) || '').toLowerCase();
      const description = String(this.getProductDescription(product) || '').toLowerCase();
      const originalCategory = String(this.getProductCategory(product) || product.category || '').toLowerCase();
      const displayCategory = this.getDisplayCategory(this.getProductCategory(product)).toLowerCase();

      return (
        title.includes(searchValue) ||
        description.includes(searchValue) ||
        originalCategory.includes(searchValue) ||
        displayCategory.includes(searchValue)
      );
    });
  }

  addToCart(product: any): void {
    if (!this.authService.isLoggedInValue) {
      this.router.navigate(['/login']);
      return;
    }

    const productId = this.getProductId(product);
    if (!productId || product.isInCart || this.addingProducts[productId]) return;

    const amount = this.getSelectedQuantity(product);
    this.addingProducts[productId] = true;
    this.productMessages[productId] = '';

    this.cartService
      .addToCart({
        name: this.getProductTitle(product),
        price: Number(product.price || 0),
        image: product.image,
        productId,
        amount,
      } as any)
      .subscribe({
        next: (response: any) => {
          product.isInCart = true;
          product.cartAmount = amount;
          this.productMessages[productId] = response?.message || `Added ${amount} item${amount > 1 ? 's' : ''} to cart`;
          window.dispatchEvent(new CustomEvent('kahve-cart-updated'));

          setTimeout(() => {
            this.productMessages[productId] = '';
          }, 2500);
        },
        error: (error) => {
          console.error('ADD TO CART ERROR:', error);
          this.productMessages[productId] = error?.error?.message || 'Could not add to cart';
        },
        complete: () => {
          this.addingProducts[productId] = false;
        },
      });
  }

  getProductId(product: any): string {
    return String(product?._id || product?.id || product?.productId || '');
  }

  getAvailableQuantity(product: any): number {
    const qty = Number(product?.Quantity ?? product?.quantity ?? 999);
    return Number.isFinite(qty) && qty > 0 ? qty : 0;
  }

  getSelectedQuantity(product: any): number {
    const productId = this.getProductId(product);
    const available = this.getAvailableQuantity(product);
    const current = Number(this.productQuantities[productId] || 1);
    if (!available) return 1;
    return Math.max(1, Math.min(current, available));
  }

  setProductQuantity(product: any, value: any): void {
    const productId = this.getProductId(product);
    if (!productId) return;

    const available = this.getAvailableQuantity(product) || 999;
    const amount = Math.max(1, Math.min(Number(value) || 1, available));
    this.productQuantities[productId] = amount;
  }

  increaseProductQuantity(product: any): void {
    this.setProductQuantity(product, this.getSelectedQuantity(product) + 1);
  }

  decreaseProductQuantity(product: any): void {
    this.setProductQuantity(product, this.getSelectedQuantity(product) - 1);
  }

  isAddingProduct(product: any): boolean {
    return !!this.addingProducts[this.getProductId(product)];
  }

  getProductMessage(product: any): string {
    return this.productMessages[this.getProductId(product)] || '';
  }

  toggleFavorite(product: any): void {
    if (!this.authService.isLoggedInValue) {
      this.router.navigate(['/login']);
      return;
    }
    if (product.isFavorite) {
      this.favoritesService
        .deleteFavItem(product._id)
        .subscribe({
          next: () => (product.isFavorite = false),
          error: (error) => console.error('REMOVE FAVORITE ERROR:', error),
        });
    } else {
      this.favoritesService
        .addToFavorites({
          name: this.getProductTitle(product),
          price: product.price,
          image: product.image,
          productId: product._id,
        })
        .subscribe({
          next: () => (product.isFavorite = true),
          error: (error) => console.error('ADD FAVORITE ERROR:', error),
        });
    }
  }

  getProductsByCategory(categoryName: string): any[] {
    const wanted = String(categoryName || '').toLowerCase().trim();

    return this.filteredProducts.filter((product: any) => {
      const displayCategory = this.getDisplayCategory(this.getProductCategory(product)).toLowerCase().trim();
      return displayCategory === wanted;
    });
  }

  openProductModal(product: any): void {
    this.selectedProduct = product;
    document.body.classList.add('kahve-modal-open');
    document.body.style.overflow = 'hidden';
  }

  closeProductModal(): void {
    this.selectedProduct = null;
    document.body.classList.remove('kahve-modal-open');
    document.body.style.overflow = '';
  }

  getProductSku(product: any): string {
    return String(product?.SKU || product?.sku || product?.code || product?.barcode || '').trim();
  }

  moneyLabel(): string {
    return this.languageService.moneyLabel();
  }

  trackByProductId(index: number, product: any): string {
    return product?._id || product?.id || String(index);
  }

  ngOnDestroy(): void {
    if (this.autoSlideInterval) clearInterval(this.autoSlideInterval);
    this.searchSubscription?.unsubscribe();
    this.languageSubscription?.unsubscribe();
    document.body.classList.remove('kahve-modal-open');
    document.body.style.overflow = '';
  }
}
