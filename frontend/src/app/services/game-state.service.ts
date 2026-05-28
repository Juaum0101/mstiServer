import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import mqtt from 'mqtt';
import { FullStatePayload, ActionIntent } from '../models/game.models';

@Injectable({
  providedIn: 'root'
})
export class GameStateService {
  private client: mqtt.MqttClient;
  private stateSubject = new BehaviorSubject<FullStatePayload | null>(null);

  public state$: Observable<FullStatePayload | null> = this.stateSubject.asObservable();

  public localPlayerId: string = '';
  public localPlayerName: string = '';

  public isInputLocked$: Observable<boolean> = this.state$.pipe(
    map(state => {
      if (!state) return true;
      // Inputs are only unlocked during ACTION_PHASE.
      return state.gameState.phaseId !== 'ACTION_PHASE';
    })
  );

  constructor(private ngZone: NgZone) {
    // Dynamically resolve host so this works both on the ESP32 SoftAP
    // (192.168.4.1) and during local development (localhost). 
    let host = window.location.hostname;
    if (host === 'localhost') {
      host = '192.168.0.57'; // Dev override
    }
    const wsUrl = `ws://${host}:8080/`;

    this.client = mqtt.connect(wsUrl, {
      // PicoMQTT serves at the root WebSocket path.
      // mqtt.js defaults to '/mqtt' which causes the handshake to fail.
      path: '/',
      protocol: 'ws',
    });

    this.client.on('connect', () => {
      console.log('Connected to MQTT broker via WebSockets');
      this.client.subscribe('game/state', (err) => {
        if (err) {
          console.error('Failed to subscribe to game/state', err);
        } else {
          // Request the current state so the UI isn't stuck waiting
          console.log('Subscribed to game/state');
          this.client.publish('game/sync', '{"action": "sync"}');
          console.log('Synched game state');
        }
      });
    });

    this.client.on('message', (topic, message) => {
      console.log('Received message on topic', topic);
      if (topic === 'game/state') {
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
      this.client.publish('game/join', JSON.stringify(payload));
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
