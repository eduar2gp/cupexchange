import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ApiEndpoints, build } from '../core/api/endpoints';

@Injectable({ providedIn: 'root' })
export class FeatureFlagService {
  // Signal to hold feature flag state reactively
  private flagsSignal = signal<Record<string, boolean>>({});

  constructor(private http: HttpClient) {}

  /**
   * Called on application boot by APP_INITIALIZER
   */
  async loadFlags(): Promise<void> {
    try {
      const config = await firstValueFrom(
        this.http.get<Record<string, boolean>>(build(ApiEndpoints.config.GET_FLAGS))
      );
      this.flagsSignal.set(config ?? {});
    } catch (error) {
      console.error('Failed to load feature flags, applying defaults', error);
      this.flagsSignal.set({});
    }
  }

  /**
   * Checks if a single flag is enabled
   */
  isEnabled(flagKey: string): boolean {
    return !!this.flagsSignal()[flagKey];
  }

  /**
   * Evaluates multiple flags (AND logic by default, or OR logic)
   */
  hasAccess(keys: string | string[], mode: 'AND' | 'OR' = 'AND'): boolean {
    const flagKeys = Array.isArray(keys) ? keys : [keys];
    if (flagKeys.length === 0) return true;

    if (mode === 'AND') {
      return flagKeys.every((key) => this.isEnabled(key));
    } else {
      return flagKeys.some((key) => this.isEnabled(key));
    }
  }
}