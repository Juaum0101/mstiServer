const mqtt = require('mqtt');

const ESP_IP = '192.168.0.57';
const wsUrl = `ws://${ESP_IP}:8080`;

const client = mqtt.connect(wsUrl);
const playerId = 'Bot1';
const playerName = 'BravoBot';

client.on('connect', () => {
    console.log(`${playerName} connected to ESP32.`);
    
    client.publish('game/join', JSON.stringify({
        playerId: playerId,
        playerName: playerName
    }));

    client.subscribe(`game/state/${playerId}`);
    client.publish('game/sync', JSON.stringify({ action: "sync" }));


    setTimeout(() => {
        // Vote to start
        client.publish('lobby/vote', JSON.stringify({
            playerId: playerId,
            ready: true
        }));
        console.log(`${playerName} voted to start.`);
    }, 1000);
});

client.on('message', (topic, message) => {
    if (topic === `game/state/${playerId}`) {
        const state = JSON.parse(message.toString());
        if (state.gameState.phaseId === 'MOVEMENT_CHOICE' && !state.players.find(p => p.playerId === playerId).isReady) {
            console.log('Phase is MOVEMENT_CHOICE. Bot1 is ready to move. Sending intent...');
            client.publish('game/action', JSON.stringify({
                type: 'MOVEMENT',
                targetX: 4,
                targetY: 4,
                targetDirection: 'N',
                staminaInflux: 0,
                playerId: playerId
            }));
        }
    }
});
