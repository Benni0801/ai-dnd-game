export default function Home() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#1a1a1a', 
      color: 'white', 
      padding: '2rem',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '2rem' }}>
          ⚔️ AI D&D Game
        </h1>
        
        <div style={{ 
          backgroundColor: '#2a2a2a', 
          padding: '2rem', 
          borderRadius: '8px',
          marginBottom: '2rem'
        }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
            🎮 Successfully Deployed!
          </h2>
          <p style={{ marginBottom: '1rem', lineHeight: '1.6' }}>
            Your AI-powered Dungeons & Dragons game is now live on Vercel!
          </p>
          
          <div style={{ 
            backgroundColor: '#0f5132', 
            padding: '1rem', 
            borderRadius: '4px',
            marginBottom: '1rem'
          }}>
            <h3 style={{ marginBottom: '0.5rem' }}>✅ Deployment Status:</h3>
            <p>✅ Build successful</p>
            <p>✅ No errors</p>
            <p>✅ Ready for features</p>
          </div>
          
          <div style={{ 
            backgroundColor: '#084298', 
            padding: '1rem', 
            borderRadius: '4px'
          }}>
            <h3 style={{ marginBottom: '0.5rem' }}>🚀 Next Steps:</h3>
            <p>Now we can add the full game features one by one!</p>
          </div>
        </div>
        
        <div style={{ 
          backgroundColor: '#2a2a2a', 
          padding: '2rem', 
          borderRadius: '8px'
        }}>
          <h3 style={{ marginBottom: '1rem' }}>🎲 Game Features Coming Soon:</h3>
          <ul style={{ textAlign: 'left', maxWidth: '400px', margin: '0 auto' }}>
            <li>AI Dungeon Master (Google Gemini)</li>
            <li>Character Creation</li>
            <li>Dice Rolling</li>
            <li>Interactive Storytelling</li>
            <li>Mobile-friendly interface</li>
          </ul>
        </div>
      </div>
    </div>
  );
}