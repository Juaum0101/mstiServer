import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameStateService } from '../services/game-state.service';
import { Observable, map } from 'rxjs';
import { FullStatePayload, Player, ActionIntentType } from '../models/game.models';
import { HttpClient } from '@angular/common/http';
import { TacticalGridComponent } from './components/tactical-grid/tactical-grid.component';
import { PlayerStatusComponent } from './components/player-status/player-status.component';
import { ComLinkComponent } from './components/com-link/com-link.component';
import { ActionButtonsComponent } from './components/action-buttons/action-buttons.component';

@Component({
  selector: 'app-tactical-interface',
  standalone: true,
  imports: [
    CommonModule,
    TacticalGridComponent,
    PlayerStatusComponent,
    ComLinkComponent,
    ActionButtonsComponent
  ],
  templateUrl: './tactical-interface.component.html',
})
export class TacticalInterfaceComponent implements OnInit {
  private gameStateService = inject(GameStateService);
  private http = inject(HttpClient);

  state$: Observable<FullStatePayload | null> = this.gameStateService.state$;
  
  localPlayer$ = this.state$.pipe(
    map(state => state?.players.find(p => p.playerId === this.gameStateService.localPlayerId) || null)
  );

  isMovementLocked$ = this.gameStateService.isMovementLocked$;
  isActionLocked$ = this.gameStateService.isActionLocked$;

  techniques: any[] = [];
  
  // Grid
  gridRows = [8, 7, 6, 5, 4, 3, 2, 1, 0]; // North is up
  gridCols = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  
  hoveredPlayer: any = null;
  
  // Targeting
  targetingMode = false;
  pendingAction: any = null;
  highlightedCoords: {x: number, y: number}[] = [];

  // Attack Prompt
  showAttackPrompt = false;

  // Timers
  turnSeconds = 60;
  matchMinutes = 15;
  timerInterval: any;

  logs: string[] = ['System Initialized. Welcome to Morningstar.'];
  private previousState: FullStatePayload | null = null;

