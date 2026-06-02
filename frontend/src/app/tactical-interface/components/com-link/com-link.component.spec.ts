import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComLinkComponent } from './com-link.component';

describe('ComLinkComponent', () => {
  let component: ComLinkComponent;
  let fixture: ComponentFixture<ComLinkComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComLinkComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ComLinkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
