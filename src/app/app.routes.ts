import { Routes } from '@angular/router';
import { LoginComponent } from './views/login/login.component';
import { DashboardComponent } from './views/dashboard/dashboard.component'
import { AddOrderComponent } from '../app/views/order/add-order/add-order.component'
import { OrdersListComponent } from './views/order/orders-list/orders-list.component'
import { roleGuard } from '../app/core/guards/role.guard';
import { WalletComponent } from '../app/views/wallet/wallet.component'
import { TransactionsListComponent } from '../app/views/transaction/transactions-list/transactions-list.component'

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
    path: 'dashboard',
     component: DashboardComponent,
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
];
