import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ApiEndpoints, build } from '../core/api/endpoints';

@Injectable({ providedIn: 'root' })
export class FeatureFlagService {
  // Signal to hold feature flag state reactively
  private flagsSignal = signal<Record<string, boolean>>({});
  private flagsLoadedSignal = signal(false);
  private loadingPromise: Promise<void> | null = null;

  readonly flags = this.flagsSignal.asReadonly();
  readonly flagsLoaded = this.flagsLoadedSignal.asReadonly();

  constructor(private http: HttpClient) {}

  setFlags(flags: Record<string, boolean>): void {
    this.flagsSignal.set(flags ?? {});
    this.flagsLoadedSignal.set(true);
  }

  /**
   * Called on application boot by APP_INITIALIZER
   */
  async loadFlags(): Promise<void> {
    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    this.loadingPromise = (async () => {
      try {
        const config = await firstValueFrom(
          this.http.get<Record<string, boolean>>(build(ApiEndpoints.config.GET_FLAGS))
        );
        this.flagsSignal.set(config ?? {});
      } catch (error) {
        console.error('Failed to load feature flags', error);
        this.flagsSignal.set({});
      } finally {
        this.flagsLoadedSignal.set(true);
      }
    })();

    return this.loadingPromise;
  }

  async ensureFlagsLoaded(): Promise<void> {
    if (this.flagsLoadedSignal()) {
      return;
    }

    await (this.loadingPromise ?? this.loadFlags());
  }

  getFlags(): Record<string, boolean> {
    return this.flagsSignal();
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