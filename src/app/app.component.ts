import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { filter } from 'rxjs/operators';
import { LanguageService } from './services/language.service';
import { KAHVE_CONTACT } from './config/store-contact';

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
private titleService: Title,
    private languageService: LanguageService
  ) {}

  ngOnInit() {
    this.languageService.translate('nav.home');
    this.titleService.setTitle('Kahve');

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      // Keep browser tab title fixed on all pages.
      this.titleService.setTitle('Kahve');
      this.updateLayout(this.router.url);
    });
  }

  getWhatsAppLink(): string {
    const number = this.contact.whatsappNumber || this.contact.phoneTel || '';
    const message = encodeURIComponent('Hello KAHVE, I need help with my order.');
    return `https://wa.me/${number}?text=${message}`;
  }

  private updateLayout(url: string) {
    if (url.includes('welcome')) {
      this.showNavbar = 'welcome';
      this.showFooter = true;
    } else if (url.includes('home') || url.includes('dashboard') || url.includes('contactUs')) {
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