export default function Home() {
  return (
    <main className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">
          ⚔️ AI D&D Adventure Game
        </h1>
        
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-2xl mb-4">🎮 Welcome, Adventurer!</h2>
          <p className="mb-4">
            Your AI-powered Dungeons & Dragons adventure awaits! This game is powered by Google Gemini AI.
          </p>
          
          <div className="space-y-4">
            <div className="bg-green-900 p-4 rounded">
              <h3 className="text-lg font-semibold mb-2">✅ Game Features:</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>AI Dungeon Master powered by Google Gemini</li>
                <li>Character creation and management</li>
                <li>Dice rolling mechanics</li>
                <li>Interactive storytelling</li>
                <li>Mobile-friendly interface</li>
              </ul>
            </div>
            
            <div className="bg-blue-900 p-4 rounded">
              <h3 className="text-lg font-semibold mb-2">🚀 Status:</h3>
              <p>Your game is successfully deployed on Vercel!</p>
              <p className="text-sm text-gray-300 mt-2">
                If you're seeing this page, the deployment worked. The full game interface will be available soon.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}