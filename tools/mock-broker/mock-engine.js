const aedes = require('aedes')();
const server = require('net').createServer(aedes.handle);
const ws = require('ws');

const PORT = 8080;

const wsServer = new ws.Server({ port: PORT });
wsServer.on('connection', function (conn, req) {
  const stream = ws.createWebSocketStream(conn);
  aedes.handle(stream);
});

console.log(`Mock MQTT Broker running on ws://localhost:${PORT}/`);

let mockState = {
  gameState: {
    phaseId: 'READY_PHASE',
    turnNumber: 0,
    brokerReady: true,
    config: {
      mutationsAllowed: false,
      marksActive: false,
      techniquesEnabled: false,
      classVisibility: false,
      namesVisible: true,
      newbieMode: false,
      fogRange: 4,
      perTurnLimit: 60,
      matchTimer: 15
    }
  },
  turnStatuses: [],
  players: []
};

let connectedPlayers = new Set();
let gameTimer = null;

// Helper to get active, non-fallen players
function getAlivePlayers() {
  return mockState.players.filter(p => p.active && !p.isFallen);
}
function getActivePlayers() {
  return mockState.players.filter(p => p.active);
}

function checkWinCondition() {
  if (mockState.gameState.phaseId === 'READY_PHASE' || mockState.gameState.phaseId === 'GAME_OVER') return;

  const alive = getAlivePlayers();
  const activeCount = getActivePlayers().length;
  if (activeCount > 1 && alive.length === 1) {
    console.log(`[MOCK] Player ${alive[0].playerName} wins! GAME OVER.`);
    mockState.gameState.phaseId = 'GAME_OVER';
    broadcastState();
    
    // Auto-wipe and return to lobby after 5 seconds
    setTimeout(() => {
      console.log(`[MOCK] Wiping game state and returning to Lobby...`);
      mockState.players = [];
      mockState.turnStatuses = [];
      mockState.gameState.phaseId = 'READY_PHASE';
      mockState.gameState.turnNumber = 0;
      broadcastState();
    }, 5000);
  } else if (activeCount > 0 && alive.length === 0) {
     // Draw
    mockState.gameState.phaseId = 'GAME_OVER';
    broadcastState();
    setTimeout(() => {
      mockState.players = [];
      mockState.turnStatuses = [];
      mockState.gameState.phaseId = 'READY_PHASE';
      mockState.gameState.turnNumber = 0;
      broadcastState();
    }, 5000);
  }
}

function processTurn() {
  const alive = getAlivePlayers();
  if (alive.length === 0) return;

  // Check if all alive are ready
  const allReady = alive.every(p => p.isReady);
  if (!allReady) return;

  if (mockState.gameState.phaseId === 'MOVEMENT_CHOICE') {
    // Resolve movement
    console.log('[MOCK] Resolving MOVEMENT_CHOICE');
    let targetPositions = {};
    alive.forEach(p => {
      if (p.currentIntent && p.currentIntent.type === 'MOVE') {
        p.targetPosition = [p.currentIntent.targetX, p.currentIntent.targetY];
      } else {
         p.targetPosition = [...p.position]; // Stay in place if didn't move
      }
      
      const posKey = `${p.targetPosition[0]},${p.targetPosition[1]}`;
      if (!targetPositions[posKey]) targetPositions[posKey] = [];
      targetPositions[posKey].push(p);
    });

    // Check collisions
    alive.forEach(p => {
      const posKey = `${p.targetPosition[0]},${p.targetPosition[1]}`;
      if (targetPositions[posKey].length > 1) {
        console.log(`[MOCK] Collision at ${posKey} for ${p.playerName}! Bouncing back.`);
        // Collision, stay at original
      } else {
        p.position = [...p.targetPosition];
      }
      if (p.currentIntent && p.currentIntent.targetDirection) {
        p.facingDirection = p.currentIntent.targetDirection;
      }
    });

    // Reset intents and ready state
    alive.forEach(p => {
      p.isReady = false;
      p.currentIntent = null;
      let ts = mockState.turnStatuses.find(t => t.name === p.playerName);
      if (ts) ts.status = "Choosing";
    });

    mockState.gameState.phaseId = 'ACTION_CHOICE';
    broadcastState();

  } else if (mockState.gameState.phaseId === 'ACTION_CHOICE') {
    // Resolve actions
    console.log('[MOCK] Resolving ACTION_CHOICE');
    alive.forEach(p => {
      if (p.currentIntent && p.currentIntent.type === 'ATTACK') {
        const attackX = p.currentIntent.targetX;
        const attackY = p.currentIntent.targetY;
        // Find target
        const target = alive.find(t => t.playerId !== p.playerId && t.position[0] === attackX && t.position[1] === attackY);
        if (target) {
           let damage = 2; // Fists flat damage
           
           // Check if target defended
           if (target.currentIntent && target.currentIntent.type === 'DEFEND') {
             damage = Math.max(0, damage - 1);
           } else if (target.currentIntent && target.currentIntent.type === 'DODGE') {
             // Basic dodge logic for mock - just avoid if they moved out, but action choice is AFTER movement. 
             // In full game, Dodge moves you out of the way. If they dodged, maybe 0 damage here for simplicity
             damage = 0;
           }

           target.hp -= damage;
           console.log(`[MOCK] ${p.playerName} hit ${target.playerName} for ${damage}. Target HP: ${target.hp}`);
           
           if (target.hp <= 0) {
             target.hp = 0;
             target.isFallen = true;
           }
        }
      }
    });

    // Reset intents and ready state
    alive.forEach(p => {
      p.isReady = false;
      p.currentIntent = null;
      let ts = mockState.turnStatuses.find(t => t.name === p.playerName);
      if (ts) ts.status = "Choosing";
    });

    mockState.gameState.phaseId = 'MOVEMENT_CHOICE';
    mockState.gameState.turnNumber++;
    
    broadcastState();
    checkWinCondition();
  }
}

