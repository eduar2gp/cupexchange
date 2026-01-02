import { Component } from '@angular/core';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageService } from '../../../app/core/services/language.service';
import { MatOptionModule } from '@angular/material/core';
import { ThemeService } from '../../../app/core/services/theme-service';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@Component({
  selector: 'app-settings',
  imports: [
    MatFormFieldModule,
    MatSelectModule,
    TranslateModule,
    MatOptionModule,
    MatSlideToggleModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent {

  currentLang: string | undefined;

  constructor(
    private languageService: LanguageService,
    private themeService: ThemeService
  ) {
    this.currentLang = this.languageService.currentLang
  }

  changeLanguage(lang: string) {
    this.languageService.use(lang);
    this.currentLang = lang;
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
  get isDark(): boolean {
    return this.themeService.isDark();
  }
}
