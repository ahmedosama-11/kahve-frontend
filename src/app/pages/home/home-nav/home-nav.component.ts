import { Component, OnDestroy, OnInit } from '@angular/core';
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

  cartCount: number = 0;

  isFavOpen: boolean = false;
  favorites: any[] = [];
  favLoading: boolean = false;
  favError: string = '';

  private subscriptions: Subscription[] = [];
  private cartUpdatedHandler = () => this.cartService.refreshCartCount();

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

    window.addEventListener('kahve-cart-updated', this.cartUpdatedHandler);
  }

  toggleFavorites(): void {
    this.isFavOpen = !this.isFavOpen;
    if (this.isFavOpen) {
      this.loadFavorites();
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
        const cartItems = result.cart.items || result.cart.data || result.cart.cart || [];
        const favItems = Array.isArray(result.favs) ? result.favs : (result.favs.favorites || result.favs.data || []);

        this.favorites = favItems.map((f: any) => {
          const cartEntry = cartItems.find((c: any) => String(c.productId) === String(f.productId));
          return {
            ...f,
            isInCart: !!cartEntry,
            cartId: cartEntry ? cartEntry._id : null
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
      image: item.image,
      productId: item.productId,
      amount: 1,
    };

    this.cartService.addToCart(productData).subscribe({
      next: (res) => {
        item.isInCart = true;
        item.cartId = res?.data?._id || res?.cart?._id || null;
        this.cartService.refreshCartCount();
      },
      error: (err) => console.error('Error adding to cart:', err)
    });
  }

  handleRemoveFromCart(item: any): void {
    if (!item.cartId) return;

    this.cartService.deleteCartItem(item.cartId).subscribe({
      next: () => {
        item.isInCart = false;
        item.cartId = null;
        this.cartService.refreshCartCount();
      },
      error: (err) => console.error('Error removing from cart:', err)
    });
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
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
    window.removeEventListener('kahve-cart-updated', this.cartUpdatedHandler);
  }
}
