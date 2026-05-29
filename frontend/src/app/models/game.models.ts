export type PhaseId = 'READY_PHASE' | 'MOVEMENT_CHOICE' | 'MOVEMENT_RESOLVE' | 'ACTION_CHOICE' | 'ACTION_RESOLVE';

export enum ActionIntentType {
  ATTACK_LIGHT = 'ATTACK_LIGHT',
  ATTACK_HEAVY = 'ATTACK_HEAVY',
  DEFEND = 'DEFEND',
  DODGE = 'DODGE',
  BREATHE = 'BREATHE',
  MOVEMENT = 'MOVEMENT',
  NONE = 'NONE'
}

export interface ActionIntent {
  playerId?: string;
  type: ActionIntentType;
  targetX?: number;
  targetY?: number;
  targetDirection?: string;
  staminaInflux?: number;
}

export interface GameState {
  phaseId: PhaseId;
  turnNumber: number;
  brokerReady: boolean;
}

export interface EquippedItems {
  head: string | null;
  torso: string | null;
  leftHand: string | null;
  rightHand: string | null;
}

export interface Mutations {
  hasAny: boolean;
  hasAlpha: boolean;
  hasBeta: boolean;
}

export interface Player {
  active: boolean;
  playerId: string;
  playerName: string;
  hp: number;
  maxHp: number;
  stamina: number;
  staminaInflux?: number;
  position: [number, number];
  targetPosition: [number, number];
  facingDirection: string;
  isTwoHanding: boolean;
  isExhausted: boolean;
  isFallen: boolean;
  nextHitCritical: boolean;
  mutations: Mutations;
  equippedItems: EquippedItems;
  activeMemory?: string[];
  currentIntent?: ActionIntent;
  isReady: boolean;
}

export interface TurnStatus {
  name: string;
  status: string;
}

export interface FullStatePayload {
  gameState: GameState;
  players: Player[];
  turnStatuses: TurnStatus[];
}
