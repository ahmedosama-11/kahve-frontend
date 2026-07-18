import { Component, OnInit } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { SiteContentService } from '../../../services/site-content.service';
import { LanguageService } from '../../../services/language.service';

interface PageBlockDefinition {
  page: string;
  key: string;
  type: string;
  labelEn: string;
  labelAr: string;
  hintEn: string;
  hintAr: string;
  sortOrder: number;
  fallback: any;
}

@Component({
  selector: 'app-site-content-management',
  templateUrl: './site-content-management.component.html',
  styleUrls: ['./site-content-management.component.css'],
})
export class SiteContentManagementComponent implements OnInit {
  pages = [
    { value: 'home', labelEn: 'Home Page', labelAr: 'الرئيسية', icon: 'fa-house' },
    { value: 'about', labelEn: 'About Page', labelAr: 'من نحن', icon: 'fa-mug-hot' },
    { value: 'contact', labelEn: 'Contact Page', labelAr: 'تواصل معنا', icon: 'fa-message' },
    { value: 'welcome', labelEn: 'Welcome Page', labelAr: 'صفحة البداية', icon: 'fa-door-open' },
  ];

  blocks: PageBlockDefinition[] = [
    {
      page: 'home',
      key: 'hero_1',
      type: 'hero',
      labelEn: 'Home slider 1',
      labelAr: 'سلايدر الرئيسية ١',
      hintEn: 'First slide in the Home page slider.',
      hintAr: 'أول سلايدر في الصفحة الرئيسية.',
      sortOrder: 1,
      fallback: {
        title_en: 'Rich Aroma, Premium Taste',
        title_ar: 'رائحة غنية ومذاق فاخر',
        subtitle_en: 'Premium Turkish Coffee',
        subtitle_ar: 'قهوة تركية مميزة',
        body_en: 'Discover KAHVE coffee products crafted for warm mornings, rich taste and unforgettable everyday moments.',
        body_ar: 'اكتشف منتجات KAHVE المصممة لصباح دافئ ومذاق غني ولحظات يومية لا تُنسى.',
        button_text_en: 'Shop Coffee',
        button_text_ar: 'تسوق القهوة',
        button_link: 'home#newArrivals',
        extra_en: 'Our Story',
        extra_ar: 'قصتنا',
        image: '/assets/images/kahve-products.jpg',
      },
    },
    {
      page: 'home',
      key: 'hero_2',
      type: 'hero',
      labelEn: 'Home slider 2',
      labelAr: 'سلايدر الرئيسية ٢',
      hintEn: 'Second slide in the Home page slider.',
      hintAr: 'ثاني سلايدر في الصفحة الرئيسية.',
      sortOrder: 2,
      fallback: {
        title_en: 'Your Coffee, Your Way',
        title_ar: 'قهوتك بطريقتك',
        subtitle_en: 'Made with Love',
        subtitle_ar: 'مصنوعة بحب',
        body_en: 'Choose your favorite roast, flavor and mood from a premium coffee collection designed for modern coffee lovers.',
        body_ar: 'اختار التحميص والنكهة والمزاج المناسب من مجموعة قهوة مميزة.',
        button_text_en: 'Coffee Mixes',
        button_text_ar: 'خلطات القهوة',
        button_link: 'home#CoffeeMixes',
        extra_en: 'Nescafe',
        extra_ar: 'نسكافيه',
        image: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?q=80&w=2070&auto=format&fit=crop',
      },
    },
    {
      page: 'home',
      key: 'hero_3',
      type: 'hero',
      labelEn: 'Home slider 3',
      labelAr: 'سلايدر الرئيسية ٣',
      hintEn: 'Third slide in the Home page slider.',
      hintAr: 'ثالث سلايدر في الصفحة الرئيسية.',
      sortOrder: 3,
      fallback: {
        title_en: 'Blends of Aromatic Coffee',
        title_ar: 'خلطات قهوة عطرية',
        subtitle_en: 'Fresh Roast',
        subtitle_ar: 'تحميص طازج',
        body_en: 'From Turkish coffee to instant coffee mixes, KAHVE brings comfort, quality and taste in every cup.',
        body_ar: 'من القهوة التركية إلى خلطات القهوة السريعة، تقدم KAHVE الراحة والجودة والمذاق في كل كوب.',
        button_text_en: 'Turkish Coffee',
        button_text_ar: 'قهوة تركي',
        button_link: 'home#Coffee',
        extra_en: 'Instant Coffee',
        extra_ar: 'قهوة سريعة',
        image: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=2071&auto=format&fit=crop',
      },
    },
    {
      page: 'home',
      key: 'story',
      type: 'section',
      labelEn: 'Home Our Product',
      labelAr: 'قسم المنتج في الرئيسية',
      hintEn: 'The Our Product section under Home slider.',
      hintAr: 'قسم Our Product تحت سلايدر الرئيسية.',
      sortOrder: 10,
      fallback: {
        title_en: 'We Produce Blends of Aromatic Coffee',
        title_ar: 'نصنع خلطات قهوة عطرية',
        subtitle_en: 'Our Product',
        subtitle_ar: 'منتجنا',
        body_en: 'KAHVE brings Turkish coffee, instant coffee and premium coffee mixes in a warm modern experience made for everyday moments.',
        body_ar: 'تقدم KAHVE القهوة التركية والقهوة السريعة وخلطات القهوة المميزة في تجربة عصرية دافئة للحظات اليومية.',
        extra_en: 'Natural aroma, smooth roast and playful packaging inspired by coffee culture.',
        extra_ar: 'رائحة طبيعية وتحميص ناعم وتغليف مميز مستوحى من ثقافة القهوة.',
        button_text_en: 'About KAHVE',
        button_text_ar: 'عن KAHVE',
        button_link: '/aboutUs',
        badge_en: 'Premium Roast',
        badge_ar: 'تحميص مميز',
        image: '/assets/images/kahve-products.jpg',
      },
    },
    {
      page: 'home',
      key: 'feature_1',
      type: 'feature',
      labelEn: 'Feature 1',
      labelAr: 'ميزة ١',
      hintEn: 'First feature card under the slider.',
      hintAr: 'أول كارت ميزة تحت السلايدر.',
      sortOrder: 20,
      fallback: { title_en: 'Turkish Taste', title_ar: 'مذاق تركي', body_en: 'Authentic daily coffee', body_ar: 'قهوة يومية أصلية' },
    },
    {
      page: 'home',
      key: 'feature_2',
      type: 'feature',
      labelEn: 'Feature 2',
      labelAr: 'ميزة ٢',
      hintEn: 'Second feature card under the slider.',
      hintAr: 'ثاني كارت ميزة تحت السلايدر.',
      sortOrder: 21,
      fallback: { title_en: 'Selected Beans', title_ar: 'حبوب مختارة', body_en: 'Rich aroma and roast', body_ar: 'رائحة غنية وتحميص مميز' },
    },
    {
      page: 'home',
      key: 'feature_3',
      type: 'feature',
      labelEn: 'Feature 3',
      labelAr: 'ميزة ٣',
      hintEn: 'Third feature card under the slider.',
      hintAr: 'ثالث كارت ميزة تحت السلايدر.',
      sortOrder: 22,
      fallback: { title_en: 'Fast Delivery', title_ar: 'توصيل سريع', body_en: 'Fresh to your door', body_ar: 'طازج لحد بابك' },
    },
    {
      page: 'home',
      key: 'feature_4',
      type: 'feature',
      labelEn: 'Feature 4',
      labelAr: 'ميزة ٤',
      hintEn: 'Fourth feature card under the slider.',
      hintAr: 'رابع كارت ميزة تحت السلايدر.',
      sortOrder: 23,
      fallback: { title_en: 'Gift Packs', title_ar: 'هدايا', body_en: 'Perfect coffee moments', body_ar: 'لحظات قهوة مميزة' },
    },
    {
      page: 'about',
      key: 'main',
      type: 'section',
      labelEn: 'About main section',
      labelAr: 'قسم من نحن الرئيسي',
      hintEn: 'The real About page two-column section.',
      hintAr: 'قسم من نحن الحقيقي: كلام يسار وصورة يمين.',
      sortOrder: 1,
      fallback: {
        title_en: 'About KAHVE',
        title_ar: 'عن KAHVE',
        subtitle_en: 'Our Story',
        subtitle_ar: 'قصتنا',
        body_en: 'KAHVE is a warm coffee experience built around rich aroma, premium taste and everyday comfort. We craft Turkish coffee, instant coffee and coffee mixes for people who love simple moments with a beautiful cup.',
        body_ar: 'KAHVE تجربة قهوة دافئة مبنية على الرائحة الغنية والمذاق المميز والراحة اليومية. نصنع القهوة التركية والقهوة السريعة وخلطات القهوة لمحبي اللحظات البسيطة مع كوب جميل.',
        extra_en: 'Fresh Aroma • Premium Taste',
        extra_ar: 'رائحة طازجة • مذاق فاخر',
        button_text_en: 'Shop Coffee',
        button_text_ar: 'تسوق القهوة',
        badge_en: 'Fresh Aroma • Premium Taste',
        badge_ar: 'رائحة طازجة • مذاق فاخر',
        image: '/assets/images/kahve-products.jpg',
      },
    },
    {
      page: 'contact',
      key: 'main',
      type: 'section',
      labelEn: 'Contact main section',
      labelAr: 'قسم التواصل الرئيسي',
      hintEn: 'Contact page text and image.',
      hintAr: 'صورة وكلام صفحة التواصل.',
      sortOrder: 1,
      fallback: {
        title_en: 'Let’s start a coffee conversation.',
        title_ar: 'خلينا نبدأ حديث القهوة.',
        subtitle_en: 'Get in Touch',
        subtitle_ar: 'تواصل معنا',
        body_en: 'Questions about KAHVE products, orders, wholesale or gifts? We’re here to help.',
        body_ar: 'عندك سؤال عن منتجات KAHVE أو الطلبات أو الجملة أو الهدايا؟ نحن هنا للمساعدة.',
        extra_en: 'Cairo, Egypt · Premium Coffee Products',
        extra_ar: 'القاهرة، مصر · منتجات قهوة مميزة',
        badge_en: 'Visit KAHVE',
        badge_ar: 'زور KAHVE',
        image: '/assets/images/kahve-products.jpg',
      },
    },
    {
      page: 'welcome',
      key: 'main',
      type: 'hero',
      labelEn: 'Welcome screen',
      labelAr: 'شاشة البداية',
      hintEn: 'The welcome page before entering the site.',
      hintAr: 'صفحة البداية قبل دخول الموقع.',
      sortOrder: 1,
      fallback: {
        title_en: 'Welcome to KAHVE',
        title_ar: 'مرحبًا بك في KAHVE',
        subtitle_en: 'Premium Coffee Brand',
        subtitle_ar: 'براند قهوة مميز',
        body_en: 'Turkish coffee, instant coffee and warm daily blends crafted for moments that deserve better taste.',
        body_ar: 'قهوة تركي وقهوة سريعة التحضير وخلطات يومية دافئة للحظات تستحق مذاق أفضل.',
        button_text_en: 'Explore Products',
        button_text_ar: 'تصفح المنتجات',
        button_link: '/home',
        badge_en: 'Fresh aroma',
        badge_ar: 'رائحة طازجة',
        image: '/assets/images/kahve-products.jpg',
      },
    },
  ];

