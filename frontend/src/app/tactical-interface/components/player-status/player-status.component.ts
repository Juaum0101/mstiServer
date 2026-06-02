import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameStateService } from '../../../services/game-state.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-player-status',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (localPlayer(); as localPlayer) {
      <div class="p-6 border-b border-outline-variant bg-surface-container-lowest relative">
          <div class="absolute right-0 top-0 w-16 h-16 bg-primary opacity-5 blur-xl"></div>
          <h2 class="font-title-md text-on-surface mb-4 uppercase tracking-wider">{{ localPlayer.playerName }}</h2>
          
          <div class="space-y-4">
              <!-- HP Bar -->
              <div>
                  <div class="flex justify-between font-label-sm mb-1">
                      <span class="text-error">VITALITY</span>
                      <span class="text-on-surface">{{localPlayer.hp}}/{{localPlayer.maxHp}}</span>
                  </div>
                  <div class="h-2 w-full bg-surface-container-highest border border-outline-variant">
                      <div class="h-full bg-error transition-all duration-300" [style.width.%]="(localPlayer.hp / localPlayer.maxHp) * 100"></div>
                  </div>
              </div>
              
              <!-- Stamina Bar -->
              <div>
                  <div class="flex justify-between font-label-sm mb-1">
                      <span class="text-tertiary">STAMINA</span>
                      <span class="text-on-surface">{{localPlayer.stamina}}/10</span>
                  </div>
                  <div class="h-2 w-full bg-surface-container-highest border border-outline-variant">
                      <div class="h-full bg-tertiary transition-all duration-300" [style.width.%]="(localPlayer.stamina / 10) * 100"></div>
                  </div>
              </div>
          </div>
      </div>
    }
  `
})
export class PlayerStatusComponent {
  private gameStateService = inject(GameStateService);
  localPlayer = toSignal(
    this.gameStateService.state$.pipe(
      map(state => state?.players.find(p => p.playerId === this.gameStateService.localPlayerId) || null)
    )
  );
}
