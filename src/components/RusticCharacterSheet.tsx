'use client';

import React from 'react';

interface CharacterStats {
  name: string;
  race?: string;
  class?: string;
  level?: number;
  hp: number;
  maxHp?: number;
  attributes?: {
    str: number;
    dex: number;
    int: number;
    con: number;
    wis: number;
    cha: number;
  };
  inventory?: string;
  equippedItems?: string;
  spells?: string[];
  skills?: string[];
  backstory?: string;
}

interface RusticCharacterSheetProps {
  characterStats: CharacterStats;
  onEdit?: () => void;
}

export default function RusticCharacterSheet({ characterStats, onEdit }: RusticCharacterSheetProps) {
  const getAttributeModifier = (score: number) => Math.floor((score - 10) / 2);
  const formatModifier = (modifier: number) => (modifier >= 0 ? `+${modifier}` : `${modifier}`);

  return (
    <div className="space-y-4">
      {/* Character Header */}
      <div className="fantasy-card text-center">
        <h2 className="rustic-title text-xl mb-2">{characterStats.name || 'Unnamed Hero'}</h2>
        <div className="text-sm rustic-text">
          {characterStats.race && <span>{characterStats.race}</span>}
          {characterStats.class && <span> • {characterStats.class}</span>}
          {characterStats.level && <span> • Level {characterStats.level}</span>}
        </div>
        {onEdit && (
          <button 
            onClick={onEdit}
            className="rustic-button text-xs mt-2"
          >
            Edit Character
          </button>
        )}
      </div>

      {/* Hit Points */}
      <div className="fantasy-card">
        <h3 className="rustic-subtitle text-lg mb-3">⚔️ Hit Points</h3>
        <div className="character-stat">
          <span className="character-stat-label">Current HP</span>
          <span className="character-stat-value text-red-400">
            {characterStats.hp || 20}
          </span>
        </div>
        <div className="character-stat">
          <span className="character-stat-label">Max HP</span>
          <span className="character-stat-value">
            {characterStats.maxHp || characterStats.hp || 20}
          </span>
        </div>
        {/* HP Bar */}
        <div className="mt-3">
          <div className="w-full bg-gray-800 rounded-full h-3 border border-gray-600">
            <div 
              className="bg-gradient-to-r from-red-600 to-red-400 h-3 rounded-full transition-all duration-500"
              style={{ 
                width: `${((characterStats.hp || 20) / (characterStats.maxHp || characterStats.hp || 20)) * 100}%` 
              }}
            ></div>
          </div>
        </div>
      </div>

      {/* Ability Scores */}
      {characterStats.attributes && Object.keys(characterStats.attributes).length > 0 && (
        <div className="fantasy-card">
          <h3 className="rustic-subtitle text-lg mb-3">📊 Ability Scores</h3>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(characterStats.attributes).map(([attr, value]) => (
              <div key={attr} className="character-stat">
                <span className="character-stat-label">{attr.toUpperCase()}</span>
                <div className="text-right">
                  <div className="character-stat-value">{value}</div>
                  <div className="text-xs text-dnd-gold">
                    {formatModifier(getAttributeModifier(value))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      {characterStats.skills && characterStats.skills.length > 0 && (
        <div className="fantasy-card">
          <h3 className="rustic-subtitle text-lg mb-3">🎯 Skills</h3>
          <div className="space-y-1">
            {characterStats.skills.slice(0, 6).map((skill, index) => (
              <div key={index} className="text-sm rustic-text">
                • {skill}
              </div>
            ))}
            {characterStats.skills.length > 6 && (
              <div className="text-xs text-gray-400">
                +{characterStats.skills.length - 6} more...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Equipment */}
      <div className="fantasy-card">
        <h3 className="rustic-subtitle text-lg mb-3">⚔️ Equipment</h3>
        <div className="text-sm rustic-text">
          <div className="mb-2">
            <span className="text-dnd-gold font-bold">Equipped:</span>
            <div className="ml-2 text-xs">
              {characterStats.equippedItems || 'No items equipped'}
            </div>
          </div>
          <div>
            <span className="text-dnd-gold font-bold">Inventory:</span>
            <div className="ml-2 text-xs max-h-20 overflow-y-auto rustic-scrollbar">
              {characterStats.inventory || 'No items in inventory'}
            </div>
          </div>
        </div>
      </div>

      {/* Spells */}
      {characterStats.spells && characterStats.spells.length > 0 && (
        <div className="fantasy-card">
          <h3 className="rustic-subtitle text-lg mb-3">✨ Spells</h3>
          <div className="space-y-1">
            {characterStats.spells.slice(0, 4).map((spell, index) => (
              <div key={index} className="text-sm rustic-text">
                • {spell}
              </div>
            ))}
            {characterStats.spells.length > 4 && (
              <div className="text-xs text-gray-400">
                +{characterStats.spells.length - 4} more...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Backstory Preview */}
      {characterStats.backstory && (
        <div className="fantasy-card">
          <h3 className="rustic-subtitle text-lg mb-3">📖 Backstory</h3>
          <div className="text-sm rustic-text max-h-24 overflow-y-auto rustic-scrollbar">
            {characterStats.backstory.length > 150 
              ? `${characterStats.backstory.substring(0, 150)}...` 
              : characterStats.backstory
            }
          </div>
        </div>
      )}
    </div>
  );
}

