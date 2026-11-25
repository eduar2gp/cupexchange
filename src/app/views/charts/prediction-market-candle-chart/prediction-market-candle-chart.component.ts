import {
  ChangeDetectorRef,
  Component,
  Inject,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  SimpleChanges,
  ViewChild,
  inject
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Subscription, forkJoin } from 'rxjs';
import { BaseChartDirective } from 'ng2-charts';
import {
  Chart,
  ChartData,
  ChartOptions,
  Filler,
  Legend,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  TimeScale,
  Tooltip
} from 'chart.js';
import 'chartjs-adapter-luxon';
import { TradeService } from '../../../core/services/trade.service';
import { ChartDataPoint } from '../../../model/candle-stick-data.model';
import { OutcomePosition } from '../../../model/prediction-candle-stick-data.model';
import { ChartMarketInput, ChartSeries } from '../../../model/chart-market-input.model';


Chart.register(
  TimeScale,
  LinearScale,
  Tooltip,
  Legend,
  LineController,
  PointElement,
  LineElement,
  Filler
);

@Component({
  selector: 'app-prediction-market-candle-chart',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './prediction-market-candle-chart.component.html',
  styleUrl: './prediction-market-candle-chart.component.scss',
})
export class PredictionMarketCandleChartComponent implements OnChanges, OnDestroy, OnInit {
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  @Input() markets: ChartMarketInput[] = [];
  @Input() yesLabel = 'Yes';
  @Input() noLabel = 'No';

  private readonly tradeService = inject(TradeService);
  private requestSubscription?: Subscription;
  private readonly maxPoints = 300;
  private readonly maxMultiMarkets = 6; // Prevent chart clutter on large events
  private seriesList: ChartSeries[] = [];
  private scale = 1;

  // Distinct palette for multi-market lines
  private readonly palette = [
    '#2563eb', // Blue
    '#16a34a', // Green
    '#d97706', // Amber
    '#9333ea', // Purple
    '#0891b2', // Cyan
    '#e11d48'  // Rose
  ];

  readonly availableIntervals = ['1m', '5m', '15m', '30m', '1h', '4h', '1d'];
  currentInterval = '1m';
  isBrowser: boolean;
  isLoading = false;
  errorMessage = '';
  chartData: ChartData<'line'> = { datasets: [] };
  chartOptions: ChartOptions<'line'> = this.createChartOptions();

  
  private readonly rawChartDataByOutcome: Record<OutcomePosition, ChartDataPoint[]> = {
    YES: [],
    NO: []
  };
  

  private createChartOptions(): ChartOptions<'line'> {
    return {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    parsing: false,
    plugins: { legend: { display: true } },
    scales: {
      x: {
        type: 'time',
        time: { tooltipFormat: 'll HH:mm' },
        ticks: { autoSkip: true, maxTicksLimit: 10 }
      },
      y: {
        type: 'linear',
        position: 'right',
        ticks: {
          callback: (value: string | number) => (Number(value) / this.scale).toFixed(3)
        }
      }
    }
    };
  }

  constructor(
    @Inject(PLATFORM_ID) platformId: object,
    private readonly cdr: ChangeDetectorRef
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    // During SSR hydration Angular can retain the initial input value without
    // delivering an initial `ngOnChanges` notification in the browser.
    // Start the browser-only request here so the initial chart always loads.
    if (this.isBrowser) {
      this.loadChartData();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['predictionMarketId'] && !changes['predictionMarketId'].firstChange && this.isBrowser) {
      this.loadChartData();
    } else if ((changes['yesLabel'] || changes['noLabel']) && this.chartData.datasets.length) {
      this.renderChart();
    }
  }

  ngOnDestroy(): void {
    this.requestSubscription?.unsubscribe();
  }

  selectInterval(interval: string): void {
    if (interval === this.currentInterval) return;

    this.currentInterval = interval;
    this.updateTimeScale();
    this.loadChartData();
  }

  private loadChartData(): void {
    const validMarkets = (this.markets ?? []).filter(m => m?.id > 0);
    if (!validMarkets.length) {
      this.clearChartData();
      return;
    }

    this.requestSubscription?.unsubscribe();
    this.isLoading = true;
    this.errorMessage = '';

    if (validMarkets.length === 1) {
      this.loadSingleMarketData(validMarkets[0]);
    } else {
      this.loadMultiMarketData(validMarkets.slice(0, this.maxMultiMarkets));
    }
  }

