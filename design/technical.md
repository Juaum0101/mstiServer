Technical Design Report: Morning Star: Kingdom (MSK) Systems Architecture

1. Primary Objective Functions & Win Conditions

In the architecture of Morning Star: Kingdom (MSK), the mathematical equilibrium is established by defining a clear, measurable trajectory toward a terminal state. Defining win conditions is not merely a rule-making exercise but the foundation for the game’s systemic balance. By grounding the strategic experience in quantitative victory states, the system ensures that every player interaction—from resource conversion to spatial positioning—contributes to a sustainable and predictable game loop.

Measurable Victory State

The MSK victory state is a zero-sum outcome defined by the "Last Player Standing" rule. A player is eliminated when their Health (HP) pool is depleted to an integer of 0 or less, resulting in the "Fallen" state. The architecture recognizes victory only when a single participant remains with a positive HP value.

Optimization Metrics

To achieve this victory state, players must optimize a tri-part resource ecosystem. These metrics serve as the primary levers for balancing the game's mathematical throughput:

* Health (30 HP Default): The terminal buffer. HP represents the final threshold of player existence.
* Stamina (10 SP Default): The governing metric for the "Action Economy." Because nearly all techniques require a cost, SP acts as a throttle on the frequency and intensity of player output.
* Weapon Rating (WR): The primary multiplier for combat efficiency. WR determines raw damage output, mitigation potential, and the success of "Trades."

These high-level metrics dictate the granular flow of each round, forcing players into a constant evaluation of aggressive depletion versus defensive conservation.


--------------------------------------------------------------------------------


2. Temporal Architecture: Turn Phases & Action Economy

The temporal structure of MSK is designed to maximize efficiency and ensure simultaneous resolution. By removing the traditional sequential turn order, the architecture minimizes "wait-state" latency and prioritizes deterministic planning and psychological anticipation.

Phase Breakdown

The MSK engine operates on a four-phase simultaneous execution loop:

1. Memory Cycle Phase: A maintenance step for the Memory (Deck) and Active Memory (Hand). Players manage their total Memory of 20 cards (consisting of 7 Active Memory and 13 in the reserve). Players may discard any number of cards to the bottom of the Memory and draw back up to their Active Memory limit of 7.
2. Movement Phase: Spatial repositioning occurs here. Players reveal intended coordinates on the 9x9 grid. Projectiles (e.g., arrows, orbs) update their positions during this window.
3. Action Phase: Players secretly select their Techniques (Technique cards, Mutation Techniques, or Weapon Techniques) and set their intended vectors using direction tokens.
4. Reveal & Resolution Phase: All players simultaneously disclose their actions. The engine calculates damage, mitigation, and state changes (such as Guard Break or Exhaustion) to update the global game state.

Action Economy Constraints

The Action Phase is governed by two critical systemic constraints. First, Stamina Costs impose a hard ceiling on action frequency; techniques cannot be executed without sufficient SP. Second, the Handing rule (a 2-hand limit) restricts equipment-based actions. A character is limited to what their "Handing" allows—typically one two-handed weapon or two one-handed items—preventing unconstrained stat-stacking through inventory bloating.


--------------------------------------------------------------------------------


3. Core Mechanics & System Loops

Standardized logical processes are required to ensure consistent combat resolution across diverse archetypes. These equations allow players to forecast outcomes based on visible variables like WR and current SP reserves.

The Mitigation Engine

The MSK engine resolves combat through a specific hierarchy of mathematical logic:

* The Trade Equation: When two attacks clash, the system resolves the interaction as a "Trade" where the higher value deals the difference: Damage = Damage_{AttackA} - Damage_{AttackB}
* The Mitigation Equation: When a player chooses to defend, the incoming damage is filtered through the Defense Rating: Damage_{Taken} = Rating_{Attack} - (Rating_{Defense} + Bonus_{Shield}) Shields provide a specialized "Bonus" to the Defense Rating that standard weapons do not possess.

Resource Conversion Loops

The sustainability of combat is dependent on the following conversion loops:

