import { Injectable, Optional, Inject, PLATFORM_ID, Renderer2, RendererFactory2 } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { OverlayContainer } from '@angular/cdk/overlay';
import { DOCUMENT } from '@angular/common';

export type ThemeMode = 'light' | 'dark' | 'auto';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private renderer: Renderer2;
  private currentTheme: 'light' | 'dark' = 'light';
  private readonly darkClass = 'dark-theme';
  private currentMode: ThemeMode = 'auto';
  
  constructor(
    rendererFactory: RendererFactory2,
    @Optional() private overlayContainer: OverlayContainer,
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) private platformId: Object  // ← Important for SSR
  ) {
    this.renderer = rendererFactory.createRenderer(null, null);
  }

  initTheme() {
    if (isPlatformBrowser(this.platformId)) {
      const saved = localStorage.getItem('theme-mode') as ThemeMode;
      this.setThemeMode(saved || 'auto');
    }
  }

  setThemeMode(mode: ThemeMode) {
    this.currentMode = mode;
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('theme-mode', mode);
      this.applyTheme();
    }
  }

  private applyTheme() {
    let themeToApply: 'light' | 'dark';

    if (this.currentMode === 'auto') {
      const hour = new Date().getHours();
      // Auto: Dark mode between 6 PM (18) and 6 AM
      themeToApply = (hour >= 18 || hour < 6) ? 'dark' : 'light';
    } else {
      themeToApply = this.currentMode;
    }

    const html = this.document.documentElement;
    const overlayElement = this.overlayContainer.getContainerElement();

    if (themeToApply === 'dark') {
      this.renderer.addClass(html, this.darkClass);
      overlayElement.classList.add(this.darkClass);
    } else {
      this.renderer.removeClass(html, this.darkClass);
      overlayElement.classList.remove(this.darkClass);
    }
  }

  isDark(): boolean {
    return this.currentTheme === 'dark';
  }

  getMode(): ThemeMode {
    return this.currentMode;
  }
}
