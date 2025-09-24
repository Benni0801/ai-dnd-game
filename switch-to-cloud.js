#!/usr/bin/env node

// Script to switch from local Ollama to cloud AI for deployment
const fs = require('fs');
const path = require('path');

console.log('🌐 Switching to cloud AI for online deployment...');

const originalRoute = path.join(__dirname, 'src', 'app', 'api', 'ai-dnd', 'route.ts');
const cloudRoute = path.join(__dirname, 'src', 'app', 'api', 'ai-dnd', 'route-cloud.ts');
const backupRoute = path.join(__dirname, 'src', 'app', 'api', 'ai-dnd', 'route-local-backup.ts');

try {
  // Backup the current local version
  if (fs.existsSync(originalRoute)) {
    fs.copyFileSync(originalRoute, backupRoute);
    console.log('✅ Backed up local version to route-local-backup.ts');
  }

  // Replace with cloud version
  if (fs.existsSync(cloudRoute)) {
    fs.copyFileSync(cloudRoute, originalRoute);
    console.log('✅ Switched to cloud AI version');
  } else {
    console.error('❌ Cloud version not found!');
    process.exit(1);
  }

  console.log('\n🎉 Ready for cloud deployment!');
  console.log('\nNext steps:');
  console.log('1. Get an API key from one of these services:');
  console.log('   • OpenAI: https://platform.openai.com/api-keys');
  console.log('   • Anthropic: https://console.anthropic.com/');
  console.log('   • Google: https://makersuite.google.com/app/apikey');
  console.log('2. Push to GitHub');
  console.log('3. Deploy to Vercel/Netlify/Railway');
  console.log('4. Add your API key as environment variable');
  console.log('5. Deploy!');
  console.log('\nTo switch back to local: node switch-to-local.js');

} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}

