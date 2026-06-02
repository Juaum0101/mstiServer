#include "GameEngine.h"
#include <algorithm>

void GameEngine::initializePlayer(Player &p) {
  p.active = true;
  p.maxHp = calculateMaxHp(p);
  p.hp = p.maxHp;
  p.stamina = 10;
  p.staminaInflux = 0;
  p.isExhausted = false;
  p.isFallen = false;
  p.nextHitCritical = false;
  p.isReady = false;
  p.currentIntent.type = ActionIntentType::NONE;
}

int GameEngine::calculateMaxHp(const Player &p) {
  int maxHp = 30; // Base
  if (p.mutations.hasAny)
    maxHp -= 5;
  if (p.mutations.hasAlpha)
    maxHp -= 6;
  if (p.mutations.hasBeta)
    maxHp -= 2;
  return maxHp;
}

int GameEngine::getWeaponRating(const String &itemName) {
  if (itemName == "Zweihander")
    return 5;
  if (itemName == "Shortsword")
    return 3;
  if (itemName == "Dagger")
    return 2;
  return 1; // Unarmed or default
}

int GameEngine::getShieldBonus(const String &itemName) {
  if (itemName == "KiteShield")
    return 3;
  if (itemName == "Buckler")
    return 1;
  return 0; // Default
}

int GameEngine::calculateBaseWR(const Player &p) {
  int wr = getWeaponRating(p.equippedItems.rightHand);

  // Any-Handed logic (+2 WR bonus if two-handing same weapon)
  if (p.isTwoHanding && p.equippedItems.leftHand == p.equippedItems.rightHand) {
    wr += 2;
  }
  return wr;
}

void GameEngine::resolveMovement(FullStatePayload &state) {
  // 1. Assign target positions for movers, keep non-movers in place
  for (size_t i = 0; i < state.playerCount; i++) {
    Player &p = state.players[i];
    if (!p.active || p.isFallen)
      continue;

    // Default target is current position
    p.targetPosition[0] = p.position[0];
    p.targetPosition[1] = p.position[1];

    if (p.currentIntent.type == ActionIntentType::MOVE) {
      int tx = p.currentIntent.targetX;
      int ty = p.currentIntent.targetY;

      // Validate Chebyshev distance (max 1 unit)
      int dist = chebyshevDistance(p.position[0], p.position[1], tx, ty);
      if (dist == 1 && tx >= 0 && tx < 9 && ty >= 0 && ty < 9) {
        p.targetPosition[0] = tx;
        p.targetPosition[1] = ty;
      }
      if (p.currentIntent.targetDirection.length() > 0) {
        p.facingDirection = p.currentIntent.targetDirection;
      }
    } else if (p.currentIntent.targetDirection.length() > 0) {
      // Player might turn without moving (e.g. for attack direction)
      p.facingDirection = p.currentIntent.targetDirection;
    }
  }

  // 2. Collision detection (Bouncing logic)
  for (size_t i = 0; i < state.playerCount; i++) {
    Player &p1 = state.players[i];
    if (!p1.active || p1.isFallen)
      continue;

    bool collision = false;
    for (size_t j = 0; j < state.playerCount; j++) {
      if (i == j)
        continue;
      Player &p2 = state.players[j];
      if (!p2.active || p2.isFallen)
        continue;

      // Target overlap collision
      if (p1.targetPosition[0] == p2.targetPosition[0] &&
          p1.targetPosition[1] == p2.targetPosition[1]) {
        collision = true;
        break;
      }

      // Swap detection (crossing paths directly)
      if (p1.position[0] == p2.targetPosition[0] &&
          p1.position[1] == p2.targetPosition[1] &&
          p2.position[0] == p1.targetPosition[0] &&
          p2.position[1] == p1.targetPosition[1]) {
        collision = true;
        break;
      }
    }

    if (collision) {
      // Bounce back to original position
      p1.targetPosition[0] = p1.position[0];
      p1.targetPosition[1] = p1.position[1];
    }
  }

  // 3. Commit valid movements
  for (size_t i = 0; i < state.playerCount; i++) {
    Player &p = state.players[i];
    if (!p.active || p.isFallen)
      continue;
    p.position[0] = p.targetPosition[0];
    p.position[1] = p.targetPosition[1];
  }
}

