import { Component, OnInit } from '@angular/core';
import { PredictionMarketService } from '../../../../app/core/services/prediction-market.service';
import { PredictionOrderRequest } from '../../../model/prediction-order-request.model'

@Component({
  selector: 'app-add-prediction-order',
  imports: [],
  templateUrl: './add-prediction-order.html',
  styleUrl: './add-prediction-order.scss',
})
export class AddPredictionOrder implements OnInit {
  
  constructor(private predictionMarketService: PredictionMarketService) {}

  ngOnInit(): void {
  }

}
