import { Component, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GameStateService } from '../services/game-state.service';

@Component({
  selector: 'app-build-selection',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './build-selection.component.html',
})
export class BuildSelectionComponent {
  @Output() joined = new EventEmitter<void>();
  private gameStateService = inject(GameStateService);

  playerName = '';
  playerId = 'P' + Math.floor(Math.random() * 1000); // Random ID for testing
  
  head = 'None';
  torso = 'None';
  leftHand = 'None';
  rightHand = 'None';

  hasAlpha = false;
  hasBeta = false;

  joinGame() {
    if (!this.playerName.trim()) return;

    const payload = {
      playerId: this.playerId,
      playerName: this.playerName,
      equippedItems: {
        head: this.head,
        torso: this.torso,
        leftHand: this.leftHand,
        rightHand: this.rightHand
      },
      mutations: {
        hasAny: this.hasAlpha || this.hasBeta,
        hasAlpha: this.hasAlpha,
        hasBeta: this.hasBeta
      },
      isTwoHanding: (this.leftHand !== 'None' && this.leftHand === this.rightHand)
    };

    this.gameStateService.joinGame(payload);
    this.joined.emit();
  }
}
