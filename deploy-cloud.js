#!/usr/bin/env node

// Simple deployment script to switch to cloud version
const fs = require('fs');
const path = require('path');

console.log('🚀 Preparing for cloud deployment...');

// Backup original route
const originalRoute = path.join(__dirname, 'src', 'app', 'api', 'ai-dnd', 'route.ts');
const cloudRoute = path.join(__dirname, 'src', 'app', 'api', 'ai-dnd', 'route-cloud.ts');
const backupRoute = path.join(__dirname, 'src', 'app', 'api', 'ai-dnd', 'route-local.ts');

try {
  // Backup original (local) version
  if (fs.existsSync(originalRoute)) {
    fs.copyFileSync(originalRoute, backupRoute);
    console.log('✅ Backed up local version to route-local.ts');
  }

  // Replace with cloud version
  if (fs.existsSync(cloudRoute)) {
    fs.copyFileSync(cloudRoute, originalRoute);
    console.log('✅ Switched to cloud version (route-cloud.ts → route.ts)');
  } else {
    console.error('❌ Cloud version not found!');
    process.exit(1);
  }

  console.log('\n🎉 Ready for cloud deployment!');
  console.log('\nNext steps:');
  console.log('1. Push to GitHub');
  console.log('2. Connect to Vercel/Netlify');
  console.log('3. Add OPENAI_API_KEY environment variable');
  console.log('4. Deploy!');
  console.log('\nTo switch back to local: node deploy-local.js');

} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}

