import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GameStateService } from '../services/game-state.service';
import { Observable } from 'rxjs';
import { FullStatePayload } from '../models/game.models';

@Component({
  selector: 'app-game-config',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './game-config.component.html',
})
export class GameConfigComponent {
  private gameStateService = inject(GameStateService);
  state$: Observable<FullStatePayload | null> = this.gameStateService.state$;
  
  get isAdmin(): boolean {
    return this.gameStateService.localPlayerName.toLowerCase() === 'monruse';
  }

  // Admin Config State
  mutationsAllowed = true;
  marksActive = true;
  techniquesEnabled = true;
  classVisibility = false;
  namesVisible = true;
  newbieMode = false;
  
  fogRange = 4;
  perTurnLimit = 60;
  matchTimer = 15;

  applyConfig() {
    this.gameStateService.sendMessage('lobby/config', {
      mutationsAllowed: this.mutationsAllowed,
      marksActive: this.marksActive,
      techniquesEnabled: this.techniquesEnabled,
      classVisibility: this.classVisibility,
      namesVisible: this.namesVisible,
      newbieMode: this.newbieMode,
      fogRange: this.fogRange,
      perTurnLimit: this.perTurnLimit,
      matchTimer: this.matchTimer
    });
  }

  forceStartMatch() {
    this.applyConfig();
    this.gameStateService.adminStartMatch();
  }

  forceResetGame() {
    this.gameStateService.adminResetGame();
  }
}
