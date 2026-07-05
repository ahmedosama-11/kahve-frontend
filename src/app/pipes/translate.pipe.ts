import { ChangeDetectorRef, OnDestroy, Pipe, PipeTransform } from '@angular/core';
import { Subscription } from 'rxjs';
import { LanguageService } from '../services/language.service';

@Pipe({
  name: 't',
  pure: false,
})
export class TranslatePipe implements PipeTransform, OnDestroy {
  private subscription: Subscription;

  constructor(private languageService: LanguageService, private cdr: ChangeDetectorRef) {
    this.subscription = this.languageService.language$.subscribe(() => this.cdr.markForCheck());
  }

  transform(key: string): string {
    return this.languageService.translate(key);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
