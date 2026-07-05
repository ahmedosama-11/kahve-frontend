import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { KahveLanguage, TRANSLATIONS } from '../i18n/translations';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly storageKey = 'kahve_language';
  private readonly baseUrl = 'http://localhost:3000';
  private readonly languageSubject = new BehaviorSubject<KahveLanguage>(this.getInitialLanguage());

  readonly language$ = this.languageSubject.asObservable();

  constructor(private http: HttpClient) {
    this.applyLanguage(this.languageSubject.value);
  }

  get currentLanguage(): KahveLanguage {
    return this.languageSubject.value;
  }

  get isArabic(): boolean {
    return this.currentLanguage === 'ar';
  }

  translate(key: string, params?: Record<string, string | number>): string {
    const template = TRANSLATIONS[this.currentLanguage][key] || TRANSLATIONS.en[key] || key;
    if (!params) return template;
    return Object.keys(params).reduce((text, paramKey) => {
      return text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(params[paramKey]));
    }, template);
  }

  moneyLabel(): string {
    return this.translate('currency.egp');
  }

  setLanguage(language: KahveLanguage, syncToDb: boolean = true): void {
    localStorage.setItem(this.storageKey, language);
    this.languageSubject.next(language);
    this.applyLanguage(language);

    if (syncToDb && localStorage.getItem('userId')) {
      this.http.patch(`${this.baseUrl}/preferred-language`, { language }, { withCredentials: true }).subscribe({
        next: (response: any) => {
          const user = response?.user || response?.data;
          if (user) localStorage.setItem('user', JSON.stringify(user));
        },
        error: () => {
          // Keep local preference even if the user is not logged in or token expired.
        },
      });
    }
  }

  setFromUser(user: any): void {
    const language = user?.preferredLanguage;
    if (language === 'ar' || language === 'en') {
      this.setLanguage(language, false);
    }
  }

  toggleLanguage(): void {
    this.setLanguage(this.currentLanguage === 'ar' ? 'en' : 'ar');
  }

  localizeProduct(product: any, field: 'title' | 'description' | 'category'): string {
    if (!product) return '';
    const suffix = this.currentLanguage === 'ar' ? '_ar' : '_en';
    return String(product[`${field}${suffix}`] || product[field] || product[`${field}_en`] || product[`${field}_ar`] || '').trim();
  }

  private getInitialLanguage(): KahveLanguage {
    const saved = localStorage.getItem(this.storageKey);
    if (saved === 'ar' || saved === 'en') return saved;

    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user?.preferredLanguage === 'ar' || user?.preferredLanguage === 'en') return user.preferredLanguage;
    } catch {}

    const browserLanguage = (navigator.language || '').toLowerCase();
    return browserLanguage.startsWith('ar') ? 'ar' : 'en';
  }

  private applyLanguage(language: KahveLanguage): void {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.body.classList.toggle('rtl', language === 'ar');
  }
}
