import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { Subscription, forkJoin } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { FavoritesService } from '../../../services/favorites.service';
import { CartService } from '../../../services/cart.service';
import { LanguageService } from '../../../services/language.service';

@Component({
  selector: 'app-home-nav',
  templateUrl: './home-nav.component.html',
  styleUrls: ['./home-nav.component.css']
})
export class HomeNavComponent implements OnInit, OnDestroy {
  isLoggedIn: boolean = false;
  isAdmin: boolean = false;
  isMenuOpen: boolean = false;
  isNavOpen: boolean = false;

  cartCount: number = 0;

  isFavOpen: boolean = false;
  favorites: any[] = [];
  favLoading: boolean = false;
  favError: string = '';

  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private favoritesService: FavoritesService,
    private cartService: CartService,
    public languageService: LanguageService
  ) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.authService.isLoggedIn$.subscribe(status => {
        this.isLoggedIn = status;

        if (status) {
          this.cartService.refreshCartCount();
        } else {
          this.cartService.clearLocalCartCount();
          this.favorites = [];
        }
      })
    );

    this.subscriptions.push(
      this.authService.isAdmin$.subscribe(status => this.isAdmin = status)
    );

    this.subscriptions.push(
      this.cartService.cartCount$.subscribe(count => this.cartCount = count)
    );

  }

  toggleFavorites(event?: Event): void {
    event?.stopPropagation();
    this.isFavOpen = !this.isFavOpen;
    if (this.isFavOpen) {
      this.isNavOpen = false;
      this.loadFavorites();
    }
  }

  toggleNav(): void {
    this.isNavOpen = !this.isNavOpen;
    if (this.isNavOpen) {
      this.isFavOpen = false;
    }
  }

  closeNav(): void {
    this.isNavOpen = false;
    this.isMenuOpen = false;
  }

  closeAllPanels(): void {
    this.closeNav();
    this.isFavOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as Element | null;
    if (!target) return;

    if (this.isFavOpen && !target.closest('.fav-wrapper')) {
      this.isFavOpen = false;
    }

    if (this.isNavOpen && !target.closest('.kahve-navbar')) {
      this.closeNav();
    }
  }

  loadFavorites(): void {
    this.favLoading = true;
    this.favError = '';

    forkJoin({
      favs: this.favoritesService.getUserFav(),
      cart: this.cartService.getUserCart()
    }).subscribe({
      next: (result: any) => {
        const cartItemsRaw = result?.cart?.items || result?.cart?.data || result?.cart?.cart || [];
        const cartItems = Array.isArray(cartItemsRaw) ? cartItemsRaw : [];
        const favItems = Array.isArray(result.favs) ? result.favs : (result.favs.favorites || result.favs.data || []);

        this.favorites = favItems.map((f: any) => {
          const cartEntry = cartItems.find((c: any) => {
            const cartProductId = c?.productId?._id || c?.productId || c?.currentProduct?._id || '';
            return String(cartProductId) === String(f.productId);
          });
          return {
            ...f,
            isInCart: !!cartEntry,
            cartId: cartEntry ? cartEntry._id : null,
            cartAmount: cartEntry ? Number(cartEntry.amount || 1) : 0
          };
        });

        this.favLoading = false;
      },
      error: (err) => {
        console.error('Sync error:', err);
        this.favError = this.languageService.translate('common.error');
        this.favLoading = false;
      }
    });
  }

  removeFromFavorites(productId: string): void {
    this.favoritesService.deleteFavItem(productId).subscribe({
      next: () => {
        this.favorites = this.favorites.filter(f => String(f.productId) !== String(productId));
      },
      error: () => {
        this.favError = this.languageService.translate('common.error');
      }
    });
  }

  handleAddToCart(item: any): void {
    const productData = {
      name: item.name,
      price: item.price,
      image: this.getFavoriteImage(item),
      productId: item.productId,
      amount: 1,
    };

    this.cartService.addToCart(productData).subscribe({
      next: (res) => {
        item.isInCart = true;
        item.cartId = res?.data?._id || res?.item?._id || res?.cartItem?._id || res?.cart?._id || null;
        item.cartAmount = 1;
      },
      error: (err) => console.error('Error adding to cart:', err)
    });
  }

  handleRemoveFromCart(item: any): void {
    if (!item.cartId) return;

    const previousCartId = item.cartId;
    const previousAmount = Number(item.cartAmount || 1);

    item.isInCart = false;
    item.cartId = null;
    item.cartAmount = 0;

    this.cartService.deleteCartItem(previousCartId, previousAmount).subscribe({
      next: () => undefined,
      error: (err) => {
        item.isInCart = true;
        item.cartId = previousCartId;
        item.cartAmount = previousAmount;
        console.error('Error removing from cart:', err);
      }
    });
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }



  getFavoriteImage(item: any): string {
    const candidates = [
      item?.currentProduct?.image,
      item?.currentProduct?.images?.[0],
      item?.product?.image,
      item?.product?.images?.[0],
      item?.image,
      item?.productImage,
      item?.imageUrl,
    ];

    const image = candidates.find((value) => typeof value === 'string' && value.trim().length > 0);
    return image ? String(image).trim() : '/assets/images/kahve-products.jpg';
  }

  getFavoriteName(item: any): string {
    const product = item?.currentProduct || item?.product || item;
    return this.languageService.localizeProduct(product, 'title') || item?.name || item?.title || '';
  }

  moneyLabel(): string {
    return this.languageService.moneyLabel();
  }

  toggleLanguage(): void {
    this.languageService.toggleLanguage();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}