  selectedPage = 'home';
  selectedHeroKey = 'hero_1';
  selectedBlock: PageBlockDefinition | null = null;
  itemsByKey: Record<string, any> = {};
  draftByKey: Record<string, any> = {};
  selectedFileByKey: Record<string, File | null> = {};
  dirtyKeys = new Set<string>();
  loading = false;
  saving = false;
  message = '';
  error = '';

  constructor(public languageService: LanguageService, private siteContentService: SiteContentService) {}

  ngOnInit(): void {
    this.loadPageContent();
  }

  get isArabic(): boolean {
    return this.languageService.currentLanguage === 'ar';
  }

  get selectedBlocks(): PageBlockDefinition[] {
    return this.blocks.filter((block) => block.page === this.selectedPage).sort((a, b) => a.sortOrder - b.sortOrder);
  }

  get heroBlocks(): PageBlockDefinition[] {
    return this.selectedBlocks.filter((block) => block.type === 'hero');
  }

  get activeHero(): PageBlockDefinition {
    return this.heroBlocks.find((block) => block.key === this.selectedHeroKey) || this.heroBlocks[0] || this.selectedBlocks[0];
  }

  get dirtyCount(): number {
    return this.dirtyKeys.size;
  }

  t(en: string, ar: string): string {
    return this.isArabic ? ar : en;
  }

