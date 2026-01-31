import { Component, OnInit, inject, OnDestroy, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TradeService } from '../../../../app/core/services/trade.service';
import { PairSelectionService } from '../../../../app/core/services/pair-selection.service';
import { WebSocketService } from '../../../core/services/websocket.service';
import { TradingPair } from '../../../model/trading_pair';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { TradeVolumeDTO } from '../../../model/trade-volume.model';
import { catchError, of } from 'rxjs';

// Charting Imports
import {
  Chart,
  ChartData,
  ChartConfiguration,
  ChartOptions,
  TimeScale,
  LinearScale,
  Tooltip,
  Legend,
  LineController,
  PointElement,
  LineElement,
  Filler
} from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { CandlestickController, CandlestickElement } from 'chartjs-chart-financial';
import 'chartjs-adapter-luxon';

// Register all necessary components (candlestick + line)
Chart.register(
  TimeScale,
  LinearScale,
  Tooltip,
  Legend,
  CandlestickController,
  CandlestickElement,
  LineController,
  PointElement,
  LineElement,
  Filler
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

  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  private tradeService = inject(TradeService);
  private pairSelectionService = inject(PairSelectionService);
  private webSocketService = inject(WebSocketService);

  private pairSubscription!: Subscription;
  private candleSubscription!: Subscription;

  public availableIntervals: string[] = ['1m', '5m', '15m', '30m', '1h', '4h', '1d'];

  public currentPairCode: string = 'USDCUP';
  public currentInterval: string = '5m';
  public tradeVolumeData = signal<TradeVolumeDTO | null>(null);

  // Keep the canonical candlestick points so we can render both chart types from the same source.
  // Each point must expose a timestamp in `x` and o/h/l/c values (or adapt mapping accordingly).
  private rawChartDataPoints: any[] = [];

  // Chart type: 'candlestick' | 'line'
  public chartType: 'candlestick' | 'line' = 'line';

  // ---------- Line config (used when chartType === 'line') ----------
  chartDataLine: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [{
      label: 'Price',
      data: [],
      borderColor: 'rgb(75, 192, 192)',
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      tension: 0.1,
      pointRadius: 2,
      fill: true
    }]
  };

  chartOptionsLine: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: false,
        title: { display: true, text: 'Price' }
      },
      x: {
        type: 'time',
        time: { unit: 'minute', tooltipFormat: 'LLL dd HH:mm' },
        ticks: { autoSkip: true, maxTicksLimit: 10 }
      }
    },
    plugins: {
      legend: { display: true },
      tooltip: { mode: 'index', intersect: false }
    }
  };

  // ---------- Candlestick config (used when chartType === 'candlestick') ----------
  // Use generic types to allow runtime swapping of data/options without AOT type errors.
  public chartData: ChartData<any> = {
    datasets: [{
      label: 'Trading Pair Data',
      data: [],
      type: 'candlestick' as const
    }]
  };

  public chartOptions: ChartOptions<any> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true }
    },
    scales: {
      x: {
        type: 'time',
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

  public watermarkPlugin = {
    id: 'watermark',
    beforeDraw: (chart: any) => {
      const { ctx, chartArea: { top, left, width, height } } = chart;
      ctx.save();
      ctx.font = 'bold 40px Roboto, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.currentPairCode, left + width / 2, top + height / 2);
      ctx.restore();
    }
  };

  constructor() { }

  ngOnInit(): void {
    this.subscribeToCandleUpdates();

    this.pairSubscription = this.pairSelectionService.selectedPair$.subscribe((pair: TradingPair | null) => {
      if (!pair) return;
      Promise.resolve().then(() => {
        const newPairCode = pair.value;
        const initialLoadOrPairChange = (newPairCode && newPairCode !== this.currentPairCode) ||
          this.rawChartDataPoints.length === 0;
        if (initialLoadOrPairChange) {
          this.currentPairCode = newPairCode;
          this.updateChartDataFlow();
        }
      });
    });
  }

  ngOnDestroy(): void {
    if (this.pairSubscription) this.pairSubscription.unsubscribe();
    if (this.candleSubscription) this.candleSubscription.unsubscribe();
    this.webSocketService.unsubscribeFromCandles();
  }

  selectInterval(interval: string): void {
    if (interval === this.currentInterval) return;
    this.currentInterval = interval;
    this.updateChartDataFlow();
  }

  selectChartType(t: 'candlestick' | 'line'): void {
    if (t === this.chartType) return;
    this.chartType = t;
    this.renderForCurrentChartType();
  }

  private updateChartDataFlow(): void {
    this.fetchHistoricalData();
    this.connectToLiveFeed();
    this.loadTradeVolume();
  }

  fetchHistoricalData(): void {
    this.tradeService.getHistoricalCandlesticks(this.currentPairCode, this.currentInterval, 200)
      .subscribe({
        next: (candles: any[]) => {
          const chartDataPoints = this.tradeService.mapToChartDataPoints(candles);
          this.loadChartData(chartDataPoints);
        },
        error: (err) => {
          console.error(`Failed to load historical candlestick data for ${this.currentPairCode}:`, err);
        }
      });
  }

  loadChartData(formattedData: any[]): void {
    this.rawChartDataPoints = formattedData || [];
    this.renderForCurrentChartType();
    console.log(`Loaded ${formattedData.length} historical candles for ${this.currentPairCode}.`);
  }

  /**
   * Centralized renderer: maps the canonical candlestick points into the correct
   * dataset structure for the currently selected chart type, and triggers chart update.
   */
  private renderForCurrentChartType(): void {
    if (this.chartType === 'candlestick') {
      // Candlestick: feed OHLC points directly
      this.chartData = {
        datasets: [{
          label: `${this.currentPairCode} Candles`,
          data: this.rawChartDataPoints,
          type: 'candlestick' as const
        }]
      };
      // apply candlestick options
      this.chartOptions = { ...this.chartOptions }; // already set above; preserved
    } else {
      // Line: use close prices from OHLC points
      const labels: any[] = [];
      const dataPoints: any[] = [];
      for (const p of this.rawChartDataPoints) {
        // p.x is expected to be a timestamp or Date, p.c the close price.
        labels.push(p.x);
        dataPoints.push({ x: p.x, y: Number(p.c) });
      }
      this.chartData = {
        labels,
        datasets: [{
          label: `${this.currentPairCode} Close Prices`,
          data: dataPoints,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.1,
          pointRadius: 2,
          fill: true,
          type: 'line' as const
        }]
      };
      // switch to line options
      this.chartOptions = { ...(this.chartOptionsLine as ChartOptions) };
    }

    // Let ng2-charts/Chart.js pick up the change
    setTimeout(() => this.chart?.update(), 0);
  }

  loadTradeVolume(): void {
    const pairCode = this.currentPairCode;
    this.tradeService.getTradeVolume(pairCode)
      .pipe(
        catchError(error => {
          this.tradeVolumeData.set(null);
          return of(null);
        })
      )
      .subscribe(tradeVolume => {
        if (tradeVolume) {
          this.tradeVolumeData.set({ ...tradeVolume });
          console.log('Trade Volume Signal Updated:', this.tradeVolumeData());
        }
      });
  }

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
        next: (candleUpdate: any) => {
          this.updateChartWithLiveCandle(candleUpdate);
        },
        error: (err) => {
          console.error('WebSocket candle update error:', err);
        }
      });
  }

  updateChartWithLiveCandle(candle: any): void {
    if (!this.rawChartDataPoints || this.rawChartDataPoints.length === 0) return;
    const newPoint = this.tradeService.mapToChartDataPoints([candle])[0];
    const data = this.rawChartDataPoints;
    const last = data[data.length - 1];

    if (last?.x === newPoint.x) {
      data[data.length - 1] = newPoint;
    } else if (newPoint.x > last?.x) {
      data.push(newPoint);
      if (data.length > 500) data.shift();
    }

    this.rawChartDataPoints = data;
    this.renderForCurrentChartType();
  }
}
