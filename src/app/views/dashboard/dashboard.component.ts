import { Component, OnInit } from '@angular/core';
import { OrderBookComponent } from '../../views/order/orders-book/orders-book.component'
//import { RecentTradesComponent } from '../../views/trades/recent-trades/recent-trades.component'
import { PriceChartComponent } from '../../views/charts/price-chart/price-chart.component'

@Component({
  standalone: true,
  selector: 'app-dashboard',
  imports: [PriceChartComponent, OrderBookComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {

  }

}
