import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  inject,
  signal,
  PLATFORM_ID,
  Inject, effect
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Subscription, of } from 'rxjs';
import { filter, catchError, first } from 'rxjs/operators';
import { BaseChartDirective } from 'ng2-charts';

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

  public availableIntervals = ['1m', '5m', '15m', '30m', '1h', '4h', '1d'];
  public currentPairCode = 'USDCUP';
  public currentInterval = '5m';
  public chartType: 'candlestick' | 'line' = 'line';
  public tradeVolumeData = signal<TradeVolumeDTO | null>(null);

  private rawChartDataPoints: any[] = [];
  private SCALE = 10000;

  // 🔥 HARD LIMIT to avoid Chart.js crashes
  private readonly MAX_POINTS = 300;

  public chartData: ChartData<any> = { datasets: [] };

  public chartOptions: ChartOptions<any> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    parsing: false, // performance boost
    plugins: {
      legend: { display: true }
    },
    scales: {
      x: {
        type: 'time',
        time: {
          tooltipFormat: 'll HH:mm'
        },
        ticks: {
          autoSkip: true,
          maxTicksLimit: 10
        }
      },
      y: {
        type: 'linear',
        position: 'right',
        ticks: {
          callback: (v: number) => {
            const real = v / this.SCALE;
            return real < 0.01 ? real.toFixed(6) : real.toFixed(3);
          }
        }
      }
    }
  };

  isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);

    effect(() => {
      const pair = this.pairSelectionService.selectedPair();

      if (!pair) return;

      if (pair.value === this.currentPairCode) return;

      this.currentPairCode = pair.value;

      console.log('Pair changed:', pair.value);

      this.updateChartDataFlow();
    });
  }

  ngOnInit(): void {
    if (!this.isBrowser) return;

    this.subscribeToCandleUpdates();

    const startingPair = this.pairSelectionService.getCurrentPair();
    if (startingPair) {
      this.currentPairCode = startingPair.value;
      this.updateChartDataFlow();
    }

    
  }

  ngOnDestroy(): void {
    this.pairSubscription?.unsubscribe();
    this.candleSubscription?.unsubscribe();
    this.webSocketService.unsubscribeFromCandles();
  }

  /* ---------------- INTERVAL + TYPE ---------------- */

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

  /* ---------------- CORE FLOW ---------------- */

  private updateChartDataFlow(): void {
    this.fetchHistoricalData();
    this.connectToLiveFeed();
    this.loadTradeVolume();
    this.updateTimeScale(); // 🔥 critical fix
  }

  /* ---------------- TIME SCALE FIX ---------------- */

  private getTimeUnit(): 'minute' | 'hour' | 'day' {
    switch (this.currentInterval) {
      case '1m':
      case '5m':
      case '15m':
      case '30m':
        return 'minute';
      case '1h':
      case '4h':
        return 'hour';
      case '1d':
        return 'day';
      default:
        return 'minute';
    }
  }

  private updateTimeScale(): void {
    if (!this.chartOptions.scales) return;

    this.chartOptions.scales['x'] = {
      type: 'time',
      time: {
        unit: this.getTimeUnit(),
        tooltipFormat: 'll HH:mm'
      },
      ticks: {
        autoSkip: true,
        maxTicksLimit: 10
      }
    };
  }

  /* ---------------- DATA ---------------- */

  private fetchHistoricalData(): void {
    this.tradeService
      .getHistoricalCandlesticks(this.currentPairCode, this.currentInterval, 500)
      .pipe(first())
      .subscribe(candles => {
        let data = this.tradeService.mapToChartDataPoints(candles) || [];

        // 🔥 LIMIT DATA SIZE
        if (data.length > this.MAX_POINTS) {
          data = data.slice(-this.MAX_POINTS);
        }

        this.rawChartDataPoints = data;
        this.renderForCurrentChartType();
      });
  }

  private computeScale(data: any[]): number {
    const values = data.map(p => Number(p.c)).filter(v => v > 0);
    if (!values.length) return 100000;
    const min = Math.min(...values);
    return Math.pow(10, Math.ceil(Math.log10(1 / min)) + 2);
  }

  private computeYRange(data: any[]) {
    const values = data.map(p => Number(p.c)).filter(v => v > 0);
    if (!values.length) return { min: 0, max: 1 };

    let min = Math.min(...values);
    let max = Math.max(...values);

    const padding = (max - min) * 0.15;
    return {
      min: Math.max(0, min - padding),
      max: max + padding
    };
  }

  /* ---------------- RENDER ---------------- */

  private renderForCurrentChartType(): void {
    if (!this.rawChartDataPoints.length) {
      this.chartData.datasets = [];
      this.chart?.update();
      return;
    }

    this.SCALE = this.computeScale(this.rawChartDataPoints);
    const range = this.computeYRange(this.rawChartDataPoints);

    if (this.chartOptions.scales?.['y']) {
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
            o: p.o * this.SCALE,
            h: p.h * this.SCALE,
            l: p.l * this.SCALE,
            c: p.c * this.SCALE
          }))
        }]
      };
    } else {
      this.chartData = {
        datasets: [{
          label: `${this.currentPairCode} Close`,
          type: 'line',
          fill: true,
          data: this.rawChartDataPoints.map(p => ({
            x: p.x,
            y: p.c * this.SCALE
          })),
          pointRadius: 0,
          tension: 0.1
        }]
      };
    }

    setTimeout(() => this.chart?.update('none'), 0);
  }

  /* ---------------- LIVE ---------------- */

  private subscribeToCandleUpdates(): void {
    this.candleSubscription = this.webSocketService.candleUpdates$
      .pipe(
        filter(c =>
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

      // 🔥 enforce limit in real-time too
      if (this.rawChartDataPoints.length > this.MAX_POINTS) {
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

  public watermarkPlugin = {
    id: 'watermark',
    beforeDraw: (chart: any) => {
      const {
        ctx,
        chartArea: { top, left, width, height }
      } = chart;

      if (!width || !height) return; // safety

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
}