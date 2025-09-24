# 🚀 Enhanced D&D Game - Deployment Guide

Your D&D game now has **full database persistence** and **session management**! Here's how to deploy it.

## ✨ New Features Added

### 🗄️ Database Integration
- **Game Sessions**: Save and resume adventures
- **Character Persistence**: Characters saved to database
- **Game Notes**: Take notes during adventures
- **Turn History**: Complete conversation history saved
- **Game State**: Location, quest progress, NPC relations

### 📝 Note-Taking System
- **Categorized Notes**: General, Quest, NPC, Location, Loot
- **Session-Linked**: Notes tied to specific game sessions
- **Persistent Storage**: Notes saved in database

### 🎲 Enhanced Dice System
- **D20 Integration**: Full dice rolling with AI integration
- **Roll History**: All dice rolls saved with turns
- **AI Dice Requests**: AI can request specific rolls

## 🏗️ Architecture

```
Frontend (React/Next.js)
├── Enhanced Game Component
├── Character Management
├── Notes System
└── Dice Rolling

Backend (Next.js API Routes)
├── /api/ai-dnd (Ollama Integration)
├── /api/sessions (Game Session Management)
├── /api/notes (Note Management)
├── /api/turns (Turn History)
└── /api/characters (Character CRUD)

Database (JSON-based)
├── gameSessions.json
├── gameNotes.json
├── gameTurns.json
├── characters.json
└── users.json
```

## 🚀 Deployment Options

### Option 1: Local with ngrok (Recommended for Testing)

1. **Start your game locally:**
   ```bash
   npm run dev
   ```

2. **Install ngrok:**
   ```bash
   npm install -g ngrok
   ```

3. **Create public tunnel:**
   ```bash
   ngrok http 3000
   ```

4. **Share the ngrok URL** (e.g., `https://abc123.ngrok.io`)

**Benefits:**
- ✅ Completely FREE
- ✅ Uses your local Ollama
- ✅ Full database persistence
- ✅ All features work

**Limitations:**
- ❌ Your computer must stay on
- ❌ ngrok free tier has limitations

### Option 2: Railway with Ollama (Free Tier)

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Enhanced D&D game with database"
   git push origin main
   ```

2. **Deploy to Railway:**
   - Go to [railway.app](https://railway.app)
   - Connect GitHub repository
   - Add Ollama service from template
   - Deploy your game service
   - Set environment variable: `OLLAMA_URL=https://your-ollama-service.railway.app`

3. **Install model in Ollama:**
   ```bash
   ollama pull llama3.2:1b
   ```

**Benefits:**
- ✅ Always online
- ✅ Free tier available
- ✅ Full persistence
- ✅ Ollama in cloud

### Option 3: Vercel with Cloud AI (Paid)

1. **Switch to cloud AI version:**
   ```bash
   node deploy-cloud.js
   ```

2. **Deploy to Vercel:**
   - Push to GitHub
   - Connect to Vercel
   - Add `OPENAI_API_KEY` environment variable
   - Deploy

**Benefits:**
- ✅ Always online
- ✅ Professional hosting
- ✅ Fast performance

**Cost:**
- OpenAI API: ~$0.01-0.05 per session

## 🎮 Game Features After Deployment

### For Players:
- ✅ **Create Characters**: Full character creation with stats
- ✅ **Save Progress**: Resume adventures anytime
- ✅ **Take Notes**: Organized note-taking system
- ✅ **Dice Rolling**: Integrated D20 system
- ✅ **Mobile Friendly**: Works on all devices
- ✅ **Session History**: Complete conversation history

### For Developers:
- ✅ **Database Persistence**: All data saved
- ✅ **API Routes**: Full CRUD operations
- ✅ **Session Management**: Multi-session support
- ✅ **Error Handling**: Robust error management
- ✅ **TypeScript**: Full type safety

## 🗂️ Database Schema

### Game Sessions
```typescript
{
  id: string;
  characterId: string;
  userId: string;
  currentLocation: string;
  questProgress: string;
  npcRelations: Record<string, number>;
  gameState: string; // JSON
  lastPlayed: Date;
  createdAt: Date;
}
```

### Game Notes
```typescript
{
  id: string;
  sessionId: string;
  content: string;
  category: 'general' | 'quest' | 'npc' | 'location' | 'loot';
  createdAt: Date;
}
```

### Game Turns
```typescript
{
  id: string;
  sessionId: string;
  turnNumber: number;
  playerInput: string;
  aiResponse: string;
  diceRolls: Array<{type: string, result: number, modifier?: number}>;
  timestamp: Date;
}
```

## 🔧 Environment Variables

### For Local Development:
```bash
# No environment variables needed
# Uses local Ollama and JSON database
```

### For Railway Deployment:
```bash
OLLAMA_URL=https://your-ollama-service.railway.app
```

### For Vercel with OpenAI:
```bash
OPENAI_API_KEY=your_openai_api_key_here
```

## 🎯 Next Steps

1. **Test Locally**: Make sure everything works
2. **Choose Deployment**: Pick your preferred option
3. **Deploy**: Follow the deployment steps
4. **Share**: Give players the URL
5. **Monitor**: Check logs and usage

## 🆘 Troubleshooting

### "Database not saving"
- Check file permissions in `/data` folder
- Ensure Next.js has write access

### "Session not loading"
- Check if session ID exists in database
- Verify API routes are working

### "Notes not appearing"
- Check if session ID is correct
- Verify notes API is responding

### "Ollama not responding"
- Ensure Ollama is running: `ollama list`
- Check if model is installed: `ollama pull llama3.2:1b`

## 🎉 Success!

Your enhanced D&D game is now ready for deployment with:
- ✅ Full database persistence
- ✅ Session management
- ✅ Note-taking system
- ✅ Enhanced dice mechanics
- ✅ Mobile-friendly interface
- ✅ Professional architecture

Players can now create characters, save progress, take notes, and resume adventures anytime! 🎲⚔️🧙‍♂️

