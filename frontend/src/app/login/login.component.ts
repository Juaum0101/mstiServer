import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { GameStateService } from '../services/game-state.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <div class="max-w-[600px] mx-auto p-8 mt-20">
    <div class="blueprint-card bg-surface-container-low p-8">
      <h2 class="font-headline-lg text-primary mb-6 flex items-center gap-2">
        System Login
      </h2>
      <p class="text-on-surface-variant mb-6">Enter your operator callsign to connect to the Morningstar grid.</p>
      
      <div class="space-y-6">
        <div>
          <label class="font-label-sm text-on-surface-variant block mb-2 uppercase">Callsign</label>
          <input [(ngModel)]="playerName" type="text" class="input-field font-body-md" placeholder="Enter your name" (keyup.enter)="login()">
        </div>
        <button (click)="login()" [disabled]="!playerName.trim()" class="gold-btn w-full bg-primary text-on-primary font-title-md py-4">
          Connect to Lobby
        </button>
      </div>
    </div>
  </div>
  `
})
export class LoginComponent {
  playerName = '';
  private router = inject(Router);
  private gameStateService = inject(GameStateService);

  login() {
    if (!this.playerName.trim()) return;
    this.gameStateService.joinGame({ playerName: this.playerName });
    this.router.navigate(['/lobby']);
  }
}
