#pragma once
#include "models.h"

class GameEngine {
public:
    // Main orchestrator for resolving the turn
    static void executeTurn(FullStatePayload& state);

    // Helpers
    static void initializePlayer(Player& p);

private:
    static void resolveMovement(FullStatePayload& state);
    static void resolveCombatAndVitals(FullStatePayload& state);
    static void checkWinCondition(FullStatePayload& state);
    
    // Helpers
    static int calculateMaxHp(const Player& player);
    static int getWeaponRating(const String& itemName);
    static int getShieldBonus(const String& itemName);
    static int calculateBaseWR(const Player& player);
};
