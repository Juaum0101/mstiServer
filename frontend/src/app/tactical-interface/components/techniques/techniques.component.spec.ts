import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TechniquesComponent } from './techniques.component';

describe('TechniquesComponent', () => {
  let component: TechniquesComponent;
  let fixture: ComponentFixture<TechniquesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TechniquesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TechniquesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