  pageLabel(page: any): string {
    return this.isArabic ? page.labelAr : page.labelEn;
  }

  blockLabel(block: PageBlockDefinition): string {
    return this.isArabic ? block.labelAr : block.labelEn;
  }

  blockHint(block: PageBlockDefinition): string {
    return this.isArabic ? block.hintAr : block.hintEn;
  }

  changePage(page: string): void {
    if (this.dirtyCount && !confirm(this.t('You have unsaved changes. Leave this page?', 'في تعديلات متحفظتش. تسيب الصفحة؟'))) return;
    this.selectedPage = page;
    this.selectedBlock = null;
    this.selectedHeroKey = 'hero_1';
    this.loadPageContent();
  }

  loadPageContent(): void {
    this.loading = true;
    this.message = '';
    this.error = '';
    this.itemsByKey = {};
    this.draftByKey = {};
    this.selectedFileByKey = {};
    this.dirtyKeys.clear();

    this.siteContentService.getPageContent(this.selectedPage).subscribe({
      next: (content) => {
        this.itemsByKey = content || {};
        this.selectedBlocks.forEach((def) => {
          this.draftByKey[def.key] = { ...def.fallback, ...(this.itemsByKey[def.key] || {}) };
        });
        if (this.selectedPage === 'home') this.selectedHeroKey = 'hero_1';
        this.loading = false;
      },
      error: () => {
        this.error = this.t('Failed to load saved content. Preview is using defaults.', 'فشل تحميل المحتوى المحفوظ. المعاينة تستخدم الديفولت.');
        this.selectedBlocks.forEach((def) => (this.draftByKey[def.key] = { ...def.fallback }));
        this.loading = false;
      },
    });
  }

