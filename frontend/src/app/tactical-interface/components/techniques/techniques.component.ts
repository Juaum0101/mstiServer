import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-techniques',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
        <h3 class="font-label-sm text-outline mb-3 uppercase tracking-widest flex items-center gap-2">
            <span class="w-1 h-1 bg-outline rounded-full"></span> Techniques
        </h3>
        <div class="space-y-2">
            @for (tech of techniques(); track tech.name) {
              <button (click)="techniqueSelected.emit(tech)"
                      [disabled]="stamina() < tech.combat_mechanics.stamina_cost || isActionLocked()"
                      class="w-full text-left bg-surface-container-low border-b border-outline/20 p-3 hover:bg-surface-container-highest transition-colors group relative overflow-hidden"
                      [ngClass]="{'opacity-50 grayscale': stamina() < tech.combat_mechanics.stamina_cost || isActionLocked()}">
                  
                  <div class="absolute left-0 top-0 w-1 h-full bg-primary transform -translate-x-full group-hover:translate-x-0 transition-transform"></div>
                  
                  <div class="flex justify-between items-center mb-1">
                      <div class="flex items-center gap-2">
                          <span class="material-symbols-outlined text-outline group-hover:text-primary text-lg transition-colors">{{ tech.visuals_and_roleplay.icon_suggestion || 'auto_awesome' }}</span>
                          <span class="font-body-md text-on-surface group-hover:text-primary transition-colors">{{ tech.name }}</span>
                      </div>
                      <div class="font-label-sm text-tertiary flex items-center gap-1">
                          {{ tech.combat_mechanics.stamina_cost }} STM
                      </div>
                  </div>
                  <div class="text-[11px] text-on-surface-variant font-mono pl-7 pr-2 line-clamp-2">
                      {{ tech.description }}
                  </div>
              </button>
            }

            @if (techniques().length === 0) {
              <div class="text-center p-4 border border-dashed border-outline-variant text-outline font-label-sm">
                  NO TECHNIQUES EQUIPPED
              </div>
            }
        </div>
    </div>
  `
})
export class TechniquesComponent {
  techniques = input<any[]>([]);
  stamina = input<number>(0);
  isActionLocked = input<boolean>(false);
  techniqueSelected = output<any>();
}
