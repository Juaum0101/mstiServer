Front-End Interaction & UX Architecture Report: Morning Star: Kingdom (MSK)

1. Architectural Overview and Design Philosophy

In the Morning Star: Kingdom (MSK) ecosystem, the front-end client acts as a high-fidelity bridge between player intent and server-authoritative logic. Our architectural strategy shifts the burden of "local transient state" management to the client. This is a deliberate choice: to function as a true "Fighting Engine," the UI must allow players to explore modular "stepping stone" sequences—such as making a weapon flammable before igniting it—without constant server round-trips. By managing these micro-interactions locally until the final turn commitment, we enable fluid player self-expression and reduce cognitive load during the high-pressure simultaneous turn window.

The "One Thing" design philosophy dictates that the UI components remain modular. Rather than complex, multi-effect automated sequences, every card and action performs a singular function. The front-end’s primary responsibility is to maintain the tension of "Hidden Information" (Stamina and Health) while facilitating the secret input of simultaneous turns. This architecture ensures that the player feels immediate tactile control over their character's tactical evolution before the "Reveal" phase translates their intent into server-validated truth.

2. Module 1: Pre-Turn State Synchronization (The "Truth" Layer)

State synchronization is the critical "handshake" that validates the client-side environment before interaction begins. The UI must remain in a "Locked" state until a valid JSON payload is received via the MQTT broker.

Data Retrieval and Rendering

The client retrieves the current round state, including:

* Vital Reserves: Current HP (Max 30) and Current SP (Max 10). The UI must render these as percentage-based bars, ensuring players can track their own resources with precision.
* 9x9 Grid Coordinates: Positional data for the player piece and "visible entities."
* Fog of War Logic: To prevent client-side data mining and meta-gaming, the UI must only render entities explicitly provided in the visible_entities array of the JSON payload. Opponent HP/SP remains strictly hidden to enforce the tactical depth of MSK.

Connection Validation

The client establishes a connection using the Paho JavaScript Client to wss://[broker_url]:8884/mqtt. Note: The /mqtt suffix is mandatory for a successful WebSocket handshake. To prevent connection conflicts, the client must generate a unique client_id using a random GUID for each session.

3. Module 2: Phase 1 – The Memory Cycle (Hand Management UI)

The Memory Cycle facilitates the transition of techniques from "Memory" (the 20-card deck) to "Active Memory" (the 7-card hand).

The Hand vs. Fixed Action Bar

A critical architectural distinction exists between transient and permanent actions:

* Active Memory Hand: A 7-card UI container for cycled techniques.
* Fixed Action Bar: A persistent, separate UI shelf containing Basic Actions (Light Attack, Defend, Dodge, Breathe), Mutation techniques, and Weapon techniques. These items do not occupy Active Memory slots and cannot be cycled.

Interaction Logic: Click-to-Discard

1. Selection: Players click cards in their Active Memory to move them to a "Discard" queue.
2. Cycling: On selection, cards visually move to the bottom of the "Memory" stack.
3. Draw Validation: The "Confirm Draw" button remains disabled until the player has either queued discards or has fewer than 7 cards. This prevents redundant server requests. Upon confirmation, the client requests replenishment from the server.

4. Module 3: Phase 2 – Movement Phase (Spatial Input & Hidden Intent)

The 9x9 grid serves as the theater for simultaneous spatial evasion.

Interaction and Direction Tokens

Players input movement using eight Direction Tokens (N, S, E, W and diagonals). To preserve the simultaneous nature of play:

* Face-Down State: Clicking a token or a grid cell displays a "Locked" placeholder (an upside-down token icon).
* Hidden Intent: No final spatial data is transmitted until the phase concludes.
* Ghost Paths: The grid overlay must render "ghost paths" for any active Fast Projectiles (which move during both Movement and Action phases) to assist in evasion planning.

Collision Logic

* Local Static Check: If a player selects a cell occupied by a static entity (wall/object), the UI displays a red border and prevents the lock.
* Simultaneous Collision: If the server resolves a collision where two players attempt to enter the same space, the UI must animate a "No-Move" bounce-back effect, returning pieces to their starting coordinates as per MSK resolution rules.

5. Module 4: Phase 3 – Action Phase (Combat & Resource Constraints)

The Action Phase is the climax of player choice, where the UI enforces resource management via the following reactive logic:

Interaction Constraint	UI Reaction / Visual Feedback
SP Check	Gray out cards/actions if Current Stamina < Card Cost.
Handing Check	Disable two-handed techniques if the player has two separate one-handed items equipped.
Exhaustion Warning	Trigger a "Final Push" red-glow border if an action will take SP below 0.
Advanced Mitigation	If Incoming Damage > Defense Rating, display a Mitigation Slider to allow 1:1 Stamina-to-Health trades.

Directional Vectors and Influx

* Sectors: When an attack is selected, the UI prompts a "Left, Center, or Right" sector choice. This choice is critical for the "Favor" mechanic during Dodge resolution.
* Stamina Influx: For techniques with variable X:X costs (e.g., 2 SP per +1 Damage), a secret numeric input field appears only upon selecting a valid Influx-capable technique.

6. Module 5: Phase 4 – Resolution & Server Response (Outcome Visualization)

Upon commitment, the UI transitions to a narrative resolution state. A "Waiting for Opponent" overlay persists until the server returns the resolution payload.

Animation Timeline and Mathematical Rendering

The UI must step through the resolution in a specific narrative sequence:

1. Movement Phase: Standard projectiles move. Characters move (or bounce back on collision).
2. Action Phase: Fast projectiles perform their second movement. Combat techniques resolve.
3. Trade Logic: For Attack vs. Attack, the UI renders the equation: Damage = Damage_A - Damage_B.
4. Mitigation Display: For Defense actions, the UI renders: Damage_{Taken} = Rating_{Attack} - (Rating_{Defense} + Bonus_{Shield}).

Status Indicators

* Guard Break: Trigger a "Shield Shatter" effect if damage \ge remaining SP.
* Critical Damage: Following a Guard Break, the affected piece must display a persistent Critical Icon indicating that the next hit will deal critical damage.
* Exhaustion: Pieces "gray-out" or play a "heaving breath" animation if SP is negative, locking the player into the "Breathe" action.

7. Technical Appendix: Payload Structuring & MQTT Connectivity

Client Implementation

* Broker URL: wss://[broker_url]:8884/mqtt
* Library: Paho JavaScript Client.
* Client Identification: clientId = "msk_client_" + Math.random().toString(16).substr(2, 8);
* Message Handling: All resolution logic is triggered within the onMessageArrived callback.

JSON Payload Structure (Turn Commitment)

The client must pack the following key-value pairs for turn submission:

{
  "client_id": "GUID_STRING",
  "move_dir": "NE",
  "action_id": "TECH_042",
  "target_sector": "CENTER",
  "sp_influx_value": 4,
  "mitigation_spent": 2
}


This granular separation of concerns ensures that while the client provides a responsive, expressive "Fighting Engine" for the player, the server remains the final authority on the mathematics of combat, maintaining a cheat-resistant environment.
