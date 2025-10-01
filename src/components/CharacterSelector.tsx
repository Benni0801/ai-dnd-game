'use client';

import React, { useState, useEffect } from 'react';

interface Character {
  id: number;
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

interface CharacterSelectorProps {
  onCharacterSelect: (character: Character) => void;
  onNewCharacter: () => void;
  onLogout: () => void;
}

export default function CharacterSelector({ onCharacterSelect, onNewCharacter, onLogout }: CharacterSelectorProps) {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCharacters();
  }, []);

  const loadCharacters = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('No authentication token found');
        return;
      }

      const response = await fetch('/api/characters', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setCharacters(data.characters);
      } else {
        setError(data.error || 'Failed to load characters');
      }
    } catch (error) {
      setError('Network error loading characters');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCharacter = async (characterId: number) => {
    if (!confirm('Are you sure you want to delete this character? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/characters/${characterId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setCharacters(characters.filter(char => char.id !== characterId));
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete character');
      }
    } catch (error) {
      setError('Network error deleting character');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0f0f23 0%, #0a0a1a 100%)' }}>
        <div className="glass-card p-8 text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p style={{ color: 'var(--text-muted)' }}>Loading your characters...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0f0f23 0%, #0a0a1a 100%)' }}>
      <div className="relative z-10 min-h-screen p-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="glass-panel p-6 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold purple-gradient bg-clip-text text-transparent mb-2">
                  ⚔️ Character Selection
                </h1>
                <p style={{ color: 'var(--text-muted)' }}>
                  Choose a character to continue your adventure or create a new one
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onNewCharacter}
                  disabled={characters.length >= 4}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {characters.length >= 4 ? '🎭 Max Characters (4)' : '🎭 New Character'}
                </button>
                <button
                  onClick={onLogout}
                  className="btn-secondary"
                >
                  🚪 Logout
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="glass-panel p-4 mb-6 border border-red-500 bg-red-900 bg-opacity-20">
              <p className="text-red-200">{error}</p>
            </div>
          )}

          {/* Character Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {characters.map((character) => (
              <div key={character.id} className="glass-panel p-6 hover:scale-105 transition-transform">
                <div className="text-center mb-4">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center text-2xl font-bold glass-panel">
                    {character.name.charAt(0).toUpperCase()}
                  </div>
                  <h3 className="text-xl font-bold" style={{ color: 'var(--text-light)' }}>
                    {character.name}
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    {character.race} {character.class}
                  </p>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--text-muted)' }}>Level:</span>
                    <span style={{ color: 'var(--text-light)' }}>{character.level}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--text-muted)' }}>XP:</span>
                    <span style={{ color: 'var(--text-light)' }}>{character.xp}/{character.max_xp}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--text-muted)' }}>HP:</span>
                    <span style={{ color: 'var(--text-light)' }}>{character.hp}/{character.max_hp}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => onCharacterSelect(character)}
                    className="btn-primary w-full"
                  >
                    🎮 Play
                  </button>
                  <button
                    onClick={() => deleteCharacter(character.id)}
                    className="btn-secondary w-full text-red-400 hover:text-red-300"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}

            {/* Empty slots */}
            {Array.from({ length: 4 - characters.length }).map((_, index) => (
              <div key={`empty-${index}`} className="glass-panel p-6 border-2 border-dashed border-purple-500 border-opacity-30 flex items-center justify-center min-h-[300px]">
                <div className="text-center">
                  <div className="text-4xl mb-3 opacity-50">🎭</div>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    Empty Character Slot
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Character Limit Info */}
          <div className="glass-panel p-4 mt-6 text-center">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Character Limit: {characters.length}/4 | Story Limit: 0/2
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}




