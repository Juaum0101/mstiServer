const mqtt = require('mqtt');

const STA_IP = '192.168.0.57'; // Ensure this matches your ESP32's STA IP
const PORT = 8080;

const client = mqtt.connect(`ws://${STA_IP}:${PORT}/`, {
  path: '/',
  protocol: 'ws'
});

client.on('connect', () => {
  console.log(`Connected to ESP32 broker at ws://${STA_IP}:${PORT}/`);
  
  // Subscribe to game/state
  client.subscribe('game/state', (err) => {
    if (!err) {
      console.log('Successfully subscribed to game/state');
      // Sync state immediately
      client.publish('game/sync', '');
    }
  });

  // Flow simulation
  setTimeout(() => {
    console.log('\n[TEST] 0. Simulating Game Reset...');
    const adminCmd = { command: "RESET_GAME" };
    client.publish('game/admin', JSON.stringify(adminCmd));
  }, 500);

  setTimeout(() => {
    console.log('\n[TEST] 1. Simulating Player 1 Join...');
    const p1Join = {
      playerId: "P1",
      playerName: "Sir Lancelot",
      equippedItems: {
        head: "IronHelm",
        torso: "LeatherArmor",
        leftHand: "Zweihander",
        rightHand: "Zweihander"
      },
      mutations: { hasAny: false, hasAlpha: false, hasBeta: false },
      isTwoHanding: true
    };
    client.publish('game/join', JSON.stringify(p1Join));
  }, 1000);

  setTimeout(() => {
    console.log('\n[TEST] 2. Simulating Admin starting the match...');
    const adminCmd = { command: "START_MATCH" };
    client.publish('game/admin', JSON.stringify(adminCmd));
  }, 3000);

  setTimeout(() => {
    console.log('\n[TEST] 3. Simulating Player 1 Action Intent...');
    const intent = {
      playerId: "P1",
      intentType: "MOVEMENT",
      x: 4,
      y: 7, // Move North (assuming P1 starts at 4,8)
      direction: "N",
      staminaInflux: 0
    };
    client.publish('game/action', JSON.stringify(intent));
  }, 5000);
});

client.on('message', (topic, message) => {
  if (topic === 'game/state') {
    const state = JSON.parse(message.toString());
    console.log(`\n--- Game State Update [Turn ${state.gameState.turnNumber} | Phase: ${state.gameState.phaseId}] ---`);
    state.players.forEach(p => {
        console.log(`Player ${p.playerId} (${p.playerName}): HP ${p.hp}/${p.maxHp}, STM ${p.stamina}, Pos [${p.position[0]},${p.position[1]}]`);
    });
  }
});

client.on('error', (err) => {
  console.error('MQTT Connection Error:', err);
});
