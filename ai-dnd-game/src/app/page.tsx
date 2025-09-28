export default function Home() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
      color: 'white',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>
          ⚔️ AI D&D Adventure
        </h1>
        <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>
          Your epic adventure awaits...
        </p>
        <div style={{ 
          padding: '2rem', 
          background: 'rgba(139, 92, 246, 0.1)', 
          borderRadius: '12px',
          border: '1px solid rgba(139, 92, 246, 0.3)'
        }}>
          <p>🚧 Application is being restored...</p>
          <p style={{ marginTop: '1rem', fontSize: '0.9rem', opacity: 0.7 }}>
            The game files are being rebuilt. Please wait a moment.
          </p>
        </div>
      </div>
    </div>
  )
}
