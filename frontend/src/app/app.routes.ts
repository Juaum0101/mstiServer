import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { MatchLobbyComponent } from './match-lobby/match-lobby.component';
import { TacticalInterfaceComponent } from './tactical-interface/tactical-interface.component';
import { GameConfigComponent } from './game-config/game-config.component';
import { InventoryComponent } from './inventory/inventory.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'lobby', component: MatchLobbyComponent },
  { path: 'tactical', component: TacticalInterfaceComponent },
  { path: 'admin', component: GameConfigComponent },
  { path: 'inventory', component: InventoryComponent }
];
