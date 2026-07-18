import { Component, OnInit } from '@angular/core';
import { SiteContentService } from '../../services/site-content.service';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-aboutus',
  templateUrl: './aboutus.component.html',
  styleUrls: ['./aboutus.component.css']
})
export class AboutusComponent implements OnInit {
  pageContent: Record<string, any> = {};

  constructor(private siteContentService: SiteContentService, public languageService: LanguageService) {}

  ngOnInit(): void {
    this.siteContentService.getPageContent('about').subscribe((content) => {
      this.pageContent = content || {};
    });
  }

  getBlock(key: string): any {
    return this.pageContent?.[key];
  }

  contentText(key: string, field: string, fallbackKey: string): string {
    return this.siteContentService.localized(this.getBlock(key), field, this.languageService.translate(fallbackKey));
  }

  contentImage(key: string, fallback: string): string {
    return this.siteContentService.image(this.getBlock(key), fallback);
  }
}
