# 🏠 Share Your Local Game (Free!)

Since Ollama works perfectly on your machine, here are free ways to share it:

## Option 1: ngrok (Free Tunnel)
```bash
# Install ngrok
npm install -g ngrok

# Start your game
npm run dev

# In another terminal, create tunnel
ngrok http 3000
```

This gives you a public URL like `https://abc123.ngrok.io` that anyone can use!

## Option 2: Local Network Sharing
```bash
# Start your game on your network
npm run dev -- --host 0.0.0.0
```

Then share your local IP address with friends on the same network.

## Option 3: GitHub Codespaces (Free)
- Push your code to GitHub
- Create a Codespace
- Run Ollama in the Codespace
- Share the Codespace URL

## Benefits:
✅ Completely FREE  
✅ No API costs  
✅ Your Ollama setup works perfectly  
✅ Full control over the AI  

## Drawbacks:
❌ Your computer needs to be on  
❌ Limited to your internet connection  
❌ ngrok free tier has limitations  

