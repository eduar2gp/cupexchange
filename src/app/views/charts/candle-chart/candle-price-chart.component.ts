import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Candlestick, ChartDataPoint } from '../../../model/candle-stick-data.model'
import { TradeService } from '../../../../app/core/services/trade.service'
import { PairSelectionService } from '../../../../app/core/services/pair-selection.service';
import { WebSocketService } from '../../../core/services/websocket.service'; 
import { TradingPair } from '../../../model/trading_pair';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators'; // 🎯 Import filter operator

// Charting Imports
import { Chart, ChartData, ChartOptions, TimeScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { CandlestickController, CandlestickElement } from 'chartjs-chart-financial';
import 'chartjs-adapter-luxon';

// Register all necessary components
Chart.register(
  TimeScale, LinearScale, Tooltip, Legend,
  CandlestickController, CandlestickElement
);

@Component({
  selector: 'app-trade-chart',
  standalone: true,
  imports: [
    CommonModule,
    BaseChartDirective
  ],
  template: `
    <div class="chart-container">
      <canvas baseChart
        [data]="chartData"
        [options]="chartOptions"
        [type]="'candlestick'">
      </canvas>
    </div>
  `,
})
export class CandlePriceChartComponent implements OnInit, OnDestroy {

  // 🎯 Inject Services
  private tradeService = inject(TradeService);
  private pairSelectionService = inject(PairSelectionService);
  private webSocketService = inject(WebSocketService); // 🎯 Inject WebSocket Service

  // 🎯 Subscription Trackers
  private pairSubscription!: Subscription;
  private candleSubscription!: Subscription; // 🎯 New subscription for real-time updates

  // 🎯 Local State
  public currentPairCode: string = 'USDCUP';
  private currentInterval: string = '5m';

  // 3. Define Chart Data 
  public chartData: ChartData<'candlestick'> = {
    datasets: [{
      label: 'Trading Pair Data',
      data: [],
      type: 'candlestick' as const,
    }]
  };

  // 4. Define Chart Options (omitted for brevity)
  public chartOptions: ChartOptions<'candlestick'> = {
    scales: {
      x: {
        type: 'time',
        time: { unit: 'minute', parser: 'YYYY-MM-DD', tooltipFormat: 'll HH:mm', displayFormats: { day: 'MMM D' } },
        adapters: { date: { locale: 'en' } },
        ticks: { source: 'data' }
      },
      y: {
        title: { display: true, text: 'Price' }
      }
    }
  };

  constructor() { }

  ngOnInit(): void {
    // 🎯 Pair Selection Subscription (Triggers historical fetch and live feed connection)
    this.pairSubscription = this.pairSelectionService.selectedPair$.subscribe((pair: TradingPair | null) => {

      if (!pair) {
        console.warn('Pair selection service emitted a null value.');
        return;
      }

      const newPairCode = pair.value;

      if (newPairCode && (newPairCode !== this.currentPairCode || this.chartData.datasets[0].data.length === 0)) {
        this.currentPairCode = newPairCode;

        // 1. Fetch historical data for the new pair
        this.fetchHistoricalData();

        // 2. Connect to the new live feed topic
        this.connectToLiveFeed();
      }
    });

    // 🎯 Start the real-time subscription listener once
    this.subscribeToCandleUpdates();
  }

  ngOnDestroy(): void {
    if (this.pairSubscription) {
      this.pairSubscription.unsubscribe();
    }
    // 🎯 Clean up the real-time subscription
    if (this.candleSubscription) {
      this.candleSubscription.unsubscribe();
    }
    // 🎯 Unsubscribe from the WebSocket topic when the component is destroyed
    this.webSocketService.unsubscribeFromCandles();
  }

  // =========================================================
  // Data Fetching and Chart Loading
  // =========================================================

  /**
   * Fetches historical candles and loads them into the chart.
   */
  fetchHistoricalData(): void {
    console.log(`Fetching historical data for: ${this.currentPairCode} (${this.currentInterval})`);

    this.tradeService.getHistoricalCandlesticks(this.currentPairCode, this.currentInterval, 200)
      .subscribe({
        next: (candles: Candlestick[]) => {
          const chartDataPoints = this.tradeService.mapToChartDataPoints(candles);
          this.loadChartData(chartDataPoints);
        },
        error: (err) => {
          console.error(`Failed to load historical candlestick data for ${this.currentPairCode}:`, err);
        }
      });
  }

  /**
   * Loads the formatted ChartDataPoint array into the chart's data structure.
   */
  loadChartData(formattedData: ChartDataPoint[]): void {
    this.chartData.datasets[0].data = formattedData as any;
    this.chartData = { ...this.chartData };
    console.log(`Loaded ${formattedData.length} historical candles for ${this.currentPairCode}.`);
  }

  // =========================================================
  // 🎯 REAL-TIME WEBSOCKET INTEGRATION
  // =========================================================

  /**
   * Subscribes to the WebSocket topic for the currently selected pair/interval.
   */
  connectToLiveFeed(): void {
    // 1. Unsubscribe from the old topic if necessary (handled internally by service, but good practice)
    this.webSocketService.unsubscribeFromCandles();

    // 2. Subscribe to the new topic
    this.webSocketService.subscribeToCandles(this.currentPairCode, this.currentInterval);
  }

  /**
   * Subscribes to the service's Observable that emits real-time candle updates.
   */
  subscribeToCandleUpdates(): void {
    // Subscribe to the shared Observable stream and filter it if needed (though the backend should ensure context)
    this.candleSubscription = this.webSocketService.candleUpdates$
      .pipe(
        // Ensure we only process updates for the currently viewed pair and interval
        filter(candle =>
          candle.pair === this.currentPairCode &&
          candle.interval === this.currentInterval
        )
      )
      .subscribe({
        next: (candleUpdate: Candlestick) => {
          this.updateChartWithLiveCandle(candleUpdate);
        },
        error: (err) => {
          console.error('WebSocket candle update error:', err);
        }
      });
  }

  /**
   * Updates the chart data array with the latest live candle (either updates the last candle 
   * or adds a new one if the period has closed).
   * @param candle The real-time Candlestick update.
   */
  updateChartWithLiveCandle(candle: Candlestick): void {
    const data = this.chartData.datasets[0].data as ChartDataPoint[];
    const newCandlePoint = this.tradeService.mapToChartDataPoints([candle])[0]; // Map the single DTO

    if (data.length === 0) {
      // Should not happen, but a safeguard: add the candle if the chart is empty.
      data.push(newCandlePoint);
    } else {
      const lastCandle = data[data.length - 1];

      // Check if the timestamp matches (candle is still in progress)
      if (lastCandle.x === newCandlePoint.x) {
        // 1. UPDATE: Replace the last candle with the new, updated data point
        data[data.length - 1] = newCandlePoint;
      } else if (newCandlePoint.x > lastCandle.x) {
        // 2. ADD: The new candle update is for a new time period (the previous one closed)
        data.push(newCandlePoint);
      }
    }

    // 3. Trigger chart redraw
    this.chartData = { ...this.chartData };
  }
}
