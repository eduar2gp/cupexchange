import { 
  Directive, 
  Input, 
  TemplateRef, 
  ViewContainerRef, 
  inject, 
  effect 
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

  private flags: string | string[] = [];
  private mode: 'AND' | 'OR' = 'AND';
  private hasView = false;

  @Input('appFeatureFlag') set featureFlag(val: string | string[]) {
    this.flags = val;
    this.updateView();
  }

  @Input('appFeatureFlagMode') set featureFlagMode(mode: 'AND' | 'OR') {
    this.mode = mode;
    this.updateView();
  }

  private updateView(): void {
    const isAllowed = this.ffService.hasAccess(this.flags, this.mode);

    if (isAllowed && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!isAllowed && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}