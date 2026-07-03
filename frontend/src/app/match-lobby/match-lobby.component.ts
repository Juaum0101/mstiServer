import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
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
export class MatchLobbyComponent implements OnInit {
  private gameStateService = inject(GameStateService);
  private router = inject(Router);
  state$: Observable<FullStatePayload | null> = this.gameStateService.state$;

  playerId = this.gameStateService.localPlayerId;
  playerName = this.gameStateService.localPlayerName;

  ngOnInit() {
    if (!this.playerName) {
      this.router.navigate(['/login']);
      return;
    }

    this.state$.subscribe(state => {
      if (state) {
         if (state.gameState.phaseId !== 'READY_PHASE') {
           this.router.navigate(['/tactical']);
         }
      }
    });
  }

  getActivePlayers(state: FullStatePayload | null) {
    if (!state) return [];
    return state.players;
  }

  voteToStart() {
    this.gameStateService.sendMessage('lobby/vote', { playerId: this.playerId, ready: true });
  }

  quitLobby() {
    this.gameStateService.sendMessage('lobby/quit', { playerId: this.playerId });
    this.router.navigate(['/login']);
  }
}
