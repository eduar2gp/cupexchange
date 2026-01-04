import { Routes } from '@angular/router';
import { LoginComponent } from './views/login/login.component';
import { DashboardComponent } from './views/dashboard/dashboard.component'
import { AddOrderComponent } from '../app/views/order/add-order/add-order.component'
import { OrdersListComponent } from './views/order/orders-list/orders-list.component'
import { roleGuard } from '../app/core/guards/role.guard';
import { WalletComponent } from '../app/views/wallet/wallet.component'
import { TransactionsListComponent } from '../app/views/transaction/transactions-list/transactions-list.component'
import { SettingsComponent } from '../app/views/settings/settings.component'
import { RegisterComponent } from '../app/views/register/register.component'
import { CurrenciesComponent } from '../app/views/wallet/add-wallet/currencies.component'
import { ProfileComponent } from '../app/views/profile/profile.component'

export const routes: Routes = [
   {
    path: '',
    component: LoginComponent,    
  },
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'register',
    component: RegisterComponent,
  },
   {
    path: 'dashboard',
     component: DashboardComponent,
     canActivate: [roleGuard],     
  },
  {
    path: 'add-wallet',
    component: CurrenciesComponent,
    canActivate: [roleGuard],
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [roleGuard],
  },
  {
    path: 'add-order',
    component: AddOrderComponent,
    canActivate: [roleGuard],    
  },
  {
    path: 'orders',
    component: OrdersListComponent,
    canActivate: [roleGuard],    
  },
  {
    path: 'wallet',
    component: WalletComponent,
    canActivate: [roleGuard],
  },
  {
    path: 'transactions',
    component: TransactionsListComponent,
    canActivate: [roleGuard],
  },
  {
    path: 'settings',
    component: SettingsComponent,
    canActivate: [roleGuard],
  }
];
