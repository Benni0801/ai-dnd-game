#!/usr/bin/env node

// Script to switch to Google Gemini for deployment
const fs = require('fs');
const path = require('path');

console.log('🤖 Switching to Google Gemini for deployment...');

const originalRoute = path.join(__dirname, 'src', 'app', 'api', 'ai-dnd', 'route.ts');
const geminiRoute = path.join(__dirname, 'src', 'app', 'api', 'ai-dnd', 'route-gemini.ts');
const backupRoute = path.join(__dirname, 'src', 'app', 'api', 'ai-dnd', 'route-local-backup.ts');

try {
  // Backup the current version
  if (fs.existsSync(originalRoute)) {
    fs.copyFileSync(originalRoute, backupRoute);
    console.log('✅ Backed up current version');
  }

  // Replace with Gemini version
  if (fs.existsSync(geminiRoute)) {
    fs.copyFileSync(geminiRoute, originalRoute);
    console.log('✅ Switched to Google Gemini version');
  } else {
    console.error('❌ Gemini version not found!');
    process.exit(1);
  }

  console.log('\n🎉 Ready for Gemini deployment!');
  console.log('\nNext steps:');
  console.log('1. Get your Gemini API key: https://makersuite.google.com/app/apikey');
  console.log('2. Create .env.local file with: GOOGLE_API_KEY=your_key_here');
  console.log('3. Test locally: npm run dev');
  console.log('4. Deploy to Vercel/Netlify with the API key');
  console.log('\nTo switch back to local: node switch-to-local.js');

} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
