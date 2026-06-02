import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameStateService } from '../../../services/game-state.service';
import { FullStatePayload } from '../../../models/game.models';

@Component({
  selector: 'app-com-link',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="blueprint-card bg-surface-container p-3 h-32 md:h-48 flex flex-col shrink-0">
        <h3 class="font-label-sm text-primary mb-2 uppercase tracking-widest flex items-center gap-2 border-b border-outline/30 pb-2">
            <span class="material-symbols-outlined text-[14px]">terminal</span> COM-LINK
        </h3>
        <div class="flex-1 overflow-y-auto custom-scrollbar flex flex-col-reverse space-y-reverse space-y-1">
            @for (log of logs; track $index) {
              <div class="font-mono text-[11px] text-on-surface-variant leading-relaxed">
                  <span [ngClass]="{'text-primary': log.includes('Phase:'), 'text-error': log.includes('damage') || log.includes('fallen'), 'text-secondary': log.includes('TURN')}">
                      {{ log }}
                  </span>
              </div>
            }
        </div>
    </div>
  `
})
export class ComLinkComponent implements OnInit {
  private gameStateService = inject(GameStateService);
  
  logs: string[] = ['System Initialized. Welcome to Morningstar.'];
  private previousState: FullStatePayload | null = null;

  ngOnInit() {
    this.gameStateService.state$.subscribe(state => {
       if (this.previousState && state) {
          if (this.previousState.gameState.turnNumber !== state.gameState.turnNumber && state.gameState.turnNumber > 0) {
             this.addLog(`--- TURN ${state.gameState.turnNumber} ---`);
          }
          if (this.previousState.gameState.phaseId !== state.gameState.phaseId) {
             this.addLog(`Phase: ${state.gameState.phaseId.replace('_', ' ')}`);
          }
          
          state.players.forEach(p => {
             const oldP = this.previousState?.players.find(old => old.playerId === p.playerId);
             if (oldP) {
                if (oldP.position[0] !== p.position[0] || oldP.position[1] !== p.position[1]) {
                   this.addLog(`${p.playerName} moved to [${p.position[0]}, ${p.position[1]}]`);
                }
                if (oldP.hp > p.hp) {
                   this.addLog(`${p.playerName} took ${oldP.hp - p.hp} damage!`);
                }
                if (!oldP.isFallen && p.isFallen) {
                   this.addLog(`💀 ${p.playerName} has fallen!`);
                }
             } else if (state.gameState.phaseId !== 'READY_PHASE') {
                this.addLog(`${p.playerName} appeared from the fog.`);
             }
          });
       }
       if (state) {
         this.previousState = JSON.parse(JSON.stringify(state));
       }
    });
  }

  addLog(msg: string) {
    const timestamp = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    this.logs.unshift(`[${timestamp}] ${msg}`);
    if (this.logs.length > 50) {
      this.logs.pop();
    }
  }
}
