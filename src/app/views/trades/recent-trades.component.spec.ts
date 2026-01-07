import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecentTradesComponent } from './recent-trades.component';

describe('RecentTradesComponent', () => {
  let component: RecentTradesComponent;
  let fixture: ComponentFixture<RecentTradesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecentTradesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RecentTradesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
