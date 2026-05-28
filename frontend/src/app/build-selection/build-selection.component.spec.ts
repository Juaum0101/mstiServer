import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BuildSelectionComponent } from './build-selection.component';

describe('BuildSelectionComponent', () => {
  let component: BuildSelectionComponent;
  let fixture: ComponentFixture<BuildSelectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BuildSelectionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BuildSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
