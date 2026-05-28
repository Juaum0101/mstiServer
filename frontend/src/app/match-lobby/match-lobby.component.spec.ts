import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MatchLobbyComponent } from './match-lobby.component';

describe('MatchLobbyComponent', () => {
  let component: MatchLobbyComponent;
  let fixture: ComponentFixture<MatchLobbyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatchLobbyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MatchLobbyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
