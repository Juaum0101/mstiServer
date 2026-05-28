Game State & Mechanics Specification: Morning Star: Kingdom

1. The Core Loop & Global State Machine

In Morning Star: Kingdom (MSK), the simultaneous turn-based state machine is the primary engine for "souls-like" tension. Unlike reactive turn-based systems, MSK centers gameplay on anticipation and secret selection. The strategic core lies in the fog of war created during the Action Phase: players must predict not only spatial positioning and defensive sectors but also the "Stamina Influx"—a secret investment of resources—before the Reveal Phase. This ensures that every turn is a high-stakes psychological duel where the "active" state is shared, and resolution is absolute.

The MSK turn structure is a formal state-transition cycle designed to synchronize all players via an ESP32 broker. The broker polls for a "Ready" signal at the start of each phase to ensure concurrent resolution.

* Memory Cycle (Optional): The turn begins with character "readiness." Players may optionally discard any number of cards to the bottom of their Memory (Deck) and draw back to their Active Memory (Hand) size.
* Movement Phase: Resolution of spatial positioning. Players reveal chosen movements (adjacent square or stay). Projectiles advance during this phase. If an entity attempts to move into a cell occupied by another creature or if two entities target the same cell, the movement fails and the entities "bounce back" to their original positions.
* Action Phase: Secret selection. Players commit to Techniques (Technique Cards, Weapon Techniques, or Mutation Techniques) and directional tokens.
* Reveal Phase: The global synchronization point. Players share action details and narrative descriptions. All "Fast" projectiles execute their secondary movement of the turn during this phase. Secretly committed "Stamina Influx" values are revealed here.
* Resolution Phase: Final execution of effects. Action interactions (e.g., Attack vs. Attack trades or Defense vs. Attack mitigation) are calculated, and the resulting state is applied to player vitals.

Since MSK is a simultaneous game, all players occupy the "Active" state concurrently. The Reveal phase acts as the hard synchronization point for the ESP32 broker to validate the global state before broadcasting the resolution to the Angular client.


--------------------------------------------------------------------------------


2. Entity Vitals & Resource Economics

The strategic depth of MSK is rooted in the interdependency of Health (HP) and Stamina. This relationship creates an environment where resource mismanagement leads directly to "Fallen" or "Guard Broken" states. High-tier play requires balancing the "Final Push" (spending into negative stamina) against the risk of total vulnerability.

Health (HP)

* Default Max HP: 30.
* Fallen State: Triggered immediately when HP reaches 0.
* Mutation Penalties: Modifying a character’s anatomy reduces survivability.
  * Base Mutation Penalty: -5 Max HP for having any mutation.
  * Alpha Mutation: -6 Max HP additional penalty.
  * Beta Mutation: -2 Max HP additional penalty.
* Healing Mechanics: Players start with 3 Healing Flasks (7 HP restoration per use). Healing is restricted to the "Breathe" action; it cannot be performed while moving or attacking.

Stamina

* Default Max Stamina: 10.
* Exhausted State: Triggered when Stamina < 0 (Negative Stamina). While a "Final Push" allows spending beyond current reserves, the player becomes Exhausted and is restricted solely to the "Breathe" mechanic until recovered.
* Stamina Influx: Players may pay additional secret stamina to boost a technique's properties. This must be committed during the Action Phase and revealed during the Reveal Phase.

Stamina Regeneration (Breathe)

Stamina does not regenerate automatically. Players must sacrifice both Movement and Action phases to "Breathe."

Current Stamina	Regen Value	Final Total
0 - 2 (Exhausted)	+8	8 - 10
3 - 6 (Mid-Range)	+5	8 - 10
7 - 9 (Near Full)	+2	9 - 10

Combat Mitigation Equation

