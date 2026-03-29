import { Routes } from '@angular/router';
import { LoginComponent } from './views/login/login.component';
import { ExchangeDashboardComponent } from './views/dashboard/exchange-dashboard/exchange-dashboard.component'
import { AddOrderComponent } from '../app/views/order/add-order/add-order.component'
import { OrdersListComponent } from './views/order/exchange-orders-list/orders-list.component'
import { roleGuard } from '../app/core/guards/role.guard';
import { WalletComponent } from '../app/views/wallet/wallet.component'
import { TransactionsListComponent } from '../app/views/transaction/transactions-list/transactions-list.component'
import { SettingsComponent } from '../app/views/settings/settings.component'
import { RegisterComponent } from '../app/views/register/register.component'
import { CurrenciesComponent } from '../app/views/wallet/add-wallet/currencies.component'
import { ProfileComponent } from '../app/views/profile/profile.component'
import { AddTransactionComponent } from './views/transaction/add-transaction/add-transaction.component';
import { AddProviderComponent } from './views/provider/add-provider/add-provider.component'
import { Role } from '../app/model/roles.enum'
import { ProvidersListComponent } from '../app/views/provider/providers-list/providers-list.component'
import { EditProviderComponent } from '../app/views/provider/edit-provider/edit-provider.component'
import { AddProductComponent } from '../app/views/product/add-product/add-product.component'
import { EditProductComponent } from '../app/views/product/edit-product/edit-product.component'
import { ProviderDashboardComponent } from '../app/views/provider/provider-dashboard/provider-dashboard.component'
import { EcommerceDashboardComponent } from '../app/views/dashboard/ecommerce-dashboard/ecommerce-dashboard.component'
import { ShoppingCartComponent } from '../app/views/cart/shopping-cart/shopping-cart.component'
import { CheckoutComponent } from './views/checkout/checkout.component';
import { EcommerceOrdersListComponent } from './views/order/ecommerce-orders-list/ecommerce-orders-list.component';
import { ProviderOrdersListComponent } from './views/provider/provider-orders-list/provider-orders-list.component';
import { ProviderOrderDetailsComponent } from './views/provider/provider-order-details/provider-order-details.component';
import { AddAccountComponent } from './views/account/add-account/add-account.component';
import { AccountManagerDashboardComponent } from './views/account/account-manager-dashboard/account-manager-dashboard.component';
import { AccountProviderBalanceComponent } from './views/account/account-provider-balances/account-provider-balance.component';
import { NotificationsComponent } from './views/notification/notifications.component';
import { AccountsListComponent } from './views/account/accounts-list/accounts-list.component';
import { WhoWeAreComponent } from './views/shared/whoweare/who-we-are.component';
import { CashOrdersListComponent } from './views/order/cash-orders-list/cash-orders-list.component';
import { AdminDashboardComponent } from './views/admin/dashboard/admin-dashboard.component';
import { ProviderCashOrderDetailsComponent } from './views/provider/provider-cash-order-details/provider-cash-order-details.component';


export const routes: Routes = [
   {
    path: '',
    component: ExchangeDashboardComponent,    
  },
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'who-we-are',
    component: WhoWeAreComponent
  },
  {
    path: 'register',
    component: RegisterComponent,
  },
   {
    path: 'exchange-dashboard',
     component: ExchangeDashboardComponent,         
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
    path: 'add-transaction',
    component: AddTransactionComponent,
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
    path: 'cash-orders',
    component: CashOrdersListComponent,
    canActivate: [roleGuard],    
    data: { roles: [Role.Admin, Role.Provider, Role.StoreManager] }
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
  },
  {
    path: 'add-provider',
    component: AddProviderComponent,
    canActivate: [roleGuard],
    data: { roles: [Role.Admin] }
  },
  {
    path: 'providers-list',
    component: ProvidersListComponent,
    canActivate: [roleGuard],
    data: { roles: [Role.Admin] }
  },
  {
    path: 'edit-provider',
    component: EditProviderComponent,
    canActivate: [roleGuard],
    data: { roles: [Role.Admin, Role.Provider] }
  },
  {
    path: 'add-product',
    component: AddProductComponent,
    canActivate: [roleGuard],
    data: { roles: [Role.Admin, Role.Provider] }
  },
  {
    path: 'edit-product',
    component: EditProductComponent,
    canActivate: [roleGuard],
    data: { roles: [Role.Admin, Role.Provider] }
  },
  {
    path: 'provider-dashboard',
    component: ProviderDashboardComponent,
    canActivate: [roleGuard],
    data: { roles: [Role.Admin, Role.Provider, Role.StoreManager] }
  },
  {
    path: 'provider-orders',
    component: ProviderOrdersListComponent,
    canActivate: [roleGuard],
    data: { roles: [Role.Provider, Role.StoreManager] }
  },
  {
    path: 'ecommerce-dashboard',
    component: EcommerceDashboardComponent
  },
  {
    path: 'cart',
    component: ShoppingCartComponent,
    canActivate: [roleGuard],
  },
  {
    path: 'checkout',
    component: CheckoutComponent,
    canActivate: [roleGuard],
  },
  {
    path: 'ecommerce-orders',
    component: EcommerceOrdersListComponent,
    canActivate: [roleGuard],
  },
  {
    path: 'merchant-order-details',
    component: ProviderOrderDetailsComponent,
    canActivate: [roleGuard],
    data: { roles: [Role.Admin, Role.Provider, Role.StoreManager] }
  },
  {
    path: 'add-account',
    component: AddAccountComponent,
    canActivate: [roleGuard]
  },
  {
    path: 'accounts-list',
    component: AccountsListComponent,
    canActivate: [roleGuard]
  },
  {
    path: 'account-manager-dashboard',
    component: AccountManagerDashboardComponent,
    canActivate: [roleGuard],
    data: { roles: [Role.AccountManager]}
  },
  {
    path: 'account-provider-balances',
    component: AccountProviderBalanceComponent,
    canActivate: [roleGuard],
    data: {roles: [Role.Admin]} 
  },
  {
    path: 'notifications',
    component: NotificationsComponent,
    canActivate: [roleGuard]
  },
  {
    path: 'admin-dashboard',
    component: AdminDashboardComponent,
    canActivate: [roleGuard],
    data: { roles: [Role.Admin]}
  },
  {
    path: 'cash-order-details',
    component: ProviderCashOrderDetailsComponent,
    canActivate: [roleGuard],
    data: { roles: [Role.Admin, Role.Provider, Role.StoreManager]}
  }
];