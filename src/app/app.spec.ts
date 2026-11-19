import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should request geolocation and update coordinates in the browser', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    let callCount = 0;

    const getCurrentPosition = (success: PositionCallback) => {
      callCount += 1;
      success({
        coords: {
          latitude: 12.3456,
          longitude: -67.8901,
        },
      } as GeolocationPosition);
    };

    Object.defineProperty(navigator, 'geolocation', {
      value: { getCurrentPosition },
      configurable: true,
    });

    app.requestLocation();

    expect(callCount).toBe(1);
    expect(app.latitude()).toBe(12.3456);
    expect(app.longitude()).toBe(-67.8901);
    expect(app.errorMessage()).toBeNull();
  });
});
