import { Component, OnInit } from '@angular/core';
import { SiteContentService } from '../../services/site-content.service';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-contactus',
  templateUrl: './contactus.component.html',
  styleUrls: ['./contactus.component.css']
})
export class ContactusComponent implements OnInit {
  pageContent: Record<string, any> = {};

  constructor(private siteContentService: SiteContentService, public languageService: LanguageService) {}

  ngOnInit(): void {
    this.siteContentService.getPageContent('contact').subscribe((content) => {
      this.pageContent = content || {};
    });
  }

  getBlock(key: string): any {
    return this.pageContent?.[key];
  }

  contentText(key: string, field: string, fallback: string): string {
    return this.siteContentService.localized(this.getBlock(key), field, fallback);
  }

  contentImage(key: string, fallback: string): string {
    return this.siteContentService.image(this.getBlock(key), fallback);
  }
}
