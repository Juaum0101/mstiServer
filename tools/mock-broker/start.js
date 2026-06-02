const mqtt = require('mqtt');
const client = mqtt.connect('ws://192.168.0.57:8080');

client.on('connect', () => {
    console.log('Connected. Sending START_MATCH...');
    client.publish('game/admin', JSON.stringify({command: 'START_MATCH'}), () => {
        console.log('Sent.');
        setTimeout(() => process.exit(0), 2000);
    });
});

client.on('error', (err) => console.error(err));
