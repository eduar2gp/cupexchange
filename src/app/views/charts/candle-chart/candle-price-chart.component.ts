import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  inject,
  signal,
  PLATFORM_ID,
  Inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription, of } from 'rxjs';
import { filter, catchError } from 'rxjs/operators';
import { BaseChartDirective } from 'ng2-charts';
import { isPlatformBrowser } from '@angular/common';
import {
  Chart,
  ChartData,
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
import { CandlestickController, CandlestickElement } from 'chartjs-chart-financial';
import 'chartjs-adapter-luxon';
import { TradeService } from '../../../../app/core/services/trade.service';
import { PairSelectionService } from '../../../../app/core/services/pair-selection.service';
import { WebSocketService } from '../../../core/services/websocket.service';
import { TradingPair } from '../../../model/trading_pair';
import { TradeVolumeDTO } from '../../../model/trade-volume.model';
import { first } from 'rxjs/operators';

/* ---------------- CHART REGISTER ---------------- */
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
  imports: [CommonModule, BaseChartDirective],
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
  public currentPairCode = 'USDCUP';
  public currentInterval = '5m';
  public chartType: 'candlestick' | 'line' = 'line';
  public tradeVolumeData = signal<TradeVolumeDTO | null>(null);

  private rawChartDataPoints: any[] = [];
  private SCALE = 10000; // dynamically updated

  public chartData: ChartData<any> = { datasets: [] };

  public chartOptions: ChartOptions<any> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: { display: true },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: (ctx: any) => {
            if (ctx.dataset.type === 'candlestick') {
              const { o, h, l, c } = ctx.raw;
              return [
                `Open:  ${(o / this.SCALE).toFixed(6)}`,
                `High:  ${(h / this.SCALE).toFixed(6)}`,
                `Low:   ${(l / this.SCALE).toFixed(6)}`,
                `Close: ${(c / this.SCALE).toFixed(6)}`
              ];
            } else {
              const real = ctx.parsed.y / this.SCALE;
              return `Price: ${real < 0.01 ? real.toFixed(6) : real.toFixed(3)}`;
            }
          }
        }
      }
    },
    scales: {
      x: {
        type: 'time',
        time: { unit: 'minute', tooltipFormat: 'll HH:mm' },
        ticks: { autoSkip: true, maxTicksLimit: 10 }
      },
      y: {
        type: 'linear',
        position: 'right',
        beginAtZero: false,
        grace: 0,
        ticks: {
          callback: (v: number) => {
            const real = v / this.SCALE;
            return real < 0.01 ? real.toFixed(6) : real.toFixed(3);
          }
        }
      }
    }
  };

  public watermarkPlugin = {
    id: 'watermark',
    beforeDraw: (chart: any) => {
      const {
        ctx,
        chartArea: { top, left, width, height }
      } = chart;
      ctx.save();
      ctx.font = 'bold 40px Roboto, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        this.currentPairCode,
        left + width / 2,
        top + height / 2
      );
      ctx.restore();
    }
  };

  isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    // Determine once if we are in the browser
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  //ngOnInit(): void {
  //  if (this.isBrowser) {
  //    this.subscribeToCandleUpdates();
  //    this.pairSubscription = this.pairSelectionService.selectedPair$.subscribe(
  //      (pair: TradingPair | null) => {
  //        if (!pair) return;
  //        if (pair.value !== this.currentPairCode) {
  //          this.currentPairCode = pair.value;
  //          this.updateChartDataFlow();
  //        }
  //      }
  //    );
  //  }
  //}

  ngOnInit(): void {
    if (this.isBrowser) {
      this.subscribeToCandleUpdates();

      // 1. Immediately grab the current value and trigger the flow
      const startingPair = this.pairSelectionService.getCurrentPair();
      if (startingPair) {
        this.currentPairCode = startingPair.value;
        this.updateChartDataFlow();
      }

      // 2. Listen for future changes
      this.pairSubscription = this.pairSelectionService.selectedPair$.subscribe(
        (pair: TradingPair | null) => {
          if (!pair) return;

          // 3. Only trigger if the pair is actually different from what's currently loaded
          if (pair.value !== this.currentPairCode) {
            this.currentPairCode = pair.value;
            this.updateChartDataFlow();
          }
        }
      );
    }
  }

  ngOnDestroy(): void {
    this.pairSubscription?.unsubscribe();
    this.candleSubscription?.unsubscribe();
    this.webSocketService.unsubscribeFromCandles();
  }

  public selectInterval(interval: string): void {
    if (interval === this.currentInterval) return;
    this.currentInterval = interval;
    this.updateChartDataFlow();
  }

  public selectChartType(type: 'candlestick' | 'line'): void {
    if (type === this.chartType) return;
    this.chartType = type;
    this.renderForCurrentChartType();
  }

  private updateChartDataFlow(): void {
    this.fetchHistoricalData();
    this.connectToLiveFeed();
    this.loadTradeVolume();
  }

  private fetchHistoricalData(): void {
    this.tradeService
      .getHistoricalCandlesticks(this.currentPairCode, this.currentInterval, 200)
      .pipe(first())
      .subscribe({
        next: candles => {
          this.rawChartDataPoints = this.tradeService.mapToChartDataPoints(candles) || [];
          this.renderForCurrentChartType();
        }
      });
  }

  private computeScale(data: any[]): number {
    const values = data
      .map(p => Number(p.c))
      .filter(v => Number.isFinite(v) && v > 0);
    if (!values.length) return 100000;
    const min = Math.min(...values);
    // Make small values appear larger on chart (aim for 100–1,000,000 scale)
    return min > 0 ? Math.pow(10, Math.ceil(Math.log10(1 / min)) + 2) : 100000;
  }

  private computeYRange(data: any[]) {
    const values = data
      .map(p => Number(p.c))
      .filter(v => Number.isFinite(v) && v > 0);

    if (!values.length) return { min: 0, max: 1 };

    let min = Math.min(...values);
    let max = Math.max(...values);

    // Force a minimum visible range (relative to price level)
    const forcedMinRange = min * 0.05; // at least 5% of the price level
    const currentRange = max - min;

    if (currentRange < forcedMinRange) {
      const center = (min + max) / 2;
      min = center - forcedMinRange / 2;
      max = center + forcedMinRange / 2;
    }

    // Add padding
    const padding = (max - min) * 0.15;
    return {
      min: Math.max(0, min - padding),
      max: max + padding
    };
  }

  private renderForCurrentChartType(): void {
    if (!this.rawChartDataPoints?.length) {
      this.chartData.datasets = [];
      this.chart?.update();
      return;
    }

    this.SCALE = this.computeScale(this.rawChartDataPoints);
    const range = this.computeYRange(this.rawChartDataPoints);

    // Optional: debug output – remove later if not needed
    console.log(`Pair: ${this.currentPairCode} | SCALE: ${this.SCALE}`);
    console.log(`Y range (real): ${range.min.toFixed(8)} – ${range.max.toFixed(8)}`);
    const closes = this.rawChartDataPoints.map(p => Number(p.c));
    const minC = Math.min(...closes).toFixed(8);
    const maxC = Math.max(...closes).toFixed(8);
    const diff = (Number(maxC) - Number(minC)).toFixed(8);
    console.log(`Close min/max/diff: ${minC} – ${maxC} (${diff})`);

    if (range && this.chartOptions.scales?.['y']) {
      this.chartOptions.scales['y'].min = range.min * this.SCALE;
      this.chartOptions.scales['y'].max = range.max * this.SCALE;
    }

    if (this.chartType === 'candlestick') {
      this.chartData = {
        datasets: [{
          label: this.currentPairCode,
          type: 'candlestick',
          data: this.rawChartDataPoints.map(p => ({
            x: p.x,
            o: Number(p.o) * this.SCALE,
            h: Number(p.h) * this.SCALE,
            l: Number(p.l) * this.SCALE,
            c: Number(p.c) * this.SCALE
          })),       
          borderColor: {
            up: '#00ff9d',
            down: '#ff3366',
            unchanged: '#999'
          },
          backgroundColor: {
            up: 'rgba(0, 255, 157, 0.6)',
            down: 'rgba(255, 51, 102, 0.6)',
            unchanged: '#999'
          }
        }]
      };
    } else {
      this.chartData = {
        datasets: [{
          label: `${this.currentPairCode} Close`,
          type: 'line',
          data: this.rawChartDataPoints.map(p => ({
            x: p.x,
            y: Number(p.c) * this.SCALE
          })),
          pointRadius: 0,
          tension: 0.1,
          borderWidth: 2,
          fill: 'origin',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgb(75,192,192)'
        }]
      };
    }

    setTimeout(() => this.chart?.update('none'), 0);
  }

  private subscribeToCandleUpdates(): void {
    this.candleSubscription = this.webSocketService.candleUpdates$
      .pipe(
        filter(
          c =>
            c.pair === this.currentPairCode &&
            c.interval === this.currentInterval
        )
      )
      .subscribe(candle => this.updateWithLiveCandle(candle));
  }

  private updateWithLiveCandle(candle: any): void {
    if (!this.rawChartDataPoints.length) return;

    const newPoint = this.tradeService.mapToChartDataPoints([candle])[0];
    const last = this.rawChartDataPoints[this.rawChartDataPoints.length - 1];

    if (last?.x === newPoint.x) {
      this.rawChartDataPoints[this.rawChartDataPoints.length - 1] = newPoint;
    } else if (newPoint.x > last?.x) {
      this.rawChartDataPoints.push(newPoint);
      if (this.rawChartDataPoints.length > 500) {
        this.rawChartDataPoints.shift();
      }
    }

    this.renderForCurrentChartType();
  }

  private loadTradeVolume(): void {
    this.tradeService
      .getTradeVolume(this.currentPairCode)
      .pipe(catchError(() => of(null)))
      .subscribe(v => v && this.tradeVolumeData.set(v));
  }

  private connectToLiveFeed(): void {
    this.webSocketService.subscribeToCandles(
      this.currentPairCode,
      this.currentInterval
    );
  }
}
