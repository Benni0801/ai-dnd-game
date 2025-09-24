# AI Dungeon Master - D&D Adventure Game

An AI-powered text-based Dungeons & Dragons game built with Next.js 14, featuring an intelligent Dungeon Master powered by local Ollama AI or cloud OpenAI API.

## Features

- 🤖 **AI Dungeon Master**: Intelligent, narrative-driven responses using local Ollama AI or cloud OpenAI API
- 🎲 **Dice Rolling System**: Built-in d20 dice rolling with results integrated into AI responses
- 📜 **Character Sheet**: Editable character stats (HP, STR, DEX, INT, inventory) with localStorage persistence
- 💬 **Chat Interface**: Real-time conversation with the AI Dungeon Master
- 📱 **Mobile Responsive**: Optimized for both desktop and mobile devices
- 🎨 **Dark Fantasy Theme**: Immersive UI with custom Tailwind styling
- 💾 **Game Persistence**: Chat history and character stats saved to localStorage
- 🔄 **Reset Functionality**: Start new adventures with a single click

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **AI**: Ollama (local) or OpenAI API (cloud)
- **Styling**: Custom Tailwind configuration with dark fantasy theme
- **Storage**: localStorage for persistence

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- OpenAI API key

### Installation

1. **Clone or download the project**
   ```bash
   cd ai-dnd-game
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Copy `env.example` to `.env.local`
   - Add your OpenAI API key:
     ```
     OPENAI_API_KEY=your_openai_api_key_here
     ```
   - Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## How to Play

1. **Create Your Character**: Edit the character sheet on the left with your stats
2. **Start Your Adventure**: Type a message describing what you want to do
3. **Roll Dice**: Click "Roll d20" when you need to make a skill check or attack
4. **Interact**: The AI Dungeon Master will respond with narrative descriptions and options
5. **Continue**: Keep the conversation going to build your epic adventure!

## Game Features

### Character Management
- **Name**: Your character's name
- **HP**: Hit Points (health)
- **STR**: Strength (physical power)
- **DEX**: Dexterity (agility and reflexes)
- **INT**: Intelligence (mental acuity)
- **Inventory**: Items and equipment

### Dice System
- Click "Roll d20" to roll a 20-sided die
- Results are automatically sent to the AI
- The AI interprets rolls based on your character's stats
- Higher rolls generally mean better outcomes

### AI Dungeon Master
- Responds dramatically and narratively
- Uses your character stats to influence outcomes
- Incorporates dice roll results into the story
- Always provides options for your next action
- Maintains conversation continuity

## File Structure

```
src/
├── app/
│   ├── api/ai-dnd/
│   │   └── route.ts          # OpenAI API integration
│   ├── globals.css           # Global styles and Tailwind
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Main page
├── components/
│   └── AIDnDGame.tsx         # Main game component
└── utils/
    └── dice.ts               # Dice rolling utilities
```

## Customization

### Styling
The game uses a custom Tailwind configuration with a dark fantasy theme. Key colors:
- `dnd-gold`: #D4AF37 (golden accents)
- `dnd-red`: #8B0000 (action buttons)
- `dnd-dark`: #1a1a1a (dark backgrounds)
- `dnd-darker`: #0d0d0d (darker backgrounds)

### AI Behavior
Modify the system prompt in `src/app/api/ai-dnd/route.ts` to change how the AI behaves as a Dungeon Master.

## Deployment

### Option 1: Deploy with Cloud AI (Recommended for Online Play)

**For Vercel (Recommended):**
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Replace `src/app/api/ai-dnd/route.ts` with `src/app/api/ai-dnd/route-cloud.ts`
4. Add your `OPENAI_API_KEY` environment variable in Vercel dashboard
5. Deploy!

**For other platforms:**
- Netlify, Railway, DigitalOcean App Platform, AWS Amplify
- Use the cloud version (`route-cloud.ts`) instead of the local version

### Option 2: Local Development with Ollama

For local development, use the original `route.ts` file and follow the Ollama setup guide in `OLLAMA_SETUP.md`.

### Environment Variables

**For Cloud Deployment:**
```
OPENAI_API_KEY=your_openai_api_key_here
```

**For Local Development:**
No API keys needed - uses local Ollama installation.

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is open source and available under the MIT License.



