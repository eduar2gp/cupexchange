import { Component, OnInit } from '@angular/core';
import { OrderBookComponent } from '../../views/order/orders-book/orders-book.component'
//import { RecentTradesComponent } from '../../views/trades/recent-trades/recent-trades.component'
import { CandlePriceChartComponent } from '../../views/charts/candle-chart/candle-price-chart.component'
import { RecentTradesComponent } from '../../views/trades/recent-trades.component'
import { MatTabsModule, MatTabChangeEvent } from '@angular/material/tabs';

@Component({
  standalone: true,
  selector: 'app-dashboard',
  imports: [OrderBookComponent, CandlePriceChartComponent, RecentTradesComponent, MatTabsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {

  }

}
