import { Component } from '@angular/core';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  constructor(public languageService: LanguageService) {}

  toggleLanguage(): void {
    this.languageService.toggleLanguage();
  }
}