  syncDefaults(): void {
    this.loading = true;
    this.siteContentService.seedDefaults().subscribe({
      next: () => {
        this.message = this.t('Default blocks prepared.', 'تم تجهيز البلوكات الافتراضية.');
        this.loadPageContent();
      },
      error: () => {
        this.error = this.t('Failed to prepare defaults.', 'فشل تجهيز الديفولت.');
        this.loading = false;
      },
    });
  }

  selectBlock(def: PageBlockDefinition): void {
    this.selectedBlock = def;
    if (def.page === 'home' && def.type === 'hero') this.selectedHeroKey = def.key;
    setTimeout(() => document.querySelector('.stage-editor-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  }

  selectHero(def: PageBlockDefinition): void {
    this.selectedHeroKey = def.key;
    this.selectBlock(def);
  }

  block(def: PageBlockDefinition): any {
    if (!this.draftByKey[def.key]) this.draftByKey[def.key] = { ...def.fallback, ...(this.itemsByKey[def.key] || {}) };
    return this.draftByKey[def.key];
  }

  text(def: PageBlockDefinition, field: string): string {
    const block = this.block(def);
    const suffix = this.isArabic ? '_ar' : '_en';
    return String(block?.[`${field}${suffix}`] || block?.[`${field}_en`] || block?.[`${field}_ar`] || '').trim();
  }

  image(def: PageBlockDefinition): string {
    return String(this.block(def)?.image || '').trim();
  }

  setValue(field: string, value: any): void {
    if (!this.selectedBlock) return;
    this.block(this.selectedBlock)[field] = value;
    this.markDirty(this.selectedBlock.key);
  }

  markDirty(key: string): void {
    this.dirtyKeys.add(key);
    this.message = '';
  }

  onImageSelected(event: Event, def: PageBlockDefinition): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] || null;
    if (!file) return;

    this.selectedFileByKey[def.key] = file;
    this.block(def).image = URL.createObjectURL(file);
    this.markDirty(def.key);
    this.selectBlock(def);
  }

  removeImage(def: PageBlockDefinition): void {
    this.selectedFileByKey[def.key] = null;
    this.block(def).image = '';
    this.markDirty(def.key);
    this.selectBlock(def);
  }

  buildFormData(def: PageBlockDefinition): FormData {
    const draft = this.block(def);
    const data = new FormData();
    const payload: any = {
      ...draft,
      page: def.page,
      key: def.key,
      type: def.type,
      label: this.blockLabel(def),
      sortOrder: def.sortOrder,
      isActive: draft.isActive !== false,
      currentImage: draft.image || '',
    };

    Object.keys(payload).forEach((key) => {
      if (payload[key] !== undefined && payload[key] !== null) data.append(key, String(payload[key]));
    });

    const file = this.selectedFileByKey[def.key];
    if (file) data.append('image', file);

    return data;
  }

  savePage(): void {
    const dirtyDefinitions = this.selectedBlocks.filter((def) => this.dirtyKeys.has(def.key));

    if (!dirtyDefinitions.length) {
      this.message = this.t('No changes to save.', 'لا يوجد تعديلات للحفظ.');
      return;
    }

    this.saving = true;
    this.error = '';
    this.message = '';

    const requests: Observable<any>[] = dirtyDefinitions.map((def) => {
      const id = this.itemsByKey[def.key]?._id;
      return id
        ? this.siteContentService.updateContent(id, this.buildFormData(def))
        : this.siteContentService.saveContent(this.buildFormData(def));
    });

    forkJoin(requests.length ? requests : [of(null)])
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: () => {
          this.message = this.t('Saved successfully. The real website will update now.', 'تم الحفظ بنجاح. الموقع الحقيقي هيتحدث الآن.');
          this.loadPageContent();
        },
        error: (err) => {
          console.error('Save page error:', err);
          this.error = err?.error?.message || this.t('Failed to save page.', 'فشل حفظ الصفحة.');
        },
      });
  }
}
