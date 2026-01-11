import { Component, OnInit, signal, inject } from '@angular/core';

import { ProvidersService } from '../../../core/services/providers.service';
import { Provider } from '../../../model/provider.model'
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { DataService } from '../../../core/services/data.service';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment'
import { HasRoleDirective } from '../../../core/directives/has-roles.directive'
import { Role } from '../../../model/roles.enum';

@Component({
  selector: 'app-providers-list',
  standalone: true,
  imports: [MatListModule, MatIconModule, MatDividerModule, HasRoleDirective],
  templateUrl: './providers-list.component.html',
  styleUrl: './providers-list.component.css',
})
export class ProvidersListComponent implements OnInit {

  public Role = Role;

  public backendBaseUrl: string = environment.baseApiUrl;

  // 💡 Inject the new dedicated service
  private providersService = inject(ProvidersService);

  // Note: Product interface is now imported from the service file
  providers = signal<Provider[]>([]);
  
  constructor(private dataService: DataService, private router: Router) {
    // 2. Assign the service's Observable to the local variable
    //this.dataService = dataServic;
  }

  ngOnInit(): void {
    this.fetchProviders();
  }

  fetchProviders(): void {  
    // 💡 Use the service method instead of direct HttpClient call
    this.providersService.getProviders().subscribe({
      next: (data: Provider[]) => {
        this.providers.set(data);        
      },
      error: (err) => {
        console.error('Error fetching providers:', err);        
        this.providers.set([]);
      }
    });
  }

  onClick(provider: Provider) {
    console.log(provider.name)
    this.dataService.updateProvider(provider)
    this.router.navigate(['/edit-provider']);
  }

  addProvider() {
    this.router.navigate(['/add-provider'])
  }

}
