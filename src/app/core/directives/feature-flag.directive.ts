import { 
  Directive, 
  Input, 
  TemplateRef, 
  ViewContainerRef, 
  inject, 
  effect,
  signal 
} from '@angular/core';
import { FeatureFlagService } from '../../services/feature-flag.service';

@Directive({
  standalone: true,
  selector: '[appFeatureFlag]'
})
export class FeatureFlagDirective {
  private templateRef = inject(TemplateRef<unknown>);
  private viewContainer = inject(ViewContainerRef);
  private ffService = inject(FeatureFlagService);

  private flags = signal<string | string[]>([]);
  private mode = signal<'AND' | 'OR'>('AND');
  private hasView = false;

  constructor() {
    effect(() => {
      // Re-run when either feature flags or directive inputs change.
      this.ffService.flags();
      this.updateView(this.flags(), this.mode());
    });
  }

  @Input('appFeatureFlag') set featureFlag(val: string | string[]) {
    this.flags.set(val);
  }

  @Input('appFeatureFlagMode') set featureFlagMode(mode: 'AND' | 'OR') {
    this.mode.set(mode);
  }

  private updateView(flags: string | string[], mode: 'AND' | 'OR'): void {
    const isAllowed = this.ffService.hasAccess(flags, mode);

    if (isAllowed && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!isAllowed && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}