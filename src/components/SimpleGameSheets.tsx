'use client';

import React from 'react';
import { CharacterStats } from '../types';

interface SimpleGameSheetsProps {
  characterStats: CharacterStats;
  onClose: () => void;
}

export default function SimpleGameSheets({ characterStats, onClose }: SimpleGameSheetsProps) {
  const getAttributeModifier = (value: number) => {
    return Math.floor((value - 10) / 2);
  };

  const formatModifier = (modifier: number) => {
    return modifier >= 0 ? `+${modifier}` : `${modifier}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-dnd-darker border border-dnd-gold rounded-lg w-full max-w-4xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-dnd-gold">
          <h2 className="text-xl font-bold text-dnd-gold">Character Sheet</h2>
          <button
            onClick={onClose}
            className="text-dnd-gold hover:text-yellow-400 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Character Information */}
          <div className="bg-dnd-dark border border-dnd-gold rounded p-4">
            <h3 className="text-lg font-bold text-dnd-gold mb-3">Character Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Name:</span>
                <span className="text-white ml-2">{characterStats.name || 'Unnamed'}</span>
              </div>
              <div>
                <span className="text-gray-400">Race:</span>
                <span className="text-white ml-2">{characterStats.race || 'Not Set'}</span>
              </div>
              <div>
                <span className="text-gray-400">Class:</span>
                <span className="text-white ml-2">{characterStats.class || 'Not Set'}</span>
              </div>
              <div>
                <span className="text-gray-400">Level:</span>
                <span className="text-white ml-2">{characterStats.level || 1}</span>
              </div>
              <div>
                <span className="text-gray-400">Hit Points:</span>
                <span className="text-white ml-2">{characterStats.hp || 20}</span>
              </div>
            </div>
          </div>

          {/* Ability Scores */}
          <div className="bg-dnd-dark border border-dnd-gold rounded p-4">
            <h3 className="text-lg font-bold text-dnd-gold mb-3">Ability Scores</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="text-gray-400 text-xs uppercase">STR</div>
                <div className="text-white text-lg font-bold">{characterStats.str || 10}</div>
                <div className="text-dnd-gold text-sm">{formatModifier(getAttributeModifier(characterStats.str || 10))}</div>
              </div>
              <div className="text-center">
                <div className="text-gray-400 text-xs uppercase">DEX</div>
                <div className="text-white text-lg font-bold">{characterStats.dex || 10}</div>
                <div className="text-dnd-gold text-sm">{formatModifier(getAttributeModifier(characterStats.dex || 10))}</div>
              </div>
              <div className="text-center">
                <div className="text-gray-400 text-xs uppercase">CON</div>
                <div className="text-white text-lg font-bold">{characterStats.con || 10}</div>
                <div className="text-dnd-gold text-sm">{formatModifier(getAttributeModifier(characterStats.con || 10))}</div>
              </div>
              <div className="text-center">
                <div className="text-gray-400 text-xs uppercase">INT</div>
                <div className="text-white text-lg font-bold">{characterStats.int || 10}</div>
                <div className="text-dnd-gold text-sm">{formatModifier(getAttributeModifier(characterStats.int || 10))}</div>
              </div>
              <div className="text-center">
                <div className="text-gray-400 text-xs uppercase">WIS</div>
                <div className="text-white text-lg font-bold">{characterStats.wis || 10}</div>
                <div className="text-dnd-gold text-sm">{formatModifier(getAttributeModifier(characterStats.wis || 10))}</div>
              </div>
              <div className="text-center">
                <div className="text-gray-400 text-xs uppercase">CHA</div>
                <div className="text-white text-lg font-bold">{characterStats.cha || 10}</div>
                <div className="text-dnd-gold text-sm">{formatModifier(getAttributeModifier(characterStats.cha || 10))}</div>
              </div>
            </div>
          </div>

          {/* Inventory */}
          <div className="bg-dnd-dark border border-dnd-gold rounded p-4">
            <h3 className="text-lg font-bold text-dnd-gold mb-3">Inventory</h3>
            <div className="text-white text-sm whitespace-pre-wrap">
              {characterStats.inventory || 'No items in inventory'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



