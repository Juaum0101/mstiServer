#pragma once

#include <Arduino.h>
#include <ArduinoJson.h>
#include <array>

constexpr size_t MAX_PLAYERS = 16;
constexpr size_t MAX_ACTIVE_MEMORY = 7;

enum class PhaseId {
  READY_PHASE,
  MOVEMENT_CHOICE,
  MOVEMENT_RESOLVE,
  ACTION_CHOICE,
  ACTION_RESOLVE
};

inline const char *phaseIdToString(PhaseId phase) {
  switch (phase) {
  case PhaseId::READY_PHASE:
    return "READY_PHASE";
  case PhaseId::MOVEMENT_CHOICE:
    return "MOVEMENT_CHOICE";
  case PhaseId::MOVEMENT_RESOLVE:
    return "MOVEMENT_RESOLVE";
  case PhaseId::ACTION_CHOICE:
    return "ACTION_CHOICE";
  case PhaseId::ACTION_RESOLVE:
    return "ACTION_RESOLVE";
  default:
    return "UNKNOWN_PHASE";
  }
}

enum class ActionIntentType { ATTACK_LIGHT, ATTACK_HEAVY, DEFEND, DODGE, BREATHE, MOVE, NONE };

inline const char *intentTypeToString(ActionIntentType type) {
  switch (type) {
  case ActionIntentType::ATTACK_LIGHT:
    return "attack_light";
  case ActionIntentType::ATTACK_HEAVY:
    return "attack_heavy";
  case ActionIntentType::DEFEND:
    return "defend";
  case ActionIntentType::DODGE:
    return "dodge";
  case ActionIntentType::BREATHE:
    return "breathe";
  case ActionIntentType::MOVE:
    return "move";
  default:
    return "none";
  }
}

struct ActionIntent {
  ActionIntentType type;
  int targetX;
  int targetY;
  String targetDirection;
  int staminaInflux;
};

struct LobbyConfig {
  bool mutationsAllowed = true;
  bool marksActive = true;
  bool techniquesEnabled = true;
  bool classVisibility = false;
  bool namesVisible = true;
  bool newbieMode = false;
  int fogRange = 4;
  int perTurnLimit = 60;
  int matchTimer = 15;
};

struct GameState {
  PhaseId phaseId;
  int turnNumber;
  bool brokerReady;
  LobbyConfig config;
};

struct EquippedItems {
  String head;
  String torso;
  String leftHand;
  String rightHand;
};

struct Mutations {
  bool hasAny;
  bool hasAlpha;
  bool hasBeta;
};

struct Player {
  bool active;
  String playerId;
  String playerName;
  int hp;
  int maxHp;
  int stamina;
  int staminaInflux;
  int position[2];
  int targetPosition[2]; // Used during movement resolution
  String facingDirection;
  bool isTwoHanding;
  EquippedItems equippedItems;
  Mutations mutations;

  bool isExhausted;
  bool isFallen;
  bool nextHitCritical;

  std::array<String, MAX_ACTIVE_MEMORY> activeMemory;
  size_t activeMemoryCount;

  // Internal server state
  bool isReady;
  ActionIntent currentIntent;
};

struct FullStatePayload {
  GameState gameState;
  std::array<Player, MAX_PLAYERS> players;
  size_t playerCount;
};

// Math Utilities
inline int chebyshevDistance(int x1, int y1, int x2, int y2) {
  return std::max(std::abs(x1 - x2), std::abs(y1 - y2));
}
