import {
  Component,
  OnInit,
  OnDestroy,
  NgZone,
  ChangeDetectorRef,
  PLATFORM_ID,
  Inject,
  ViewChild,
  signal,
  WritableSignal
} from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions, ChartData } from 'chart.js';
import { Subscription } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import {
  WebSocketService,
  PublicTradeDto,
} from '../../../core/services/websocket.service';
import { PairSelectionService } from '../../../core/services/pair-selection.service';
import {
  Chart,
  LinearScale,
  CategoryScale,
  LineController,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler // Added Filler for area chart (fill: true)
} from 'chart.js';
import { TradeService } from '../../../core/services/trade.service';
import { TradingPair } from '../../../model/trading_pair';
import { TradeVolumeDTO } from '../../../model/trade-volume.model'
import { catchError, of } from 'rxjs';
import { CommonModule, DecimalPipe } from '@angular/common';

// Explicitly register the necessary chart components (Fix for missing chart elements)
Chart.register(
  LinearScale,
  CategoryScale,
  LineController,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler
);

@Component({
  selector: 'app-price-chart',
  standalone: true,
  imports: [BaseChartDirective, CommonModule, DecimalPipe],
  templateUrl: './price-chart.component.html',
  styleUrl: './price-chart.component.css'
})
export class PriceChartComponent implements OnInit, OnDestroy {

  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  private subscriptions = new Subscription();
  private maxDataPoints = 100; // Limit the number of trades to display on the chart

  // Initializing with a safe default value (Fix for service initialization error)
  currentPair: TradingPair = { value: 'N/A', viewValue: 'N/A' } as TradingPair;

  isBrowser: boolean;

  trades: PublicTradeDto[] = [];
  currentPage = 0;
  public tradeVolumeData: TradeVolumeDTO | null = null;

  // Initial Chart Data Structure - Minimal default to avoid errors
  chartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [{
      label: 'Initializing...', // Temporary label
      data: [],
      borderColor: 'rgb(75, 192, 192)',
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      tension: 0.1,
      pointRadius: 3,
      fill: true
    }]
  };

  chartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: false,
        title: { display: true, text: 'Price' }
      },
      x: {
        title: { display: true, text: 'Time' },
        ticks: {
          autoSkip: true,
          maxTicksLimit: 10
        }
      }
    },
    plugins: {
      legend: { display: true },
      tooltip: { mode: 'index', intersect: false }
    }
  };

  constructor(
    private wsService: WebSocketService,
    private pairSelectionService: PairSelectionService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object,
    private tradeService: TradeService
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }


  ngOnInit(): void {
    // 1. Subscribe to pair selection changes (Runs AFTER dependency injection)
    this.subscriptions.add(
      this.pairSelectionService.selectedPair$.subscribe(pair => {
        if (pair && pair.value && pair.value !== this.currentPair.value) {
          this.currentPair = pair;
          this.resetChartData(); // Clear chart and set new label

          if (this.isBrowser) {
            this.wsService.subscribeToPublicTrades(pair.value);
            this.loadRecentTrades();
            this.loadTradeVolume();
          }
        }
      })
    );

    // 2. Subscribe to new trade data (must run in browser)
    if (this.isBrowser) {
      this.subscriptions.add(
        this.wsService.publicTrades$.subscribe((trades: PublicTradeDto[]) => {
          // Re-enter Angular's zone for change detection
          this.ngZone.run(() => {
            trades.forEach(trade => {
              this.addTradeToChart(trade);
            });
            this.cdr.detectChanges(); // Ensures UI updates correctly
          });
        })
      );
    }
  }

  // Set the chart label using the current pair value (Fix for [object Object] error)
  private setChartLabel(pair: TradingPair): void {
    if (this.chartData.datasets.length > 0) {
      this.chartData.datasets[0].label = `${pair.value} Trade Price`;
    }
  }

  loadRecentTrades(): void {
    if (!this.isBrowser || !this.currentPair || !this.currentPair.value) return;

    this.tradeService.getRecentTradesPaged(this.currentPair.value, this.currentPage, 100)
      .subscribe({
        next: (response) => {
          this.trades = response.content;
          this.currentPage = response.number;

          // Process initial trades in ascending order (oldest first for chart history)
          const tradesInAscendingOrder = [...response.content].reverse();

          this.chartData.labels = [];
          this.chartData.datasets[0].data = [];

          tradesInAscendingOrder.forEach(trade => {
            this.addTradeToChart(trade);
          });

          // Force chart update and UI refresh
          this.cdr.detectChanges();
          if (this.chart) {
            this.chart.update();
          }
        },
        error: (err) => {
          console.error(`Error fetching recent trades for ${this.currentPair.value}:`, err);
        }
      });
  }

  loadTradeVolume(): void {
    const pairCode = this.currentPair.value;
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


  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    if (this.isBrowser && this.currentPair.value !== 'N/A') {
      this.wsService.unsubscribeFromPublicTrades();
    }
  }

  private resetChartData(): void {
    this.chartData.labels = [];
    this.chartData.datasets[0].data = [];
    this.setChartLabel(this.currentPair); // Set the correct string label

    this.trades = [];

    if (this.chart) {
      this.chart.update();
    }
  }

  private addTradeToChart(trade: PublicTradeDto): void {
    if (!this.isBrowser || trade.pair !== this.currentPair.value) {
      return;
    }

    const price = parseFloat(trade.price);
    if (isNaN(price)) {
      console.warn('Invalid price received:', trade.price);
      return;
    }

    const timestamp = new Date(trade.timestamp);
    const timeLabel = this.formatTime(timestamp);

    const labels = this.chartData.labels as string[];
    const data = this.chartData.datasets[0].data as number[];

    // Add new data point (Enqueue)
    labels.push(timeLabel);
    data.push(price);

    // Limit data points (Dequeue)
    if (labels.length > this.maxDataPoints) {
      labels.shift();
      data.shift();
    }

    // Add new trade to the beginning of the list for display
    this.trades.unshift(trade);
    if (this.trades.length > 100) {
      this.trades.pop();
    }

    // Trigger Chart Update
    if (this.chart) {
      this.chart.update();
    }
  }

  private formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  }

  trackByTimestamp(index: number, trade: PublicTradeDto): string {
    return trade.timestamp;
  }
}
