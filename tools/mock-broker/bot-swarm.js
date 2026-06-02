const mqtt = require('mqtt');

const brokerUrl = 'ws://192.168.0.57:8080/';

const bots = [
  { id: 'BOT_1', name: 'AlphaBot' },
  { id: 'BOT_2', name: 'BravoBot' },
  { id: 'BOT_3', name: 'CharlieBot' }
];

let clients = [];
let hasMoved = false;

bots.forEach(bot => {
  const client = mqtt.connect(brokerUrl, {
    path: '/',
    protocol: 'ws',
    clientId: 'mqttjs_' + bot.id
  });

  clients.push(client);

  client.on('connect', () => {
    console.log(`${bot.name} connected to ESP32.`);
    
    // Subscribe to state
    client.subscribe(`game/state/${bot.id}`);

    // Join game
    client.publish('game/join', JSON.stringify({
      playerId: bot.id,
      playerName: bot.name,
      equippedItems: { head: 'None', torso: 'None', leftHand: 'None', rightHand: 'None' },
      mutations: { hasAny: false, hasAlpha: false, hasBeta: false },
      isTwoHanding: false
    }));

    // Vote to start immediately
    setTimeout(() => {
      client.publish('lobby/vote', JSON.stringify({
        playerId: bot.id,
        ready: true
      }));
    }, 1000);
  });

  client.on('message', (topic, message) => {
    try {
      const state = JSON.parse(message.toString());
      
      // If we are in MOVEMENT_CHOICE, attempt to move to [4,4] simultaneously
      const myPlayer = state.players.find(p => p.playerId === bot.id);
      if (state.gameState.phaseId === 'MOVEMENT_CHOICE' && myPlayer && !myPlayer.isReady) {
        console.log(`Phase is MOVEMENT_CHOICE. ${bot.name} dispatching movement to [4,4].`);
        
        client.publish('game/action', JSON.stringify({
            playerId: bot.id,
            type: 'MOVEMENT',
            targetX: 4,
            targetY: 4,
            targetDirection: 'N',
            staminaInflux: 0
        }));
      }
      
      // Log collision check if we transition back to MOVEMENT_CHOICE after RESOLVE
      // or check the resulting state for positions.
      if (state.gameState.phaseId === 'ACTION_CHOICE') {
        if (myPlayer) {
          console.log(`[STATE CHECK] ${bot.name} is at [${myPlayer.position[0]}, ${myPlayer.position[1]}]`);
          if (!myPlayer.isReady) {
            console.log(`Phase is ACTION_CHOICE. ${bot.name} dispatching DEFEND.`);
            client.publish('game/action', JSON.stringify({
                playerId: bot.id,
                type: 'DEFEND',
                targetX: myPlayer.position[0],
                targetY: myPlayer.position[1],
                targetDirection: 'N',
                staminaInflux: 0
            }));
          }
        }
      }
    } catch(e) {}
  });
});
