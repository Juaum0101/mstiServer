import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TacticalGridComponent } from './tactical-grid.component';

describe('TacticalGridComponent', () => {
  let component: TacticalGridComponent;
  let fixture: ComponentFixture<TacticalGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TacticalGridComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TacticalGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
