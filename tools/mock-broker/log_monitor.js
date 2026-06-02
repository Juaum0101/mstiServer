const mqtt = require('mqtt');
const client = mqtt.connect('ws://192.168.0.57:8080');

client.on('connect', () => {
    console.log('Connected to MQTT. Subscribing to game/log...');
    client.subscribe('game/log');
});

client.on('message', (topic, message) => {
    console.log(`[${topic}] ${message.toString()}`);
});
