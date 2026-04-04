import { Component } from '@angular/core';
import { MatTabsModule, MatTabChangeEvent } from '@angular/material/tabs';
import { EcommerceOrdersListComponent } from '../ecommerce-orders-list/ecommerce-orders-list.component';
import { OrdersListComponent } from '../exchange-orders-list/orders-list.component';
import { UserCashOrdersListComponent } from '../user-cash-orders-list/user-cash-orders-list.component';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-user-orders.component',
  imports: [MatTabsModule, EcommerceOrdersListComponent, UserCashOrdersListComponent, OrdersListComponent, TranslateModule],
  templateUrl: './user-orders.component.html',
  styleUrl: './user-orders.component.scss',
})
export class UserOrdersComponent {

  selectedIndex = 0;
  
  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.queryParamMap.subscribe(params => {
      const tabIndex = params.get('tab');
      if (tabIndex !== null) {
        this.selectedIndex = +tabIndex;   // convert string to number
      }
    });
  }
}