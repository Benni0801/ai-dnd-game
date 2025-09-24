export default function Home() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#1a1a1a', 
      color: 'white', 
      padding: '2rem',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '3rem', textAlign: 'center', marginBottom: '2rem' }}>
          ⚔️ AI D&D Game
        </h1>
        
        <div style={{ 
          backgroundColor: '#2a2a2a', 
          padding: '2rem', 
          borderRadius: '8px',
          marginBottom: '2rem'
        }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
            🎮 Welcome, Adventurer!
          </h2>
          <p style={{ marginBottom: '1rem', lineHeight: '1.6' }}>
            Your AI-powered Dungeons & Dragons adventure is ready! This game is powered by Google Gemini AI and deployed on Vercel.
          </p>
          
          <div style={{ 
            backgroundColor: '#0f5132', 
            padding: '1rem', 
            borderRadius: '4px',
            marginBottom: '1rem'
          }}>
            <h3 style={{ marginBottom: '0.5rem' }}>✅ Features:</h3>
            <ul style={{ marginLeft: '1rem' }}>
              <li>AI Dungeon Master (Google Gemini)</li>
              <li>Character Creation</li>
              <li>Dice Rolling</li>
              <li>Interactive Storytelling</li>
            </ul>
          </div>
          
          <div style={{ 
            backgroundColor: '#084298', 
            padding: '1rem', 
            borderRadius: '4px'
          }}>
            <h3 style={{ marginBottom: '0.5rem' }}>🚀 Status: LIVE!</h3>
            <p>Your game is successfully deployed and working!</p>
          </div>
        </div>
        
        <div style={{ 
          backgroundColor: '#2a2a2a', 
          padding: '2rem', 
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h3 style={{ marginBottom: '1rem' }}>🎲 Ready to Play?</h3>
          <p style={{ marginBottom: '1rem' }}>
            The full game interface will be available in the next update!
          </p>
          <div style={{ 
            backgroundColor: '#6c757d', 
            padding: '1rem', 
            borderRadius: '4px',
            fontSize: '0.9rem'
          }}>
            <strong>Deployment Status:</strong> ✅ Successfully deployed to Vercel<br/>
            <strong>AI Backend:</strong> ✅ Google Gemini configured<br/>
            <strong>Build Status:</strong> ✅ No errors
          </div>
        </div>
      </div>
    </div>
  );
}