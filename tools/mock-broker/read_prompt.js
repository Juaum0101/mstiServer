const fs = require('fs');
const readline = require('readline');
const path = require('path');

const fileStream = fs.createReadStream('C:\\Users\\João Vitor\\.gemini\\antigravity-cli\\brain\\dcf024c8-3093-4f6e-aab0-2ec6486d57a8\\.system_generated\\logs\\transcript_full.jsonl');

const rl = readline.createInterface({
  input: fileStream,
  crlfDelay: Infinity
});

rl.on('line', (line) => {
  if (line.includes('QA Directive: Automated Local Engine Testing')) {
    const obj = JSON.parse(line);
    console.log(obj.content);
    process.exit(0);
  }
});
