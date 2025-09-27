'use client';

import React from 'react';

interface GameModeSelectorProps {
  onSinglePlayer: () => void;
  onMultiplayer: () => void;
  onBack: () => void;
  username?: string;
}

const GameModeSelector: React.FC<GameModeSelectorProps> = ({
  onSinglePlayer,
  onMultiplayer,
  onBack,
  username
}) => {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
      color: '#e2e8f0',
      fontFamily: 'sans-serif',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Effects */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <div style={{
          position: 'absolute',
          top: '-20%',
          right: '-20%',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%)',
          animation: 'float1 15s infinite ease-in-out'
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: '-20%',
          left: '-20%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(236, 72, 153, 0.2) 0%, transparent 70%)',
          animation: 'float2 20s infinite ease-in-out'
        }}></div>
      </div>

      <style jsx global>{`
        @keyframes float1 {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-20px, 30px) scale(1.05); }
          100% { transform: translate(0, 0) scale(1); }
        }
        @keyframes float2 {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, -20px) scale(1.1); }
          100% { transform: translate(0, 0) scale(1); }
        }
      `}</style>

      <div style={{ position: 'relative', zIndex: 10, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{
          background: 'rgba(26, 26, 46, 0.8)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          borderRadius: '24px',
          maxWidth: '800px',
          width: '100%',
          padding: '3rem',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)'
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h1 style={{
              fontSize: '2.5rem',
              fontWeight: 'bold',
              marginBottom: '1rem',
              background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Choose Your Adventure
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '1.125rem' }}>
              Welcome back, {username}! How would you like to play today?
            </p>
          </div>

          {/* Game Mode Options */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
            {/* Single Player Option */}
            <div
              style={{
                background: 'rgba(15, 15, 35, 0.6)',
                border: '1px solid rgba(139, 92, 246, 0.2)',
                borderRadius: '20px',
                padding: '2rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                textAlign: 'center'
              }}
              onClick={onSinglePlayer}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.5)';
                e.currentTarget.style.background = 'rgba(15, 15, 35, 0.8)';
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 16px 48px rgba(139, 92, 246, 0.2)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.2)';
                e.currentTarget.style.background = 'rgba(15, 15, 35, 0.6)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🧙‍♂️</div>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#e2e8f0',
                marginBottom: '1rem'
              }}>
                Single Player
              </h3>
              <p style={{ color: '#94a3b8', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                Embark on a solo adventure with an AI Dungeon Master. Perfect for exploring at your own pace and experiencing personalized storytelling.
              </p>
              <div style={{
                padding: '1rem 2rem',
                background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                borderRadius: '12px',
                color: 'white',
                fontSize: '1rem',
                fontWeight: '600',
                display: 'inline-block'
              }}>
                Start Solo Adventure
              </div>
            </div>

            {/* Multiplayer Option */}
            <div
              style={{
                background: 'rgba(15, 15, 35, 0.6)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: '20px',
                padding: '2rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                textAlign: 'center'
              }}
              onClick={onMultiplayer}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.5)';
                e.currentTarget.style.background = 'rgba(15, 15, 35, 0.8)';
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 16px 48px rgba(16, 185, 129, 0.2)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.2)';
                e.currentTarget.style.background = 'rgba(15, 15, 35, 0.6)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎮</div>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#e2e8f0',
                marginBottom: '1rem'
              }}>
                Multiplayer
              </h3>
              <p style={{ color: '#94a3b8', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                Join friends in epic multiplayer campaigns. Create or join rooms, share adventures, and experience collaborative storytelling with other players.
              </p>
              <div style={{
                padding: '1rem 2rem',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                borderRadius: '12px',
                color: 'white',
                fontSize: '1rem',
                fontWeight: '600',
                display: 'inline-block'
              }}>
                Join Multiplayer
              </div>
            </div>
          </div>

          {/* Back Button */}
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={onBack}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'rgba(55, 65, 81, 0.5)',
                border: '1px solid rgba(55, 65, 81, 0.3)',
                borderRadius: '8px',
                color: '#9ca3af',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(55, 65, 81, 0.7)';
                e.currentTarget.style.borderColor = 'rgba(55, 65, 81, 0.5)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(55, 65, 81, 0.5)';
                e.currentTarget.style.borderColor = 'rgba(55, 65, 81, 0.3)';
              }}
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameModeSelector;
