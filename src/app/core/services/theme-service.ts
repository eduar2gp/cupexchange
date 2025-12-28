import { Injectable, Optional, Inject, PLATFORM_ID, Renderer2, RendererFactory2 } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { OverlayContainer } from '@angular/cdk/overlay';
import { DOCUMENT } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private renderer: Renderer2;
  private currentTheme: 'light' | 'dark' = 'light';
  private readonly darkClass = 'dark-theme';

  constructor(
    rendererFactory: RendererFactory2,
    @Optional() private overlayContainer: OverlayContainer,
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) private platformId: Object  // ← Important for SSR
  ) {
    this.renderer = rendererFactory.createRenderer(null, null);
  }

  initTheme() {
    // Only access localStorage and matchMedia if we're in the browser
    if (isPlatformBrowser(this.platformId)) {
      const saved = localStorage.getItem('theme');
      if (saved) {
        this.setTheme(saved as 'light' | 'dark');
      } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        this.setTheme(prefersDark ? 'dark' : 'light');
      }

      // Listen for system preference changes
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
          this.setTheme(e.matches ? 'dark' : 'light');
        }
      });
    } else {
      // On server: default to light (or whatever you prefer)
      this.setTheme('light');
    }
  }

  toggleTheme() {
    if (isPlatformBrowser(this.platformId)) {
      this.setTheme(this.currentTheme === 'light' ? 'dark' : 'light');
    }
  }

  setTheme(theme: 'light' | 'dark') {
    this.currentTheme = theme;

    if (this.overlayContainer) {
      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem('theme', theme);

        const html = this.document.documentElement;
        const overlayElement = this.overlayContainer.getContainerElement();

        if (theme === 'dark') {
          this.renderer.addClass(html, this.darkClass);
          overlayElement.classList.add(this.darkClass);
        } else {
          this.renderer.removeClass(html, this.darkClass);
          overlayElement.classList.remove(this.darkClass);
        }
      }
    }
  }

  isDark(): boolean {
    return this.currentTheme === 'dark';
  }
}
