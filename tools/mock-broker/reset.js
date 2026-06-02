const mqtt = require('mqtt');
const ESP_IP = '192.168.0.57';
const wsUrl = `ws://${ESP_IP}:8080`;
const client = mqtt.connect(wsUrl);

client.on('connect', () => {
    console.log('Connected. Sending RESET_GAME...');
    client.publish('game/admin', JSON.stringify({ command: 'RESET_GAME' }));
    console.log('Sent.');
    setTimeout(() => process.exit(0), 1000);
});
