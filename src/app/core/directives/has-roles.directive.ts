import { Directive, Input, TemplateRef, ViewContainerRef, effect, inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Role } from '../../model/roles.enum';
import { User } from '../../model/user.model';

@Directive({
  selector: '[appHasRole]',
  standalone: true
})
export class HasRoleDirective {
  private templateRef = inject(TemplateRef<any>);
  private viewContainer = inject(ViewContainerRef);
  private authService = inject(AuthService);

  @Input('appHasRole') set requiredRoles(roles: Role | Role[]) {
    this._requiredRoles = Array.isArray(roles) ? roles : [roles];
    this.checkAccess(); // Re-evaluate when input changes
  }

  private _requiredRoles: Role[] = [];

  constructor() {
    // React to changes in current user (signal)
    effect(() => {
      const user = this.authService.currentUser$(); // Signal call with ()
      this.checkAccess(user);
    });
  }

  private checkAccess(user: User | null = this.authService.currentUser$()): void {
    const hasAccess = user?.roles?.some(role => this._requiredRoles.includes(role)) ?? false;

    if (hasAccess) {
      if (this.viewContainer.length === 0) {
        this.viewContainer.createEmbeddedView(this.templateRef);
      }
    } else {
      this.viewContainer.clear();
    }
  }
}
