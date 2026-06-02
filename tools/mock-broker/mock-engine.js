const aedes = require('aedes')();
const server = require('net').createServer(aedes.handle);
const ws = require('ws');

const PORT = 8080;

// Create a WebSocket server attached to aedes
const wsServer = new ws.Server({ port: PORT });
wsServer.on('connection', function (conn, req) {
  const stream = ws.createWebSocketStream(conn);
  aedes.handle(stream);
});

console.log(`Mock MQTT Broker running on ws://localhost:${PORT}/`);

let mockState = {
  gameState: {
    phaseId: 'ACTION_CHOICE',
    turnNumber: 1,
    brokerReady: true,
    config: {
      mutationsAllowed: true,
      marksActive: true,
      techniquesEnabled: true,
      classVisibility: false,
      namesVisible: true,
      newbieMode: false,
      fogRange: 4,
      perTurnLimit: 60,
      matchTimer: 15
    }
  },
  turnStatuses: [
    { name: "MockOpponent", status: "Ready" }
  ],
  players: [
    {
      playerId: "P_MOCK",
      playerName: "MockOpponent",
      active: true,
      hp: 30,
      maxHp: 30,
      position: [4, 8],
      targetPosition: [4, 8],
      facingDirection: "S",
      isTwoHanding: false,
      isExhausted: false,
      isFallen: false,
      nextHitCritical: false,
      isReady: true,
      equippedItems: {
        head: "None", torso: "None", leftHand: "None", rightHand: "None"
      }
    }
  ]
};

// Store connected players
let connectedPlayers = new Set();

aedes.on('subscribe', function (subscriptions, client) {
  subscriptions.forEach(sub => {
    console.log(`Client ${client.id} subscribed to ${sub.topic}`);
    if (sub.topic.startsWith('game/state/')) {
      const pId = sub.topic.replace('game/state/', '');
      connectedPlayers.add(pId);
      
      // Ensure the player is in the state
      const exists = mockState.players.find(p => p.playerId === pId);
      if (!exists) {
        // Find their name from turnStatuses if any
        mockState.players.push({
          playerId: pId,
          playerName: `LocalPlayer_${pId}`,
          active: true,
          hp: 30,
          maxHp: 30,
          stamina: 10,
          staminaInflux: 0,
          position: [4, 0],
          targetPosition: [4, 0],
          facingDirection: "N",
          isTwoHanding: false,
          isExhausted: false,
          isFallen: false,
          nextHitCritical: false,
          isReady: false,
          equippedItems: {
            head: "None", torso: "None", leftHand: "None", rightHand: "None"
          },
          activeMemory: [],
          currentIntent: {
            type: "NONE", targetX: 4, targetY: 0, targetDirection: "N", staminaInflux: 0
          }
        });
        mockState.turnStatuses.push({ name: `LocalPlayer_${pId}`, status: "Choosing" });
      }
    }
  });
});

aedes.on('publish', function (packet, client) {
  if (packet.topic === 'game/action') {
    const payloadStr = packet.payload.toString();
    console.log('\n[MOCK] Received Action Intent:', payloadStr);
    
    try {
      const intent = JSON.parse(payloadStr);
      const pid = intent.playerId;
      
      // Update state to mock the "Locked In" behavior
      const ts = mockState.turnStatuses.find(t => t.name === `LocalPlayer_${pid}`);
      if (ts) ts.status = "Ready";
      
      const p = mockState.players.find(pl => pl.playerId === pid);
      if (p) p.isReady = true;

      console.log(`[MOCK] Player ${pid} is now Ready.`);
      broadcastState();
    } catch(e) {
      console.error('Failed to parse intent JSON');
    }
  } else if (packet.topic === 'game/join') {
    const payloadStr = packet.payload.toString();
    console.log('\n[MOCK] Received Join Intent:', payloadStr);
    try {
      const joinData = JSON.parse(payloadStr);
      const pid = joinData.playerId;
      
      // Update name
      const p = mockState.players.find(pl => pl.playerId === pid);
      if (p) p.playerName = joinData.playerName;
      
      const ts = mockState.turnStatuses.find(t => t.name === `LocalPlayer_${pid}`);
      if (ts) ts.name = joinData.playerName;
      else mockState.turnStatuses.push({ name: joinData.playerName, status: "Choosing" });
      
      broadcastState();
    } catch(e) {}
  }
});

function broadcastState() {
  connectedPlayers.forEach(pId => {
    // We send the full mockState, but since the Fog of War rules state
    // self should have stamina and intents, our mockState already gives
    // full data only to LocalPlayer (by pushing it with those fields) and
    // omits them for MockOpponent. So we can just send the same JSON string
    // to everyone as a quick approximation for local UI development.
    const topic = `game/state/${pId}`;
    aedes.publish({ topic: topic, payload: Buffer.from(JSON.stringify(mockState)) });
  });
}

// Broadcast loop
setInterval(() => {
  broadcastState();
}, 2000);
