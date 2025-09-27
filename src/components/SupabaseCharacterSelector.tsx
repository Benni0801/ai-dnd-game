'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { characterService } from '../lib/supabase-auth';

interface Character {
  id: string;
  name: string;
  race: string;
  class: string;
  level: number;
  xp: number;
  max_xp: number;
  hp: number;
  max_hp: number;
  created_at: string;
}

interface SupabaseCharacterSelectorProps {
  userId: string;
  onCharacterSelect: (character: Character) => void;
  onNewCharacter: () => void;
  onLogout: () => void;
}

export default function SupabaseCharacterSelector({ 
  userId, 
  onCharacterSelect, 
  onNewCharacter, 
  onLogout 
}: SupabaseCharacterSelectorProps) {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadCharacters = useCallback(async () => {
    try {
      const data = await characterService.getCharacters(userId);
      setCharacters(data);
    } catch (error: any) {
      setError(error.message || 'Failed to load characters');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadCharacters();
  }, [loadCharacters]);

  const deleteCharacter = async (characterId: string) => {
    if (!confirm('Are you sure you want to delete this character? This action cannot be undone.')) {
      return;
    }

    try {
      await characterService.deleteCharacter(characterId);
      setCharacters(characters.filter(char => char.id !== characterId));
    } catch (error: any) {
      setError(error.message || 'Failed to delete character');
    }
  };

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
        color: '#e2e8f0',
        fontFamily: 'sans-serif',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          background: 'rgba(26, 26, 46, 0.8)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(139, 92, 246, 0.2)',
          borderRadius: '20px',
          padding: '3rem',
          textAlign: 'center'
        }}>
          <div style={{
            display: 'inline-block',
            width: '60px',
            height: '60px',
            border: '4px solid rgba(139, 92, 246, 0.3)',
            borderTop: '4px solid #8b5cf6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ color: '#94a3b8', marginTop: '1rem', fontSize: '1.125rem' }}>Loading your characters...</p>
        </div>
      </div>
    );
  }

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
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      <div style={{ position: 'relative', zIndex: 10, minHeight: '100vh', padding: '2rem' }}>
        {/* Header */}
        <header style={{
          background: 'rgba(15, 15, 35, 0.8)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(139, 92, 246, 0.2)',
          padding: '1rem 2rem',
          borderRadius: '16px',
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: '1.8rem', marginRight: '0.5rem' }}>⚔️</span>
            <h1 style={{
              fontSize: '1.8rem',
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: 0
            }}>
              Character Selection
            </h1>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={onNewCharacter}
              disabled={characters.length >= 4}
              style={{
                padding: '0.75rem 1.5rem',
                background: characters.length >= 4 ? 'rgba(55, 65, 81, 0.5)' : 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontWeight: '600',
                cursor: characters.length >= 4 ? 'not-allowed' : 'pointer',
                opacity: characters.length >= 4 ? 0.5 : 1,
                transition: 'all 0.3s ease'
              }}
            >
              {characters.length >= 4 ? '🎭 Max Characters (4)' : '🎭 New Character'}
            </button>
            <button
              onClick={onLogout}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                color: '#fca5a5',
                fontWeight: '600',
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
          </div>
        </header>

        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Title Section */}
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{
              fontSize: '3rem',
              fontWeight: 'bold',
              marginBottom: '1rem',
              background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Choose Your Hero
            </h2>
            <p style={{ fontSize: '1.25rem', color: '#cbd5e1', maxWidth: '600px', margin: '0 auto' }}>
              Select a character to continue your epic adventure or create a new hero to begin your journey
            </p>
          </div>

          {error ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '16px',
                padding: '2rem',
                maxWidth: '500px',
                margin: '0 auto'
              }}>
                <p style={{ color: '#fca5a5', marginBottom: '1rem' }}>{error}</p>
                <button
                  onClick={loadCharacters}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid rgba(239, 68, 68, 0.5)',
                    borderRadius: '8px',
                    color: '#fca5a5',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  🔄 Retry
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Characters Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                gap: '2rem',
                marginBottom: '3rem'
              }}>
                {characters.map((character) => (
                  <div
                    key={character.id}
                    style={{
                      background: 'rgba(26, 26, 46, 0.8)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(139, 92, 246, 0.2)',
                      borderRadius: '20px',
                      padding: '2rem',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                      position: 'relative'
                    }}
                    onClick={() => onCharacterSelect(character)}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-8px)';
                      e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.5)';
                      e.currentTarget.style.boxShadow = '0 16px 48px rgba(139, 92, 246, 0.2)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.2)';
                      e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)';
                    }}
                  >
                    {/* Delete Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteCharacter(character.id);
                      }}
                      style={{
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '50%',
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fca5a5',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        fontSize: '0.875rem'
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
                      ×
                    </button>

                    {/* Character Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                      <h3 style={{
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        color: '#e2e8f0',
                        margin: 0
                      }}>
                        {character.name}
                      </h3>
                      <div style={{
                        padding: '0.5rem 1rem',
                        background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                        borderRadius: '20px',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: 'white'
                      }}>
                        Level {character.level}
                      </div>
                    </div>
                    
                    {/* Character Details */}
                    <div style={{ marginBottom: '1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ color: '#94a3b8' }}>Race:</span>
                        <span style={{ color: '#e2e8f0', fontWeight: '500' }}>{character.race}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>Class:</span>
                        <span style={{ color: '#e2e8f0', fontWeight: '500' }}>{character.class}</span>
                      </div>
                    </div>

                    {/* XP Bar */}
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Experience</span>
                        <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>{character.xp} / {character.max_xp}</span>
                      </div>
                      <div style={{
                        width: '100%',
                        height: '8px',
                        background: 'rgba(55, 65, 81, 0.5)',
                        borderRadius: '4px',
                        overflow: 'hidden'
                      }}>
                        <div
                          style={{
                            height: '100%',
                            background: 'linear-gradient(90deg, #8b5cf6, #ec4899)',
                            borderRadius: '4px',
                            transition: 'width 0.3s ease',
                            width: `${(character.xp / character.max_xp) * 100}%`
                          }}
                        ></div>
                      </div>
                    </div>

                    {/* HP Bar */}
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Health</span>
                        <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>{character.hp} / {character.max_hp}</span>
                      </div>
                      <div style={{
                        width: '100%',
                        height: '8px',
                        background: 'rgba(55, 65, 81, 0.5)',
                        borderRadius: '4px',
                        overflow: 'hidden'
                      }}>
                        <div
                          style={{
                            height: '100%',
                            background: 'linear-gradient(90deg, #10b981, #34d399)',
                            borderRadius: '4px',
                            transition: 'width 0.3s ease',
                            width: `${(character.hp / character.max_hp) * 100}%`
                          }}
                        ></div>
                      </div>
                    </div>

                    <div style={{
                      fontSize: '0.75rem',
                      color: '#6b7280',
                      textAlign: 'center',
                      paddingTop: '1rem',
                      borderTop: '1px solid rgba(139, 92, 246, 0.1)'
                    }}>
                      Created {new Date(character.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>

              {/* Create New Character Button */}
              {characters.length < 4 && (
                <div style={{ textAlign: 'center' }}>
                  <button
                    onClick={onNewCharacter}
                    style={{
                      padding: '1.25rem 3rem',
                      background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                      border: 'none',
                      borderRadius: '16px',
                      color: 'white',
                      fontSize: '1.25rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 8px 25px rgba(139, 92, 246, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      margin: '0 auto'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 12px 30px rgba(139, 92, 246, 0.5)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 8px 25px rgba(139, 92, 246, 0.4)';
                    }}
                  >
                    <span style={{ fontSize: '1.5rem' }}>✨</span>
                    Create New Character
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}