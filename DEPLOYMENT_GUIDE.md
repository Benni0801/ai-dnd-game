# 🚀 Deployment Guide - AI D&D Game

This guide will help you deploy your AI D&D game online so others can play it!

## 🎯 Quick Start (Recommended)

### Step 1: Prepare for Cloud Deployment
```bash
node deploy-cloud.js
```

### Step 2: Get an OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create an account or sign in
3. Click "Create new secret key"
4. Copy the key (starts with `sk-`)

### Step 3: Deploy to Vercel (Free & Easy)

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/ai-dnd-game.git
   git push -u origin main
   ```

2. **Deploy to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub
   - Click "New Project"
   - Import your repository
   - Add environment variable: `OPENAI_API_KEY` = your API key
   - Click "Deploy"

3. **Your game is live!** 🎉

## 🌐 Alternative Hosting Platforms

### Netlify
1. Push to GitHub
2. Go to [netlify.com](https://netlify.com)
3. Connect GitHub repository
4. Add environment variable: `OPENAI_API_KEY`
5. Deploy

### Railway
1. Push to GitHub
2. Go to [railway.app](https://railway.app)
3. Connect GitHub repository
4. Add environment variable: `OPENAI_API_KEY`
5. Deploy

## 💰 Cost Considerations

### OpenAI API Costs
- **GPT-3.5-turbo**: ~$0.002 per 1K tokens (very cheap)
- **Typical game session**: $0.01-0.05
- **Free tier**: $5 credit for new accounts

### Hosting Costs
- **Vercel**: Free tier (100GB bandwidth/month)
- **Netlify**: Free tier (100GB bandwidth/month)
- **Railway**: $5/month after free tier

## 🔧 Local Development

To switch back to local development with Ollama:
```bash
node deploy-local.js
```

## 🎮 Game Features After Deployment

✅ **Works online** - Anyone can play from anywhere  
✅ **No setup required** - Players just visit your URL  
✅ **Mobile friendly** - Works on phones and tablets  
✅ **Persistent** - Game state saves in browser  
✅ **Free to play** - No cost for players  

## 🛠️ Troubleshooting

### "OpenAI API key not configured"
- Make sure you added `OPENAI_API_KEY` in your hosting platform's environment variables
- Check that the key starts with `sk-`

### "AI service error"
- Check your OpenAI account has credits
- Verify the API key is correct
- Check the deployment logs for more details

### Game not loading
- Check that the build completed successfully
- Verify all files were pushed to GitHub
- Check the hosting platform's deployment logs

## 🎉 Success!

Once deployed, your AI D&D game will be accessible to anyone with the URL. Players can:
- Create characters
- Start adventures
- Roll dice
- Chat with the AI Dungeon Master
- Save their progress

Share your game URL with friends and start epic adventures together! 🎲⚔️🧙‍♂️

