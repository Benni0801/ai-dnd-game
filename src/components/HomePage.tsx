'use client';

import React, { useState, useEffect } from 'react';
import SupabaseAuthModal from './SupabaseAuthModal';
import FriendManager from './FriendManager';
import { authService } from '../lib/supabase-auth';
import { multiplayerService } from '../lib/multiplayer-service';

interface HomePageProps {
  onStartGame: () => void;
  onLogin: () => void;
}

export default function HomePage({ onStartGame, onLogin }: HomePageProps) {
  const [activeTab, setActiveTab] = useState<'updates' | 'blog'>('updates');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
  const [user, setUser] = useState<any>(null);
  const [showFriendManager, setShowFriendManager] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        // Load friend requests for notifications
        loadFriendRequests(currentUser.id);
        // Don't automatically redirect - let user stay where they are
      }
    } catch (error) {
      console.log('No authenticated user found');
    } finally {
      setLoading(false);
    }
  };

  const loadFriendRequests = async (userId: string) => {
    try {
      const requests = await multiplayerService.getPendingFriendRequests(userId);
      setPendingRequests(requests);
    } catch (error) {
      console.error('Failed to load friend requests:', error);
    }
  };

  const handleAuthSuccess = (userData: any) => {
    console.log('Auth success:', userData);
    setUser(userData);
    setShowAuthModal(false);
    onLogin();
    // Load friend requests for the newly logged in user
    loadFriendRequests(userData.id);
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

  const handleLogout = async () => {
    try {
      await authService.signOut();
      setUser(null);
      // Optionally redirect or refresh the page
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
        color: '#e2e8f0',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          background: 'rgba(26, 26, 46, 0.8)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          borderRadius: '24px',
          padding: '3rem',
          textAlign: 'center'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid rgba(139, 92, 246, 0.3)',
            borderTop: '4px solid #8b5cf6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1.5rem auto'
          }}></div>
          <p style={{ color: '#94a3b8', fontSize: '1.125rem' }}>Loading...</p>
        </div>
        <style jsx global>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

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
            {user ? (
              // User is logged in
              <>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  background: 'rgba(139, 92, 246, 0.1)',
                  border: '1px solid rgba(139, 92, 246, 0.2)',
                  borderRadius: '12px',
                  marginRight: '0.5rem'
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1rem'
                  }}>
                    👤
                  </div>
                  <span style={{
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    color: '#e2e8f0'
                  }}>
                    {user.username || user.email?.split('@')[0] || 'Player'}
                  </span>
                </div>
                
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setShowFriendManager(true)}
                    style={{
                      padding: '0.625rem 1.5rem',
                      background: 'rgba(34, 197, 94, 0.1)',
                      border: '1px solid rgba(34, 197, 94, 0.3)',
                      borderRadius: '8px',
                      color: '#86efac',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = 'rgba(34, 197, 94, 0.2)';
                      e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.5)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = 'rgba(34, 197, 94, 0.1)';
                      e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.3)';
                    }}
                  >
                    👥 Friends
                  </button>
                  
                  {/* Notification Badge */}
                  {pendingRequests.length > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '-8px',
                      background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                      color: 'white',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)',
                      animation: 'pulse 2s infinite'
                    }}>
                      {pendingRequests.length > 9 ? '9+' : pendingRequests.length}
                    </div>
                  )}
                </div>
                
                <button
                  onClick={handleLogout}
                  style={{
                    padding: '0.625rem 1.5rem',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '8px',
                    color: '#fca5a5',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                    e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                  }}
                >
                  🚪 Logout
                </button>
              </>
            ) : (
              // User is not logged in
              <>
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
              </>
            )}
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


      {/* Auth Modal */}
      <SupabaseAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLogin={handleAuthSuccess}
        initialMode={authMode}
      />

      {/* Friend Manager Modal */}
      {showFriendManager && user && (
        <FriendManager
          userId={user.id}
          onClose={() => setShowFriendManager(false)}
          onRequestsChange={setPendingRequests}
        />
      )}

      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  );
}