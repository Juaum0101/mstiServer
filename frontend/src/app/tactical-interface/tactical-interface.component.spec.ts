import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TacticalInterfaceComponent } from './tactical-interface.component';

describe('TacticalInterfaceComponent', () => {
  let component: TacticalInterfaceComponent;
  let fixture: ComponentFixture<TacticalInterfaceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TacticalInterfaceComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TacticalInterfaceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
