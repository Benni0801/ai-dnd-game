#!/usr/bin/env node

// Script to switch back to local Ollama for development
const fs = require('fs');
const path = require('path');

console.log('🏠 Switching back to local Ollama for development...');

const originalRoute = path.join(__dirname, 'src', 'app', 'api', 'ai-dnd', 'route.ts');
const localRoute = path.join(__dirname, 'src', 'app', 'api', 'ai-dnd', 'route-local-backup.ts');

try {
  if (fs.existsSync(localRoute)) {
    fs.copyFileSync(localRoute, originalRoute);
    console.log('✅ Switched back to local Ollama version');
    console.log('\nMake sure Ollama is running: ollama list');
  } else {
    console.error('❌ Local version backup not found!');
    process.exit(1);
  }

} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
