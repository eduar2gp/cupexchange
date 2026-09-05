import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { FeatureFlagService } from '../../services/feature-flag.service';

export interface FeatureFlagGuardData {
  requiredFlags: string | string[];
  mode?: 'AND' | 'OR';
  redirectTo?: string;
}

export const featureFlagGuard: CanActivateFn = (route) => {
  const ffService = inject(FeatureFlagService);
  const router = inject(Router);

  const guardData = route.data as FeatureFlagGuardData;
  const requiredFlags = guardData?.requiredFlags ?? [];
  const mode = guardData?.mode ?? 'AND';
  const fallbackUrl = guardData?.redirectTo ?? '/403';

  if (ffService.hasAccess(requiredFlags, mode)) {
    return true;
  }

  return router.createUrlTree([fallbackUrl]);
};