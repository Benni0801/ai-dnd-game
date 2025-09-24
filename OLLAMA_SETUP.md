# Ollama Setup Guide for AI D&D Game

## What is Ollama?
Ollama is a free, open-source tool that runs large language models locally on your computer. No API keys, no external services, completely private and free!

## Setup Steps:

### 1. Install Ollama (if not already done)
- Download from: https://ollama.ai/
- Install and run Ollama

### 2. Install a Model
Open a terminal/command prompt and run one of these commands:

**Recommended for D&D (good balance of quality and speed):**
```bash
ollama pull llama3.2
```

**Alternative models:**
```bash
# Smaller, faster model
ollama pull llama3.2:1b

# Larger, more capable model (requires more RAM)
ollama pull llama3.2:70b

# Other good options
ollama pull mistral
ollama pull codellama
```

### 3. Start Ollama Service
Make sure Ollama is running in the background. It should start automatically after installation.

### 4. Test the Setup
Run this command to test if Ollama is working:
```bash
ollama run llama3.2
```

### 5. Start Your D&D Game
```bash
npm run dev
```

## How It Works:
- Your D&D game calls Ollama locally at `http://localhost:11434`
- Ollama runs the AI model on your computer
- No internet required after setup
- Completely private - your conversations stay on your machine
- Free forever!

## Troubleshooting:

**"Ollama API error" message:**
- Make sure Ollama is running
- Check if you have a model installed: `ollama list`
- Try installing llama3.2: `ollama pull llama3.2`

**Game not responding:**
- Check if Ollama is running: `ollama list`
- Restart Ollama service
- Make sure the model is downloaded

**Want to change models?**
- Edit `src/app/api/ai-dnd/route.ts`
- Change `model: 'llama3.2'` to your preferred model
- Available models: `ollama list`

## Model Recommendations:

- **llama3.2** - Best overall for D&D (recommended)
- **llama3.2:1b** - Fastest, good for older computers
- **mistral** - Alternative, very good quality
- **codellama** - Good for technical/logical responses

Enjoy your free, private AI D&D experience! 🎲⚔️🧙‍♂️


