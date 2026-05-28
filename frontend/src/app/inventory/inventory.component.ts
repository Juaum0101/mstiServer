import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GameStateService } from '../services/game-state.service';
import { Observable } from 'rxjs';
import { FullStatePayload } from '../models/game.models';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventory.component.html',
})
export class InventoryComponent {
  private gameStateService = inject(GameStateService);
  state$: Observable<FullStatePayload | null> = this.gameStateService.state$;
  
  localPlayer$ = this.state$.pipe(
    map(state => state?.players.find(p => p.playerId === this.gameStateService.localPlayerId) || null)
  );

  head = 'None';
  torso = 'None';
  leftHand = 'None';
  rightHand = 'None';

  // Available items (mocked for now, this would normally come from the player's saved inventory)
  availableWeapons = ['None', 'Longsword', 'Shield', 'Dagger', 'Spear'];
  availableHeads = ['None', 'Iron Helm', 'Leather Hood'];
  availableTorsos = ['None', 'Chainmail', 'Leather Armor'];

  syncFromState(player: any) {
    if (player) {
      this.head = player.equippedItems.head;
      this.torso = player.equippedItems.torso;
      this.leftHand = player.equippedItems.leftHand;
      this.rightHand = player.equippedItems.rightHand;
    }
  }

  swapHands() {
    const temp = this.leftHand;
    this.leftHand = this.rightHand;
    this.rightHand = temp;
  }

  applyChanges() {
    this.gameStateService.sendMessage('game/equip', {
      playerId: this.gameStateService.localPlayerId,
      head: this.head,
      torso: this.torso,
      leftHand: this.leftHand,
      rightHand: this.rightHand
    });
  }
}
