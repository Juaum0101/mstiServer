const fs = require('fs');
const lines = fs.readFileSync('C:\\Users\\João Vitor\\.gemini\\antigravity-cli\\brain\\dcf024c8-3093-4f6e-aab0-2ec6486d57a8\\.system_generated\\tasks\\task-1179.log', 'utf8').split('\n');

for (let i = lines.length - 1; i >= Math.max(0, lines.length - 200); i--) {
  if (lines[i].includes('BOT_1') && lines[i].includes('"hp":')) {
    const match = lines[i].match(/"hp":(\d+)/);
    if (match && parseInt(match[1]) < 30) {
      console.log('FOUND REDUCED HP!', lines[i].substring(0, 200));
      process.exit(0);
    }
  }
}
console.log('No HP reduction found in last 200 lines.');
