import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-action-buttons',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
        <h3 class="font-label-sm text-outline mb-3 uppercase tracking-widest flex items-center gap-2">
            <span class="w-1 h-1 bg-outline rounded-full"></span> Core Directives
        </h3>
        <div class="grid grid-cols-2 gap-2 relative">
            
            <button class="blueprint-card p-3 flex flex-col items-center justify-center text-on-surface hover:bg-surface-bright hover:border-primary hover:text-primary transition-colors h-24"
                    (click)="actionSelected.emit('ATTACK')"
                    [disabled]="stamina() < 1 || isActionLocked()">
                <span class="font-label-sm uppercase">Attack (Fists)</span>
            </button>
            
            <button class="blueprint-card p-3 flex flex-col items-center justify-center text-on-surface hover:bg-surface-bright hover:border-secondary hover:text-secondary transition-colors h-24"
                    (click)="actionSelected.emit('DEFEND')"
                    [disabled]="stamina() < 1 || isActionLocked()">
                <span class="font-label-sm uppercase">Defend</span>
            </button>
            
            <button class="blueprint-card p-3 flex flex-col items-center justify-center text-on-surface hover:bg-surface-bright hover:border-tertiary hover:text-tertiary transition-colors h-24"
                    (click)="actionSelected.emit('DODGE')"
                    [disabled]="stamina() < 2 || isActionLocked()">
                <span class="font-label-sm uppercase">Dodge</span>
            </button>
            
        </div>
    </div>
  `
})
export class ActionButtonsComponent {
  stamina = input<number>(0);
  isActionLocked = input<boolean>(false);
  actionSelected = output<string>();
}
