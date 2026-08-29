import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { RegionalBalanceService } from '../../core/services/regional-balance.service';
import { RegionalBalanceResponse } from '../../model/regional-balance.model';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-regional-balance',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    TranslateModule
  ],
  templateUrl: './regional-balance.component.html',
  styleUrl: './regional-balance.component.scss',
})
export class RegionalBalanceComponent implements OnInit {
  regionalBalance$!: Observable<RegionalBalanceResponse>;
  displayedColumns: string[] = ['currency', 'totalBalance', 'totalAccounts'];

  constructor(private regionalBalanceService: RegionalBalanceService) {}

  ngOnInit(): void {
    this.regionalBalance$ = this.regionalBalanceService.getRegionalBalance();
  }

  // Helper for strictly-typed template access if needed
  municipalityList(province: any) {
    return province.municipalities;
  }
}