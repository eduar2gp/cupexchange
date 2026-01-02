import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class LanguageService {

  private readonly platformId = inject(PLATFORM_ID);
  private readonly STORAGE_KEY = 'app_language';
  private readonly SUPPORTED_LANGS = ['en', 'es', 'ru'];

  constructor(private translate: TranslateService) {
    if (isPlatformBrowser(this.platformId))
      this.initializeLanguage();
  }

  private initializeLanguage() {
    const savedLang = localStorage.getItem(this.STORAGE_KEY);
    const browserLang = navigator.language.split('-')[0];

    const lang =
      savedLang ??
      (this.SUPPORTED_LANGS.includes(browserLang) ? browserLang : 'en');

    this.translate.addLangs(this.SUPPORTED_LANGS);
    this.translate.setDefaultLang('en');
    this.use(lang);
  }

  use(lang: string) {
    if (!this.SUPPORTED_LANGS.includes(lang)) return;
    this.translate.use(lang);
    localStorage.setItem(this.STORAGE_KEY, lang);
  }

  get currentLang(): string {
    if (isPlatformBrowser(this.platformId))
      return this.translate.currentLang;
    return 'en'
  }
}
