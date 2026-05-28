import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FullStatePayload, ActionIntentType } from '../models/game.models';
import { GameStateService } from '../services/game-state.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-tactical-interface',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './tactical-interface.component.html',
})
export class TacticalInterfaceComponent implements OnInit {
  private gameStateService = inject(GameStateService);
  private http = inject(HttpClient);

  state$: Observable<FullStatePayload | null> = this.gameStateService.state$;
  
  localPlayer$ = this.state$.pipe(
    map(state => state?.players.find(p => p.playerId === this.gameStateService.localPlayerId) || null)
  );

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

  ngOnInit() {
    this.http.get<any[]>('/assets/techniques.json').subscribe(data => {
      // Filter out Basic Actions from the main Techniques list to display them separately
      this.techniques = data.filter(t => t.header_information.theme_archetype !== 'Basic Action');
    });

    this.timerInterval = setInterval(() => {
      if (this.turnSeconds > 0) this.turnSeconds--;
    }, 1000);
  }

  ngOnDestroy() {
    if (this.timerInterval) clearInterval(this.timerInterval);
  }

  getActivePlayers(state: FullStatePayload | null) {
    if (!state) return [];
    return state.players.filter(p => p.active);
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
    }
  }

  getDirection(x: number, y: number) {
    // Simple calc for direction, assuming local player's pos is known
    // But since this is a quick fix, let's just send coordinates for now.
    return 'N'; 
  }

  startAttackPrompt() {
    this.showAttackPrompt = true;
  }

  selectBasicAction(actionTypeStr: string) {
    const actionType = actionTypeStr as ActionIntentType;
    this.showAttackPrompt = false;
    
    // Just dispatch directly for Breathe or Defend (Targeting not strictly needed for self)
    if (actionType === ActionIntentType.BREATHE || actionType === ActionIntentType.DEFEND) {
      this.dispatch(actionType);
      return;
    }

    // Otherwise enter targeting mode
    this.targetingMode = true;
    this.pendingAction = actionType;
    this.calculateHighlights(actionType);
  }

  calculateHighlights(actionType: ActionIntentType) {
    this.highlightedCoords = [];
    // Just a basic diamond/adjacent highlight for now
    this.state$.subscribe(state => {
       const me = state?.players.find(p => p.playerId === this.gameStateService.localPlayerId);
       if (me) {
         const mx = me.position[0];
         const my = me.position[1];
         // Adjacent
         this.highlightedCoords.push({x: mx, y: my+1});
         this.highlightedCoords.push({x: mx, y: my-1});
         this.highlightedCoords.push({x: mx+1, y: my});
         this.highlightedCoords.push({x: mx-1, y: my});
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
