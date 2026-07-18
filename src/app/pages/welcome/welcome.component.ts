import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { SiteContentService } from '../../services/site-content.service';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.css'],
})
export class WelcomeComponent implements OnInit {
  title: string = 'welcome ';
  pageContent: Record<string, any> = {};

  constructor(
    private titleService: Title,
    private siteContentService: SiteContentService,
    public languageService: LanguageService
  ) {
    this.titleService.setTitle(this.title);
  }

  ngOnInit(): void {
    this.siteContentService.getPageContent('welcome').subscribe((content) => {
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
