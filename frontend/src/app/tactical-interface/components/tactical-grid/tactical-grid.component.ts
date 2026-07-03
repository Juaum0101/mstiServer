import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FullStatePayload, Player } from '../../../models/game.models';

@Component({
  selector: 'app-tactical-grid',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex-1 flex items-center justify-center relative min-h-[350px] md:min-h-[400px] shrink-0">
        <div class="relative blueprint-card bg-surface-container p-2 md:p-4 scale-95 md:scale-100">
            <!-- Compass Rose -->
            <div class="absolute -top-6 left-1/2 -translate-x-1/2 font-label-sm text-primary">NORTH</div>
            
            <div class="grid gap-[2px] md:gap-[4px]" [ngClass]="{'opacity-50 pointer-events-none': isMovementLocked() && !targetingMode()}" style="grid-template-columns: repeat(9, minmax(28px, 48px)); grid-template-rows: repeat(9, minmax(28px, 48px));">
                @for (y of gridRows; track y) {
                    @for (x of gridCols; track x) {
                        <!-- Square -->
                        <div 
                            class="relative border transition-all duration-200 cursor-pointer flex items-center justify-center"
                            [ngClass]="{
                                'border-outline-variant bg-surface-container-low hover:border-primary/50': !isSquareHighlighted(x, y),
                                'border-primary bg-primary/20 animate-pulse cursor-crosshair': isSquareHighlighted(x, y)
                            }"
                            (click)="squareClicked.emit({x, y})"
                            (mouseenter)="onHover(x, y)"
                            (mouseleave)="playerHovered.emit(null)"
                        >
                            <!-- Player Token -->
                            @if (getPlayerAt(x, y); as p) {
                              <div 
                                  class="w-6 h-6 md:w-8 md:h-8 rounded-full border-2 flex items-center justify-center shadow-lg pointer-events-none"
                                  [ngClass]="p.playerId === localPlayer()?.playerId ? 'bg-primary border-on-primary text-on-primary' : 'bg-error border-on-error text-on-error'"
                              >
                                  <span class="font-label-sm text-[10px] uppercase font-bold">{{ p.playerName | slice:0:2 }}</span>
                              </div>
                            }
                            
                            <!-- Coordinate Label (subtle) -->
                            <span class="absolute bottom-0 right-0.5 text-[8px] font-mono text-outline/30">{{x}},{{y}}</span>
                        </div>
                    }
                }
            </div>
        </div>
        
        <!-- Target Overlay (When Action Selected) -->
        @if (targetingMode()) {
          <div class="absolute bottom-0 w-full text-center pointer-events-none z-10">
              <div class="inline-block blueprint-card bg-surface-container-high/90 px-6 py-3 border-primary backdrop-blur-sm shadow-xl">
                  <span class="font-label-sm text-primary uppercase flex items-center gap-2">
                      [Target] Select Target Square
                  </span>
                  <button class="pointer-events-auto text-[10px] text-outline hover:text-error mt-1 underline" (click)="cancelTargeting.emit()">Cancel</button>
              </div>
          </div>
        }
    </div>
  `
})
export class TacticalGridComponent {
  state = input<FullStatePayload | null>(null);
  localPlayer = input<Player | null>(null);
  targetingMode = input<boolean>(false);
  isMovementLocked = input<boolean>(false);
  highlightedCoords = input<{x: number, y: number}[]>([]);

  squareClicked = output<{x: number, y: number}>();
  playerHovered = output<Player | null>();
  cancelTargeting = output<void>();

  gridCols = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  gridRows = [0, 1, 2, 3, 4, 5, 6, 7, 8];

  isSquareHighlighted(x: number, y: number): boolean {
    return this.highlightedCoords().some(c => c.x === x && c.y === y);
  }

  getPlayerAt(x: number, y: number): Player | undefined {
    const s = this.state();
    if (!s) return undefined;
    return s.players.find(p => p.position[0] === x && p.position[1] === y);
  }

  onHover(x: number, y: number) {
    const p = this.getPlayerAt(x, y);
    if (p) {
      this.playerHovered.emit(p);
    }
  }
}
