import { Component, OnInit } from '@angular/core';
import { OrderBookComponent } from '../../../views/order/exchange-orders-book/orders-book.component'
import { CandlePriceChartComponent } from '../../../views/charts/candle-chart/candle-price-chart.component'
import { RecentTradesComponent } from '../../../views/trades/recent-trades.component'
import { RegionalBalanceComponent } from '../../../views/regional-balance/regional-balance.component'

@Component({
  standalone: true,
  selector: 'app-dashboard',
  imports: [OrderBookComponent, CandlePriceChartComponent, RecentTradesComponent, RegionalBalanceComponent],
  templateUrl: './exchange-dashboard.component.html',
  styleUrl: './exchange-dashboard.component.css',
})
export class ExchangeDashboardComponent implements OnInit {
  constructor() { }
  ngOnInit(): void {
  }
}