Defense is directional. Only attacks originating from the frontal sectors are eligible for mitigation. Attacks from the back (relative to the player's facing direction) ignore all defense and mitigation logic.

Damage_{Taken} = Rating_{Attack} - (Rating_{Defense} + Bonus_{Shield})

* Advanced Mitigation: If incoming frontal damage > Defense Rating, players may trade 1 Stamina to negate 1 Damage, up to their remaining Stamina.
* Guard Break Trigger: If a player is defending and the remaining damage \ge current remaining Stamina, the guard is shattered. The defense fails, the player takes full damage, and the opponent’s next hit deals Critical Damage.


--------------------------------------------------------------------------------


3. Grid & Spatial Logic

Spatial awareness and directional orientation are the primary defensive layers in MSK, superseding simple statistical checks.

The 9x9 Logical Grid

* Movement Constraints: Players move to one adjacent square (including diagonals) or stay in place.
* Collision Rule: Movement into an occupied cell is prohibited. If two entities move to the same cell, neither move resolves.
* Dodge Restriction: A creature cannot choose to dodge in the direction of a space currently occupied by another creature.

Directional Logic & Sectors

Orientation uses Cardinal (N, S, E, W) and Diagonal (NE, SE, SW, NW) directions.

* Dodge Sector Mechanic: Attacking players secretly select a "Sector" (Left, Center, or Right). These sectors are arcs of 2–3 directions relative to the attacker's facing direction.
* Evasion Probability: A Dodger choosing a space outside the attacker’s chosen sector succeeds in evading. This "Favor" mechanic grants a ~66% evasion probability unless the attacker correctly predicts the movement arc.

Range Classes

* Melee: 1 unit distance (0 units between creatures).
* Ranged: Distance defined by weapon range stat.
  * Standard Projectiles: Move during the Movement Phase.
  * Fast Projectiles: Move during both the Movement and Reveal/Action Phases.
  * Penalties: Ranged weapons suffer -1 WR when defending and -2 WR when used in melee.


--------------------------------------------------------------------------------


4. Loadout Architecture & "Memory" Systems

Character readiness is governed by the Rigging and Memory systems, simulating the mental and physical limits of a combatant.

Equipment Rigging & Handing

* Slots: Head, Torso, and 2 Hands (Left/Right).
* One-Handed: Occupies 1 Hand slot.
* Two-Handed: Occupies both Hand slots.
* Any-Handed: Flexible weapons that receive a +2 Weapon Rating (WR) bonus when configured in a Two-Handed state.

The Memory System (The Deck)

* Memory (Deck): 20 technique cards.
* Active Memory (Hand): 7 cards.
* Archetype Depth: High-power techniques require a specific number of cards from a consistent theme within the Memory to be playable. Examples of Archetypes include:
  * Fearweavers: Focus on hallucinations and paralysis.
  * Artificer: Synthesis of items and weapons.
  * Lightbringer: Faith-based darkness rebuking.
  * Midas: Bribes and gold-based transmutation.

The Age System (Months of Training)

Character power is balanced via "Months of Training" (MoT). Every card and piece of equipment has an MoT or Attunement Time value. The sum of these values determines the player’s power bracket for matchmaking.


--------------------------------------------------------------------------------


5. Proposed Data Schema (JSON)

This schema is designed for real-time WebSockets synchronization. It includes the staminaInflux for secret commitment and isTwoHanding to automate WR bonuses.

{
  "gameState": {
    "phaseId": "REVEAL_PHASE",
    "turnNumber": 12,
    "brokerReady": true
  },
  "players": [
    {
      "playerId": "P1",
      "hp": 23,
      "maxHp": 25,
      "stamina": 4,
      "staminaInflux": 2,
      "position": [4, 2],
      "facingDirection": "NE",
      "isTwoHanding": true,
      "equippedItems": {
        "head": "IronHelm",
        "torso": "LeatherArmor",
        "leftHand": "Zweihander",
        "rightHand": "Zweihander"
      }
    }
  ],
  "projectiles": [
    {
      "projectileId": "BOLT_01",
      "origin": [1, 1],
      "vector": "E",
      "velocity": 1,
      "isFast": false,
      "rangeRemaining": 5
    }
  ],
  "grid": {
    "dimensions": [9, 9],
    "occupants": [{"coord": [4, 2], "entityId": "P1"}],
    "hazards": []
  }
}



--------------------------------------------------------------------------------


6. Technical Requirements & Missing Data

The following mechanics requested in the directive are absent from the source context and require definition for implementation:

* Poise & Weight: There is currently no numerical system for weight or poise; equipment limits are strictly slot-based.
* Spatial Calculation Formula: The source does not define if the 9x9 grid utilizes Manhattan (4-way) or Euclidean/Chebyshev (8-way) distance for range and movement checks.
* Environmental Hazards: While the grid contains a hazard map, specific data on hazard types, damage values, or activation triggers are missing.
* Memory Shard Currency: The source defines "Shard tokens" (Colorless enchantment tokens with: "{2}, Sacrifice: Scry 1, draw a card"). It does not define "Memory Shards" as a currency for activating Technique cards; costs are currently handled exclusively via Stamina.
