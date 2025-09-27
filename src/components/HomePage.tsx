'use client';

import React, { useState } from 'react';
import SupabaseAuthModal from './SupabaseAuthModal';

interface HomePageProps {
  onStartGame: () => void;
  onLogin: () => void;
}

export default function HomePage({ onStartGame, onLogin }: HomePageProps) {
  const [activeTab, setActiveTab] = useState<'updates' | 'blog'>('updates');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');

  const handleAuthSuccess = (user: any) => {
    console.log('Auth success:', user);
    setShowAuthModal(false);
    onLogin();
  };

  const handleAuthError = (error: any) => {
    console.error('Auth error:', error);
    // You could show an error message to the user here
  };

  const handleStartGame = () => {
    console.log('Start game button clicked!');
    setAuthMode('register');
    setShowAuthModal(true);
  };

  const handleLogin = () => {
    console.log('Login button clicked!');
    setAuthMode('login');
    setShowAuthModal(true);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
      color: '#e2e8f0',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        background: 'rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(139, 92, 246, 0.2)',
        padding: '1rem 0'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem'
            }}>
              ⚔️
            </div>
            <div>
              <h1 style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                margin: 0
              }}>
                AI D&D
              </h1>
              <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: 0 }}>
                Epic Adventures Powered by AI
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={handleLogin}
              style={{
                padding: '0.625rem 1.5rem',
                background: 'rgba(139, 92, 246, 0.1)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '8px',
                color: '#a78bfa',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)';
                e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.5)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)';
              }}
            >
              🔐 Login
            </button>
            <button
              onClick={handleStartGame}
              style={{
                padding: '0.625rem 1.5rem',
                background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #7c3aed, #db2777)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(139, 92, 246, 0.4)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #8b5cf6, #ec4899)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(139, 92, 246, 0.3)';
              }}
            >
              📝 Register
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{
        padding: '5rem 1rem',
        textAlign: 'center',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <h2 style={{
          fontSize: '4rem',
          fontWeight: 'bold',
          marginBottom: '2rem',
          lineHeight: '1.1'
        }}>
          <span style={{
            background: 'linear-gradient(135deg, #8b5cf6, #ec4899, #3b82f6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Epic Adventures
          </span>
          <br />
          <span style={{ color: 'white' }}>Await</span>
        </h2>
        <p style={{
          fontSize: '1.25rem',
          color: '#cbd5e1',
          marginBottom: '3rem',
          maxWidth: '600px',
          margin: '0 auto 3rem auto',
          lineHeight: '1.6'
        }}>
          Create your character, embark on quests, and let AI be your Dungeon Master. 
          Experience the most immersive D&D adventure ever created.
        </p>
        <div style={{
          display: 'flex',
          gap: '1.5rem',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={handleStartGame}
            style={{
              padding: '1rem 2.5rem',
              background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
              border: 'none',
              borderRadius: '12px',
              color: 'white',
              fontSize: '1.125rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 8px 25px rgba(139, 92, 246, 0.3)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #7c3aed, #db2777)';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 12px 30px rgba(139, 92, 246, 0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #8b5cf6, #ec4899)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(139, 92, 246, 0.3)';
            }}
          >
            📝 Create Account
          </button>
          <button
            onClick={handleLogin}
            style={{
              padding: '1rem 2.5rem',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              color: 'white',
              fontSize: '1.125rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            }}
          >
            🔐 Sign In
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section style={{
        padding: '5rem 1rem',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h3 style={{
            fontSize: '2.5rem',
            fontWeight: 'bold',
            color: 'white',
            marginBottom: '1rem'
          }}>
            Game Features
          </h3>
          <p style={{
            fontSize: '1.25rem',
            color: '#cbd5e1'
          }}>
            Everything you need for the ultimate D&D experience
          </p>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem'
        }}>
          {[
            { icon: '🎭', title: 'Character Creation', desc: 'Build unique heroes with custom stats, races, and classes' },
            { icon: '🧙‍♂️', title: 'AI Dungeon Master', desc: 'Experience dynamic storytelling and responsive NPCs' },
            { icon: '🎲', title: 'Advanced Dice Rolling', desc: 'Roll any combination of dice with critical hit detection' },
            { icon: '⚔️', title: 'Combat System', desc: 'Turn-based battles with strategic decision making' },
            { icon: '📈', title: 'Character Progression', desc: 'Level up, gain abilities, and unlock powerful spells' },
            { icon: '🗺️', title: 'Vast Worlds', desc: 'Explore rich lore, challenging quests, and endless possibilities' }
          ].map((feature, index) => (
            <div
              key={index}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                padding: '2rem',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(139, 92, 246, 0.1)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{feature.icon}</div>
              <h4 style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                color: 'white',
                marginBottom: '0.75rem'
              }}>
                {feature.title}
              </h4>
              <p style={{
                color: '#cbd5e1',
                lineHeight: '1.6'
              }}>
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>


      {/* Modal */}
      <SupabaseAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLogin={handleAuthSuccess}
        initialMode={authMode}
      />
    </div>
  );
}