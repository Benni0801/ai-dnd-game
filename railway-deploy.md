# 🚂 Deploy Ollama to Railway (Free)

Railway offers a free tier that can run Ollama in the cloud!

## Steps:

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Deploy Ollama Service**
   - Create new project
   - Add service from template
   - Search for "Ollama" template
   - Deploy

3. **Deploy Your Game**
   - Add another service
   - Connect your GitHub repo
   - Set environment variable: `OLLAMA_URL=https://your-ollama-service.railway.app`

4. **Install Model**
   - Go to your Ollama service logs
   - Run: `ollama pull llama3.2:1b`

## Cost: FREE! 🎉

Railway free tier includes:
- 500 hours/month compute
- 1GB RAM
- Perfect for Ollama + your game