  ngOnInit() {
    this.http.get<any[]>('/assets/techniques.json').subscribe(data => {
      // Filter out Basic Actions from the main Techniques list to display them separately
      this.techniques = data.filter(t => t.header_information.theme_archetype !== 'Basic Action');
    });

    let lastPhase = '';
    this.state$.subscribe(state => {
       if (state && state.gameState.phaseId !== lastPhase) {
          lastPhase = state.gameState.phaseId;
          this.turnSeconds = state.gameState.config?.perTurnLimit || 60;
          
          if (lastPhase === 'MOVEMENT_CHOICE') {
             this.calculateHighlights('MOVEMENT_CHOICE');
          } else {
             this.highlightedCoords = [];
          }
       }

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

    this.timerInterval = setInterval(() => {
      if (this.turnSeconds > 0) {
        this.turnSeconds--;
      } else if (this.turnSeconds === 0) {
        this.turnSeconds = -1; // prevent multiple triggers
        this.forceNoAction();
      }
    }, 1000);
  }

  addLog(msg: string) {
    const timestamp = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    this.logs.unshift(`[${timestamp}] ${msg}`);
    if (this.logs.length > 50) {
      this.logs.pop();
    }
  }

  forceNoAction() {
    this.state$.subscribe(state => {
      if (state) {
        if (state.gameState.phaseId === 'MOVEMENT_CHOICE') {
           const me = state.players.find(p => p.playerId === this.gameStateService.localPlayerId);
           if (me) {
             this.dispatch(ActionIntentType.MOVEMENT as any, me.position[0], me.position[1], 'N');
           }
        } else if (state.gameState.phaseId === 'ACTION_CHOICE') {
           this.dispatch(ActionIntentType.BREATHE as any);
        }
      }
    }).unsubscribe();
    this.cancelTargeting();
  }

  ngOnDestroy() {
    if (this.timerInterval) clearInterval(this.timerInterval);
  }

  getActivePlayers(state: FullStatePayload | null) {
    if (!state) return [];
    return state.players;
  }

  getPlayerAt(state: FullStatePayload | null, x: number, y: number) {
    return this.getActivePlayers(state).find(p => p.position[0] === x && p.position[1] === y);
  }

  isSquareHighlighted(x: number, y: number) {
    return this.highlightedCoords.some(c => c.x === x && c.y === y);
  }

  onSquareClick(x: number, y: number) {
    if (this.targetingMode && this.isSquareHighlighted(x, y)) {
      this.dispatch(this.pendingAction, x, y, this.getDirection(x, y));
      this.cancelTargeting();
    } else if (!this.targetingMode) {
      const sub = this.state$.subscribe(state => {
        if (state && state.gameState.phaseId === 'MOVEMENT_CHOICE') {
          const me = state.players.find(p => p.playerId === this.gameStateService.localPlayerId);
          if (me) {
            const dx = Math.abs(x - me.position[0]);
            const dy = Math.abs(y - me.position[1]);
            // Chebyshev distance must be exactly 1, or 0 (stay in place)
            if (dx <= 1 && dy <= 1) {
              this.dispatch(ActionIntentType.MOVEMENT as any, x, y, this.getDirection(x, y));
            }
          }
        }
      });
      sub.unsubscribe();
    }
  }

  getDirection(x: number, y: number) {
    let dir = 'N';
    this.state$.subscribe(state => {
      const me = state?.players.find(p => p.playerId === this.gameStateService.localPlayerId);
      if (me) {
        const dx = x - me.position[0];
        const dy = y - me.position[1];
        if (dx === 0 && dy === 0) dir = 'N';
        else if (dx > 0 && dy > 0) dir = 'NE';
        else if (dx > 0 && dy < 0) dir = 'SE';
        else if (dx < 0 && dy > 0) dir = 'NW';
        else if (dx < 0 && dy < 0) dir = 'SW';
        else if (dx > 0) dir = 'E';
        else if (dx < 0) dir = 'W';
        else if (dy > 0) dir = 'N';
        else if (dy < 0) dir = 'S';
      }
    }).unsubscribe();
    return dir;
  }

  startAttackPrompt() {
    this.showAttackPrompt = true;
  }

  selectBasicAction(actionTypeStr: string) {
    const actionType = actionTypeStr as ActionIntentType;
    this.showAttackPrompt = false;
    
    // Just dispatch directly for Breathe or Defend (Targeting not strictly needed for self)
    if (actionType === ActionIntentType.BREATHE || actionType === ActionIntentType.DEFEND) {
      this.cancelTargeting();
      this.dispatch(actionType);
      return;
    }

    // Otherwise enter targeting mode
    this.targetingMode = true;
    this.pendingAction = actionType;
    this.calculateHighlights(actionType);
  }

  calculateHighlights(actionType: ActionIntentType | 'MOVEMENT_CHOICE') {
    this.highlightedCoords = [];
    this.state$.subscribe(state => {
       const me = state?.players.find(p => p.playerId === this.gameStateService.localPlayerId);
       if (me) {
         const mx = me.position[0];
         const my = me.position[1];
         // Adjacent squares (including diagonals)
         for (let dx = -1; dx <= 1; dx++) {
           for (let dy = -1; dy <= 1; dy++) {
             if (dx === 0 && dy === 0) continue;
             this.highlightedCoords.push({x: mx + dx, y: my + dy});
           }
         }
       }
    }).unsubscribe();
  }

  cancelTargeting() {
    this.targetingMode = false;
    this.pendingAction = null;
    this.highlightedCoords = [];
    this.showAttackPrompt = false;
  }

  dispatch(action: ActionIntentType, targetX = 0, targetY = 0, direction = 'N') {
    this.gameStateService.dispatchAction({ 
      type: action,
      targetX: targetX,
      targetY: targetY,
      targetDirection: direction,
      staminaInflux: 0
    });
  }

  useTechnique(tech: any) {
    // Basic dispatch for techniques
    this.dispatch(ActionIntentType.ATTACK_LIGHT);
  }

  forfeit() {
    // Hidden forfeit logic
    console.log("Forfeit triggered");
  }
}
