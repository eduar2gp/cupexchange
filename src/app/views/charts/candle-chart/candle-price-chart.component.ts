import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Candlestick, ChartDataPoint } from '../../../model/candle-stick-data.model'
import { TradeService } from '../../../../app/core/services/trade.service'
import { PairSelectionService } from '../../../../app/core/services/pair-selection.service';
import { WebSocketService } from '../../../core/services/websocket.service'; 
import { TradingPair } from '../../../model/trading_pair';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators'; // 🎯 Import filter operator
import { TradeVolumeDTO } from '../../../model/trade-volume.model'
import { catchError, of } from 'rxjs';

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
  templateUrl: './candle-price-chart.component.html',
  styleUrl: './candle-price-chart.component.scss'
})
export class CandlePriceChartComponent implements OnInit, OnDestroy {

  private tradeService = inject(TradeService);
  private pairSelectionService = inject(PairSelectionService);
  private webSocketService = inject(WebSocketService);

  private pairSubscription!: Subscription;
  private candleSubscription!: Subscription;

  // 🎯 New: List of supported intervals
  public availableIntervals: string[] = ['1m', '5m', '15m', '30m', '1h', '4h', '1d'];

  public currentPairCode: string = 'USDCUP';
  public currentInterval: string = '5m'; // State variable is now public for the template
  public tradeVolumeData: TradeVolumeDTO | null = null;

  public chartData: ChartData<'candlestick'> = {
    datasets: [{
      label: 'Trading Pair Data',
      data: [],
      type: 'candlestick' as const,
    }]
  };

  public chartOptions: ChartOptions<'candlestick'> = {
    scales: {
      x: {
        type: 'time',
        // 🎯 Note: We use 'minute' as a flexible base unit for time-based scales
        time: { unit: 'minute', parser: 'YYYY-MM-DD', tooltipFormat: 'll HH:mm', displayFormats: { minute: 'HH:mm' } },
        adapters: { date: { locale: 'en' } },
        ticks: { source: 'data' }
      },
      y: {
        title: { display: true, text: 'Price' },
        position: 'right'
      }
    }
  };

  constructor() { }

  ngOnInit(): void {

    // Start the real-time subscription listener once
    this.subscribeToCandleUpdates();

    // Pair Selection Subscription
    this.pairSubscription = this.pairSelectionService.selectedPair$.subscribe((pair: TradingPair | null) => {

      if (!pair) return;

      const newPairCode = pair.value;
      const initialLoadOrPairChange = (newPairCode && newPairCode !== this.currentPairCode) || this.chartData.datasets[0].data.length === 0;

      if (initialLoadOrPairChange) {
        this.currentPairCode = newPairCode;
        this.updateChartDataFlow(); // Combined logic for initial/pair change
      }
    });
  }

  ngOnDestroy(): void {
    if (this.pairSubscription) {
      this.pairSubscription.unsubscribe();
    }
    if (this.candleSubscription) {
      this.candleSubscription.unsubscribe();
    }
    this.webSocketService.unsubscribeFromCandles();
  }

  // =========================================================
  // 🎯 NEW: Interval Selection Handler
  // =========================================================

  /**
   * Called when an interval button is clicked.
   * @param interval The new interval code (e.g., '1h').
   */
  selectInterval(interval: string): void {
    if (interval === this.currentInterval) {
      return;
    }
    this.currentInterval = interval;
    this.updateChartDataFlow();
  }

  /**
   * Helper function to centralize fetching and subscribing logic.
   */
  private updateChartDataFlow(): void {
    // 1. Fetch historical data for the new pair/interval
    this.fetchHistoricalData();

    // 2. Connect to the new live feed topic
    this.connectToLiveFeed();
    this.loadTradeVolume();
  }

  // =========================================================
  // Data Fetching and Chart Loading
  // =========================================================

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

  loadChartData(formattedData: ChartDataPoint[]): void {
    this.chartData.datasets[0].data = formattedData as any;
    this.chartData = { ...this.chartData };
    console.log(`Loaded ${formattedData.length} historical candles for ${this.currentPairCode}.`);
  }

  loadTradeVolume(): void {
    const pairCode = this.currentPairCode;
    this.tradeService.getTradeVolume(pairCode)
      .pipe(
        catchError(error => {
          this.tradeVolumeData = null;
          return of(null);
        })
      )
      .subscribe(tradeVolume => {
        if (tradeVolume)
          this.tradeVolumeData = tradeVolume;
      });
  }
  // =========================================================
  // Real-Time WebSocket Integration
  // =========================================================

  connectToLiveFeed(): void {
    this.webSocketService.subscribeToCandles(this.currentPairCode, this.currentInterval);
  }

  subscribeToCandleUpdates(): void {
    this.candleSubscription = this.webSocketService.candleUpdates$
      .pipe(
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

  updateChartWithLiveCandle(candle: Candlestick): void {
    const data = this.chartData.datasets[0].data as ChartDataPoint[];
    if (data.length === 0) return;

    const newCandlePoint = this.tradeService.mapToChartDataPoints([candle])[0];

    const lastCandle = data[data.length - 1];

    if (lastCandle.x === newCandlePoint.x) {
      // UPDATE: Candle is in progress
      data[data.length - 1] = newCandlePoint;
    } else if (newCandlePoint.x > lastCandle.x) {
      // ADD: New candle period started
      data.push(newCandlePoint);
    }

    this.chartData = { ...this.chartData };
  }
}
