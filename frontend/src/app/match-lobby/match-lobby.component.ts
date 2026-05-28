import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GameStateService } from '../services/game-state.service';
import { FullStatePayload } from '../models/game.models';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-match-lobby',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './match-lobby.component.html',
})
export class MatchLobbyComponent {
  private gameStateService = inject(GameStateService);
  state$: Observable<FullStatePayload | null> = this.gameStateService.state$;

  // Build State
  hasJoined = false;
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
    this.gameStateService.localPlayerId = this.playerId;
    this.gameStateService.localPlayerName = this.playerName;
    this.gameStateService.joinGame(payload);
    this.hasJoined = true;
  }

  getActivePlayers(state: FullStatePayload | null) {
    if (!state) return [];
    return state.players;
  }

  voteToStart() {
    console.log("Voting to start");
    this.gameStateService.sendMessage('lobby/vote', { playerId: this.playerId, ready: true });
    console.log("Vote sent");
  }
}