aedes.on('subscribe', function (subscriptions, client) {
  subscriptions.forEach(sub => {
    if (sub.topic.startsWith('game/state/')) {
      const pId = sub.topic.replace('game/state/', '');
      connectedPlayers.add(pId);
    }
  });
});

const getSpawnCoords = (index) => {
    const coords = [[4, 0], [4, 8], [0, 4], [8, 4], [2, 2], [6, 6], [2, 6], [6, 2]];
    return coords[index % coords.length];
};

aedes.on('publish', function (packet, client) {
  if (client) {
     console.log(`[BROKER] Received topic ${packet.topic} from ${client.id}:`, packet.payload.toString());
  }
  if (packet.topic === 'game/join') {
    const payloadStr = packet.payload.toString();
    try {
      const joinData = JSON.parse(payloadStr);
      const pid = joinData.playerId;
      
      let p = mockState.players.find(pl => pl.playerId === pid);
      if (!p) {
        let spawnCount = mockState.players.length;
        let spawn = getSpawnCoords(spawnCount);
        p = {
          playerId: pid,
          playerName: joinData.playerName,
          active: true,
          hp: 5,
          maxHp: 5,
          stamina: 10,
          staminaInflux: 0,
          position: [-1, -1],
          targetPosition: [-1, -1],
          facingDirection: "N",
          isTwoHanding: false,
          isExhausted: false,
          isFallen: false,
          nextHitCritical: false,
          isReady: false,
          equippedItems: { head: "None", torso: "None", leftHand: "None", rightHand: "None" },
          activeMemory: [],
          currentIntent: null
        };
        mockState.players.push(p);
        mockState.turnStatuses.push({ name: joinData.playerName, status: "Choosing" });
      } else {
        p.playerName = joinData.playerName;
        p.active = true;
        p.isReady = false;
      }
      console.log(`[MOCK] Player ${p.playerName} joined lobby.`);
      broadcastState();
    } catch(e) {}
  } else if (packet.topic === 'lobby/quit') {
     const payloadStr = packet.payload.toString();
     try {
       const data = JSON.parse(payloadStr);
       const p = mockState.players.find(pl => pl.playerId === data.playerId);
       if (p) {
         p.active = false;
         p.isReady = false;
         console.log(`[MOCK] Player ${p.playerName} quit.`);
         broadcastState();
       }
     } catch(e) {}
  } else if (packet.topic === 'lobby/vote') {
    const payloadStr = packet.payload.toString();
    try {
      const data = JSON.parse(payloadStr);
      const p = mockState.players.find(pl => pl.playerId === data.playerId);
      if (p) {
        p.isReady = data.ready;
        console.log(`[MOCK] Player ${p.playerName} voted ready: ${p.isReady}`);
        
        const active = getActivePlayers();
        const readyCount = active.filter(a => a.isReady).length;
        if (active.length > 1 && readyCount > active.length / 2 && mockState.gameState.phaseId === 'READY_PHASE') {
           console.log(`[MOCK] Majority reached. Starting Match!`);
           mockState.gameState.phaseId = 'MOVEMENT_CHOICE';
           mockState.gameState.turnNumber = 1;
           active.forEach((ap, idx) => {
               ap.isReady = false;
               let spawn = getSpawnCoords(idx);
               ap.position = [...spawn];
               ap.targetPosition = [...spawn];
               ap.hp = 5;
               ap.maxHp = 5;
               ap.isFallen = false;
           });
        }
        broadcastState();
      }
    } catch(e) {}
  } else if (packet.topic === 'game/action') {
    const payloadStr = packet.payload.toString();
    try {
      const intent = JSON.parse(payloadStr);
      const pid = intent.playerId;
      
      const ts = mockState.turnStatuses.find(t => t.name === (mockState.players.find(pl => pl.playerId === pid)?.playerName || ''));
      if (ts) ts.status = "Ready";
      
      const p = mockState.players.find(pl => pl.playerId === pid);
      if (p && !p.isFallen) {
        p.isReady = true;
        p.currentIntent = intent;
        console.log(`[MOCK] Player ${p.playerName} locked in intent: ${intent.type}`);
        broadcastState();
        setTimeout(processTurn, 100);
      }
    } catch(e) {}
  }
});

function broadcastState() {
  connectedPlayers.forEach(pId => {
    const topic = `game/state/${pId}`;
    
    // Create a personalized payload to respect Fog of War
    let personalizedState = JSON.parse(JSON.stringify(mockState));
    personalizedState.players.forEach(p => {
       if (p.playerId !== pId) {
           p.currentIntent = null; // Hide intents of others
       }
    });

    aedes.publish({ topic: topic, payload: Buffer.from(JSON.stringify(personalizedState)) });
  });
}

setInterval(() => {
  broadcastState();
}, 2000);
