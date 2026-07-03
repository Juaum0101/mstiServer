import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import mqtt from 'mqtt';
import { FullStatePayload, ActionIntent } from '../models/game.models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GameStateService {
  private client: mqtt.MqttClient;
  private stateSubject = new BehaviorSubject<FullStatePayload | null>(null);

  public state$: Observable<FullStatePayload | null> = this.stateSubject.asObservable();

  public localPlayerId: string = '';
  public localPlayerName: string = '';

  public isMovementLocked$: Observable<boolean> = this.state$.pipe(
    map(state => !state || state.gameState.phaseId !== 'MOVEMENT_CHOICE')
  );

  public isActionLocked$: Observable<boolean> = this.state$.pipe(
    map(state => !state || state.gameState.phaseId !== 'ACTION_CHOICE')
  );

  constructor(private ngZone: NgZone) {
    // Check localStorage for player identity
    const storedId = localStorage.getItem('msk_player_id');
    const storedName = localStorage.getItem('msk_player_name');
    
    if (storedId) {
      this.localPlayerId = storedId;
      this.localPlayerName = storedName || '';
    } else {
      this.localPlayerId = 'P' + Math.floor(Math.random() * 10000);
      localStorage.setItem('msk_player_id', this.localPlayerId);
    }

    const wsUrl = environment.brokerUrl;

    this.client = mqtt.connect(wsUrl, {
      // PicoMQTT serves at the root WebSocket path.
      // mqtt.js defaults to '/mqtt' which causes the handshake to fail.
      path: '/',
      protocol: 'ws',
    });

    this.client.on('connect', () => {
      console.log('Connected to MQTT broker via WebSockets');
      const stateTopic = `game/state/${this.localPlayerId}`;
      this.client.subscribe(stateTopic, (err) => {
        if (err) {
          console.error(`Failed to subscribe to ${stateTopic}`, err);
        } else {
          // Request the current state so the UI isn't stuck waiting
          console.log(`Subscribed to ${stateTopic}`);
          this.client.publish('game/sync', '{"action": "sync"}');
          console.log('Synched game state');
        }
      });
    });

    this.client.on('message', (topic, message) => {
      console.log('Received message on topic', topic);
      if (topic === `game/state/${this.localPlayerId}`) {
        try {
          const payload = JSON.parse(message.toString()) as FullStatePayload;
          this.ngZone.run(() => {
            this.stateSubject.next(payload);
          });
          console.log('Received state payload', payload);
        } catch (e) {
          console.error('Failed to parse state payload', e);
        }
      }
    });

    this.client.on('error', (err) => {
      console.error('MQTT connection error:', err);
    });
  }

  public dispatchAction(intent: ActionIntent): void {
    if (this.client.connected) {
      intent.playerId = this.localPlayerId;
      console.log('Dispatching action', intent);
      this.client.publish('game/action', JSON.stringify(intent));
      console.log('Action dispatched');
    } else {
      console.error('Cannot dispatch action, MQTT client is not connected');
    }
  }

  public joinGame(payload: any): void {
    if (this.client.connected) {
      console.log('Joining game', payload);
      this.localPlayerName = payload.playerName;
      localStorage.setItem('msk_player_name', this.localPlayerName);
      this.client.publish('game/join', JSON.stringify({
        ...payload,
        playerId: this.localPlayerId
      }));
      console.log('Game joined');
    }
  }

  public adminStartMatch(): void {
    if (this.client.connected) {
      console.log('Starting match');
      this.client.publish('game/admin', JSON.stringify({ command: 'START_MATCH' }));
      console.log('Match started');
    }
  }

  public adminResetGame(): void {
    if (this.client.connected) {
      console.log('Resetting game');
      this.client.publish('game/admin', JSON.stringify({ command: 'RESET_GAME' }));
      console.log('Game reset');
    }
  }

  public sendMessage(topic: string, payload: any): void {
    if (this.client.connected) {
      console.log('Sending message on topic', topic);
      this.client.publish(topic, JSON.stringify(payload));
      console.log('Message sent');
    }
  }
}
