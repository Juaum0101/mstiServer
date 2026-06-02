const mqtt = require('mqtt');
const client = mqtt.connect('ws://192.168.0.57:8080');

client.on('connect', () => {
    console.log('Connected to ESP32 MQTT broker. Subscribing to game/#');
    client.subscribe('game/#');
});

client.on('message', (topic, message) => {
    console.log(`[${topic}] ${message.toString()}`);
});

client.on('error', (err) => {
    console.error('MQTT error:', err);
});
