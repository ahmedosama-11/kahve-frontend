import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { KAHVE_CONTACT } from './config/store-contact';
import { AnalyticsService } from './services/analytics.service';
import { AppVersionService } from './services/app-version.service';
import { AuthService } from './services/auth.service';
import { LanguageService } from './services/language.service';
import { SeoService } from './services/seo.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  showNavbar: string = 'default';
  showFooter: boolean = true;
  contact = KAHVE_CONTACT;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private languageService: LanguageService,
    private authService: AuthService,
    private seoService: SeoService,
    private appVersionService: AppVersionService,
    private analyticsService: AnalyticsService,
  ) {}

  ngOnInit(): void {
    this.languageService.translate('nav.home');
    this.seoService.setGlobalStructuredData();
    this.applyRouteState(this.router.url);

    // Register SEO before Analytics so every page_view receives the new page title.
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => this.applyRouteState(event.urlAfterRedirects));

    this.appVersionService.initialize();
    this.analyticsService.initialize();
    window.addEventListener('kahve-auth-expired', () => this.authService.clearSession());

    // A cached local user is only a hint. Confirm it with the backend on startup.
    if (this.authService.hasStoredSession()) {
      this.authService.checkAuthStatus().subscribe();
    }
  }

  getWhatsAppLink(): string {
    const number = this.contact.whatsappNumber || this.contact.phoneTel || '';
    const message = encodeURIComponent('Hello KAHVE, I need help with my order.');
    return `https://wa.me/${number}?text=${message}`;
  }

  private applyRouteState(url: string): void {
    let route = this.activatedRoute.snapshot;
    while (route.firstChild) route = route.firstChild;
    this.seoService.applyRoute(route, url);
    this.updateLayout(url);
  }

  private updateLayout(url: string): void {
    const path = url.split('?')[0].split('#')[0];
    if (path === '/' || path.includes('welcome')) {
      this.showNavbar = 'welcome';
      this.showFooter = true;
    } else if (url.includes('home') || url.includes('/product/') || url.includes('/category/') || url.includes('dashboard') || url.includes('contactUs')) {
      this.showNavbar = 'home';
      this.showFooter = !url.includes('dashboard');
    } else if (url.includes('logout')) {
      this.showNavbar = 'false';
      this.showFooter = false;
    } else {
      this.showNavbar = 'default';
      this.showFooter = true;
    }
  }
}
