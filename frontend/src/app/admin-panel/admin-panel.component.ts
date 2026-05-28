import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameStateService } from '../services/game-state.service';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-panel.component.html',
})
export class AdminPanelComponent {
  private gameStateService = inject(GameStateService);

  startMatch() {
    this.gameStateService.adminStartMatch();
  }

  resetGame() {
    this.gameStateService.adminResetGame();
  }
}