void GameEngine::resolveCombatAndVitals(FullStatePayload &state) {
  // 1. Stamina Cost / Regeneration
  for (size_t i = 0; i < state.playerCount; i++) {
    Player &p = state.players[i];
    if (!p.active || p.isFallen)
      continue;

    p.nextHitCritical = false; // Reset per-turn flags

    if (p.currentIntent.type == ActionIntentType::BREATHE) {
      if (p.stamina <= 2) {
        p.stamina += 8;
      } else if (p.stamina <= 6) {
        p.stamina += 5;
      } else {
        p.stamina += 2;
      }
    } else if (p.currentIntent.type == ActionIntentType::ATTACK_LIGHT) {
      p.stamina -= 1;
    } else if (p.currentIntent.type == ActionIntentType::ATTACK_HEAVY) {
      p.stamina -= 2;
    } else if (p.currentIntent.type == ActionIntentType::MOVE) {
      p.stamina -= 1;
    } else if (p.currentIntent.type == ActionIntentType::DODGE) {
      p.stamina -= 3;
    }

    p.stamina +=
        p.currentIntent.staminaInflux; // Include dynamic influx from intent

    if (p.stamina > 10)
      p.stamina = 10;
    p.isExhausted = (p.stamina < 0);
  }

  // 2. Dodge Movement
  for (size_t i = 0; i < state.playerCount; i++) {
    Player &p = state.players[i];
    if (!p.active || p.isFallen || p.currentIntent.type != ActionIntentType::DODGE || p.stamina < 0)
      continue;
      
    int tx = p.currentIntent.targetX;
    int ty = p.currentIntent.targetY;
    int dist = chebyshevDistance(p.position[0], p.position[1], tx, ty);
    
    if (dist == 1 && tx >= 0 && tx < 9 && ty >= 0 && ty < 9) {
       bool occupied = false;
       for (size_t k = 0; k < state.playerCount; k++) {
          if (state.players[k].active && !state.players[k].isFallen && state.players[k].position[0] == tx && state.players[k].position[1] == ty) {
             occupied = true; break;
          }
       }
       if (!occupied) {
          p.position[0] = tx;
          p.position[1] = ty;
       }
    }
  }

  // 3. Combat Resolution
  // A simplified Phase 1 approach: if you attack, hit anyone in the targeted
  // sector
  for (size_t i = 0; i < state.playerCount; i++) {
    Player &attacker = state.players[i];
    if (!attacker.active || attacker.isFallen ||
        (attacker.currentIntent.type != ActionIntentType::ATTACK_LIGHT &&
         attacker.currentIntent.type != ActionIntentType::ATTACK_HEAVY))
      continue;

    int attackerWR = calculateBaseWR(attacker);
    if (attacker.currentIntent.type == ActionIntentType::ATTACK_HEAVY) {
      attackerWR += 1; // Heavy attack bonus
    }

    for (size_t j = 0; j < state.playerCount; j++) {
      if (i == j)
        continue;
      Player &defender = state.players[j];
      if (!defender.active || defender.isFallen)
        continue;

      // Determine if the defender is in the attacker's spatial target
      // Phase 1 Mock: Target must match the attacker's explicit spatial
      // coordinates
      bool hit = false;
      if (attacker.currentIntent.targetX == defender.position[0] &&
          attacker.currentIntent.targetY == defender.position[1]) {
        hit = true;
      }

      if (hit) {
        if (defender.currentIntent.type == ActionIntentType::DODGE &&
            defender.stamina >= 0) {
          continue; // Dodged successfully
        }

        int defenderWR = calculateBaseWR(defender);
        int shieldBonus = getShieldBonus(defender.equippedItems.leftHand);

        int mitigation = 0;
        if (defender.currentIntent.type == ActionIntentType::DEFEND) {
          mitigation = defenderWR + shieldBonus;
        }

        int incomingDamage = std::max(0, attackerWR - mitigation);

        // Guard break check
        if (defender.currentIntent.type == ActionIntentType::DEFEND &&
            incomingDamage > defender.stamina) {
          defender.stamina = 0;
          defender.isExhausted = true;
          defender.nextHitCritical = true;
          incomingDamage = attackerWR; // Unmitigated
        }

        defender.hp -= incomingDamage;
      }
    }
  }

  // 3. Vitals Check
  for (size_t i = 0; i < state.playerCount; i++) {
    Player &p = state.players[i];
    if (!p.active || p.isFallen)
      continue;

    p.maxHp = calculateMaxHp(p);
    if (p.hp > p.maxHp)
      p.hp = p.maxHp;

    if (p.hp <= 0) {
      p.hp = 0;
      p.isFallen = true;
    }
  }
}

void GameEngine::checkWinCondition(FullStatePayload &state) {
  int standingPlayers = 0;
  String winnerName = "";

  for (size_t i = 0; i < state.playerCount; i++) {
    if (state.players[i].active && !state.players[i].isFallen) {
      standingPlayers++;
      winnerName = state.players[i].playerName;
    }
  }

  if (standingPlayers <= 1 && state.playerCount > 1) {
    Serial.printf("Game Over! Winner: %s\n", winnerName.c_str());
    // Could transition phase to GAME_OVER here in the future
  }
}

void GameEngine::executeMovementPhase(FullStatePayload &state) {
  Serial.println("[GameEngine] Resolving Movement Phase...");
  state.gameState.phaseId = PhaseId::MOVEMENT_RESOLVE;
  resolveMovement(state);

  // Transition to ACTION_CHOICE
  state.gameState.phaseId = PhaseId::ACTION_CHOICE;
  for (size_t i = 0; i < state.playerCount; i++) {
    state.players[i].isReady = false;
    state.players[i].currentIntent.type = ActionIntentType::NONE;
  }
}

void GameEngine::executeActionPhase(FullStatePayload &state) {
  Serial.println("[GameEngine] Resolving Action Phase...");
  state.gameState.phaseId = PhaseId::ACTION_RESOLVE;
  resolveCombatAndVitals(state);
  checkWinCondition(state);

  // Turn cleanup and transition back to MOVEMENT_CHOICE
  state.gameState.turnNumber++;
  state.gameState.phaseId = PhaseId::MOVEMENT_CHOICE;
  for (size_t i = 0; i < state.playerCount; i++) {
    state.players[i].isReady = false;
    state.players[i].currentIntent.type = ActionIntentType::NONE;
  }
}