  private loadSingleMarketData(market: ChartMarketInput): void {
    this.requestSubscription = forkJoin({
      yes: this.tradeService.getPredictionMarketCandlesticks(market.id, 'YES', this.currentInterval, 500),
      no: this.tradeService.getPredictionMarketCandlesticks(market.id, 'NO', this.currentInterval, 500)
    }).subscribe({
      next: ({ yes, no }) => {
        this.seriesList = [
          {
            label: this.yesLabel,
            color: '#16a34a',
            points: this.tradeService.mapMarketCandlesToChartDataPoints(yes).slice(-this.maxPoints)
          },
          {
            label: this.noLabel,
            color: '#dc2626',
            points: this.tradeService.mapMarketCandlesToChartDataPoints(no).slice(-this.maxPoints)
          }
        ];
        this.isLoading = false;
        this.renderChart();
      },
      error: () => this.handleLoadError()
    });
  }

  private loadMultiMarketData(markets: ChartMarketInput[]): void {
    const requests = markets.map(market =>
      this.tradeService.getPredictionMarketCandlesticks(market.id, 'YES', this.currentInterval, 500)
    );

    this.requestSubscription = forkJoin(requests).subscribe({
      next: (responses) => {
        this.seriesList = responses.map((candles, index) => ({
          label: markets[index].label,
          color: this.palette[index % this.palette.length],
          points: this.tradeService.mapMarketCandlesToChartDataPoints(candles).slice(-this.maxPoints)
        }));
        this.isLoading = false;
        this.renderChart();
      },
      error: () => this.handleLoadError()
    });
  }

  private handleLoadError(): void {
    this.clearChartData();
    this.isLoading = false;
    this.errorMessage = 'Unable to load prediction market chart data.';
    this.cdr.markForCheck();
  }

  private clearChartData(): void {
    this.rawChartDataByOutcome.YES = [];
    this.rawChartDataByOutcome.NO = [];
    this.chartData = { datasets: [] };
    this.seriesList = [];
    this.chartData = { datasets: [] };
  }

  private renderChart(): void {
    const allData = this.seriesList.flatMap(series => series.points);
    if (!allData.length) {
      this.chartData = { datasets: [] };
      return;
    }

    this.scale = this.computeScale(allData);
    const range = this.computeYRange(allData);
    const yScale = this.chartOptions.scales?.['y'];
    if (yScale) {
      yScale.min = range.min * this.scale;
      yScale.max = range.max * this.scale;
    }

    this.chartData = {
      datasets: this.seriesList.map(series => ({
        label: series.label,
        data: series.points.map(point => ({
          x: point.x,
          y: point.c * this.scale
        })),
        borderColor: series.color,
        backgroundColor: series.color,
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.1
      }))
    };

    this.cdr.detectChanges();
    setTimeout(() => this.chart?.update('none'));
  }

  private createOutcomeDataset(outcomePosition: OutcomePosition, borderColor: string) {
    return {
      label: outcomePosition === 'YES' ? this.yesLabel : this.noLabel,
      data: this.rawChartDataByOutcome[outcomePosition].map(point => ({
        x: point.x,
        y: point.c * this.scale
      })),
      borderColor,
      backgroundColor: borderColor,
      borderWidth: 2,
      pointRadius: 0,
      tension: 0.1
    };
  }

  private updateTimeScale(): void {
    if (!this.chartOptions.scales) return;

    this.chartOptions.scales['x'] = {
      type: 'time',
      time: { unit: this.getTimeUnit(), tooltipFormat: 'll HH:mm' },
      ticks: { autoSkip: true, maxTicksLimit: 10 }
    };
  }

  private getTimeUnit(): 'minute' | 'hour' | 'day' {
    if (this.currentInterval.endsWith('d')) return 'day';
    return this.currentInterval.endsWith('h') ? 'hour' : 'minute';
  }

  private computeScale(data: ChartDataPoint[]): number {
    const min = Math.min(...data.flatMap(point => [point.o, point.h, point.l, point.c]).filter(value => value > 0));
    return Number.isFinite(min) ? Math.pow(10, Math.ceil(Math.log10(1 / min)) + 2) : 1;
  }

  private computeYRange(data: ChartDataPoint[]): { min: number; max: number } {
    const values = data.flatMap(point => [point.l, point.h]).filter(value => value >= 0);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = (max - min || max || 1) * 0.15;
    return { min: Math.max(0, min - padding), max: max + padding };
  }

}
