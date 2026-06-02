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
                    (click)="showAttackPrompt = true"
                    [disabled]="stamina() < 1 || isActionLocked()">
                <span class="material-symbols-outlined mb-2 text-2xl">swords</span>
                <span class="font-label-sm uppercase">Attack</span>
            </button>
            
            <button class="blueprint-card p-3 flex flex-col items-center justify-center text-on-surface hover:bg-surface-bright hover:border-secondary hover:text-secondary transition-colors h-24"
                    (click)="actionSelected.emit('DEFEND')"
                    [disabled]="stamina() < 1 || isActionLocked()">
                <span class="material-symbols-outlined mb-2 text-2xl">shield</span>
                <span class="font-label-sm uppercase">Defend</span>
            </button>
            
            <button class="blueprint-card p-3 flex flex-col items-center justify-center text-on-surface hover:bg-surface-bright hover:border-tertiary hover:text-tertiary transition-colors h-24"
                    (click)="actionSelected.emit('DODGE')"
                    [disabled]="stamina() < 2 || isActionLocked()">
                <span class="material-symbols-outlined mb-2 text-2xl">directions_run</span>
                <span class="font-label-sm uppercase">Dodge</span>
            </button>
            
            <button class="blueprint-card p-3 flex flex-col items-center justify-center text-on-surface hover:bg-surface-bright hover:border-primary-container hover:text-primary-container transition-colors h-24"
                    (click)="actionSelected.emit('BREATHE')"
                    [disabled]="isActionLocked()">
                <span class="material-symbols-outlined mb-2 text-2xl">air</span>
                <span class="font-label-sm uppercase">Breathe</span>
            </button>

            <!-- Attack Light/Heavy Overlay -->
            @if (showAttackPrompt) {
              <div class="absolute inset-0 bg-surface-container/95 backdrop-blur-sm z-10 flex flex-col p-2">
                  <h4 class="font-label-sm text-primary text-center mb-2 uppercase">Attack Type</h4>
                  <div class="grid grid-cols-2 gap-2 flex-1">
                      <button class="bg-surface-variant border border-outline hover:bg-primary hover:text-on-primary transition-colors flex items-center justify-center font-label-sm uppercase"
                              (click)="selectAttack('ATTACK_LIGHT')">
                          Light (1 STM)
                      </button>
                      <button class="bg-surface-variant border border-outline hover:bg-error hover:text-on-error transition-colors flex items-center justify-center font-label-sm uppercase"
                              (click)="selectAttack('ATTACK_HEAVY')"
                              [disabled]="stamina() < 2">
                          Heavy (2 STM)
                      </button>
                  </div>
                  <button class="text-[10px] text-outline hover:text-error mt-2 uppercase text-center" (click)="showAttackPrompt = false">Cancel</button>
              </div>
            }
        </div>
    </div>
  `
})
export class ActionButtonsComponent {
  stamina = input<number>(0);
  isActionLocked = input<boolean>(false);
  actionSelected = output<string>();

  showAttackPrompt = false;

  selectAttack(action: string) {
    this.showAttackPrompt = false;
    this.actionSelected.emit(action);
  }
}
