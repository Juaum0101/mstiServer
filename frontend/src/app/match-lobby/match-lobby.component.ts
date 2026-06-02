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

  head = 'None';
  torso = 'None';
  leftHand = 'None';
  rightHand = 'None';
  hasAlpha = false;
  hasBeta = false;

  ngOnInit() {
    // If not logged in (no name), go to login
    if (!this.playerName) {
      this.router.navigate(['/login']);
      return;
    }

    this.state$.subscribe(state => {
      if (state) {
         const me = state.players.find(p => p.playerId === this.playerId && p.active);
         if (me) {
            this.head = me.equippedItems.head || 'None';
            this.torso = me.equippedItems.torso || 'None';
            this.leftHand = me.equippedItems.leftHand || 'None';
            this.rightHand = me.equippedItems.rightHand || 'None';
            this.hasAlpha = me.mutations.hasAlpha;
            this.hasBeta = me.mutations.hasBeta;
         }
         
         if (state.gameState.phaseId !== 'READY_PHASE') {
           this.router.navigate(['/tactical']);
         }
      }
    });
  }

  updateEquipment() {
    const payload = {
      playerId: this.playerId,
      head: this.head,
      torso: this.torso,
      leftHand: this.leftHand,
      rightHand: this.rightHand
    };
    this.gameStateService.sendMessage('game/equip', payload);
  }

  // Mutations require rejoin currently since game/equip doesn't handle them
  updateMutations() {
    const payload = {
      playerId: this.playerId,
      playerName: this.playerName,
      equippedItems: { head: this.head, torso: this.torso, leftHand: this.leftHand, rightHand: this.rightHand },
      mutations: {
        hasAny: this.hasAlpha || this.hasBeta,
        hasAlpha: this.hasAlpha,
        hasBeta: this.hasBeta
      },
      isTwoHanding: (this.leftHand !== 'None' && this.leftHand === this.rightHand)
    };
    this.gameStateService.joinGame(payload);
  }

  getActivePlayers(state: FullStatePayload | null) {
    if (!state) return [];
    return state.players;
  }

  voteToStart() {
    this.gameStateService.sendMessage('lobby/vote', { playerId: this.playerId, ready: true });
  }
}