* Stamina-to-HP Conversion: Through the 1:1 Stamina Trade, players may burn physical reserves to mitigate excess damage. For every 1 additional SP spent beyond the initial block cost, 1 point of damage is negated. The Limit: A player can only spend up to their current remaining Stamina; trading into negative SP for mitigation is strictly prohibited by the engine logic.
* Stamina Recovery Equilibrium: The Breathe action (+0 SP cost) utilizes a front-loaded recovery mechanic to manage pacing. This risk/reward equilibrium is designed to aid players at total depletion while discouraging "topping off":
  * Exhausted (0-2 SP): +8 SP (High-speed recovery for vulnerable players).
  * Mid-Range (3-6 SP): +5 SP (Standard pacing).
  * Near Full (7-9 SP): +2 SP (Low efficiency, discourages stalling).

Spatial Logic & Favor

The Dodge mechanic is a probability-based system centered on sector coverage. An attacker chooses one of 3 sectors (Left, Center, Right) while a defender chooses one of 8 adjacent spaces. Mathematically, the attacker covers a sector of 2 to 3 spaces, resulting in a defender success rate of 62.5% (5/8) to 75% (6/8). This "Defense Favor" is an architectural choice to reward mobility.


--------------------------------------------------------------------------------


4. Mathematical Framework & Variable Tuning

The following framework defines the "Standard Human" baseline and serves as the core reference for balancing power brackets.

Quantitative Variable Registry

Category	Variable	Default Value	Technical Effect
Base Stats	Max Health (HP)	30	Terminal resource pool.
	Max Stamina (SP)	10	Action economy governor.
	Healing Flasks	3 Units	Restores 7 HP each; requires Breathe action.
Deck Constraints	Total Techniques	20	Total cards in Memory (Deck).
	Active Memory	7	Hand size limit.
	Inventory Limit	5	Max items (Weapons/Consumables).
	MoT Cap	Variable	Months of Training; prevents power creep.
Action Costs	Light Attack	1 SP	Standard melee damage.
	Heavy Attack	3 SP	High damage; cost-heavy.
	Dodge Roll	2 SP	Positional evasion.
	Parry	4 SP	High risk; Guard Breaks attacker.
	Touch	1 SP	0-damage melee; applies Marks.
	Breathe	0 SP	Initiates Stamina Recovery loop.

Systemic Penalties & Ratios

* Mutation Price Formula: Any mutation incurs a flat -5 Max HP penalty.
  * Alpha Mutation: Additional -6 HP (Total penalty: -11 HP). Total Effective HP: 19.
  * Beta Mutation: Additional -2 HP (Total penalty: -7 HP). Total Effective HP: 23.
* Input/Output Efficiency Ratios:
  * Ranged-in-Melee: Ranged weapons used for melee attacks suffer a WR - 2 penalty.
  * Ranged Defense: Ranged weapons used to defend suffer a WR - 1 penalty.
* The Age System: The Months of Training (MoT) value on cards acts as the primary balancing lever. By capping the total MoT of a Memory (Deck), the system enforces specialization and prevents the accumulation of "best-in-slot" techniques.


--------------------------------------------------------------------------------


5. Design Philosophy & Intended System Dynamics

MSK’s design philosophy prioritizes player expression through a "fighting engine" feel, balancing high-skill determinism against calculated variance.

Archetype Depth & Specialization

The system prevents "Goodstuff" deck bloating through the Archetype Depth requirement. "Stronger" techniques are mathematically locked behind a minimum thematic density in the Memory (Deck). This forces a correlation between MoT investment and thematic power, ensuring that specialization is a prerequisite for high-tier output.

Negative Feedback Loops

To prevent stalemates and penalize poor resource throughput, the engine utilizes two critical negative feedback loops:

* Guard Break: Triggered when incoming damage exceeds a defender's remaining SP. The defense fails, the player takes full damage, and they are susceptible to Critical Damage on the opponent's next successful hit.
* Exhaustion: Occurs when a player utilizes a "Final Push" to spend into negative Stamina. While this allows for a desperate final action, the player is locked into the "Exhausted" state—unable to perform any action other than Breathe—creating a window of extreme vulnerability.

These integrated systems provide a robust mathematical model for MSK, ensuring that strategic depth is enforced by the integer constraints of the architecture.