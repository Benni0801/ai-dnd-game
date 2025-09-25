'use client';

import React, { useState } from 'react';
import { CharacterStats } from '../types';

interface PartyMember {
  name: string;
  gender: string;
  race: string;
  class: string;
  level: number;
  experience: { current: number; needed: number };
}

interface Quest {
  title: string;
  description: string;
  status: 'active' | 'completed' | 'failed';
  type: 'main' | 'side' | 'personal';
}

interface LoreEntry {
  name: string;
  type: 'npc' | 'location' | 'race';
  description: string;
  details?: string;
}

interface GameSheetsProps {
  characterStats: CharacterStats;
  partyMembers?: PartyMember[];
  quests?: Quest[];
  lore?: LoreEntry[];
  currentLocation?: string;
  onClose: () => void;
}

export default function GameSheets({ 
  characterStats, 
  partyMembers = [], 
  quests = [], 
  lore = [], 
  currentLocation = "Unknown",
  onClose 
}: GameSheetsProps) {
  const [activeSheet, setActiveSheet] = useState<'character' | 'party' | 'inventory' | 'spells' | 'skills' | 'quests' | 'lore'>('character');

  const getAttributeModifier = (value: number) => {
    return Math.floor((value - 10) / 2);
  };

  const formatModifier = (modifier: number) => {
    return modifier >= 0 ? `+${modifier}` : `${modifier}`;
  };

  const renderCharacterSheet = () => (
    <div className="space-y-4">
      <div className="bg-dnd-darker border border-dnd-gold rounded p-4">
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
            <span className="text-gray-400">Experience:</span>
            <span className="text-white ml-2">
              {characterStats.experience ? 
                `${characterStats.experience.current}/${characterStats.experience.needed}` : 
                '0/100'
              }
            </span>
          </div>
          <div>
            <span className="text-gray-400">Hit Points:</span>
            <span className="text-white ml-2">{characterStats.hp || 20}/{characterStats.maxHp || characterStats.hp || 20}</span>
          </div>
        </div>
      </div>

      <div className="bg-dnd-darker border border-dnd-gold rounded p-4">
        <h3 className="text-lg font-bold text-dnd-gold mb-3">Ability Scores</h3>
        {characterStats.attributes && Object.keys(characterStats.attributes).length > 0 ? (
          <div className="grid grid-cols-3 gap-4 text-sm">
            {Object.entries(characterStats.attributes).map(([attr, value]) => (
              <div key={attr} className="text-center">
                <div className="text-gray-400 text-xs uppercase">{attr}</div>
                <div className="text-white text-lg font-bold">{value}</div>
                <div className="text-dnd-gold text-sm">{formatModifier(getAttributeModifier(value))}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm">No ability scores set yet.</p>
        )}
      </div>

      {characterStats.backstory && (
        <div className="bg-dnd-darker border border-dnd-gold rounded p-4">
          <h3 className="text-lg font-bold text-dnd-gold mb-3">Backstory</h3>
          <p className="text-white text-sm">{characterStats.backstory}</p>
        </div>
      )}
    </div>
  );

  const renderPartySheet = () => (
    <div className="space-y-4">
      <div className="bg-dnd-darker border border-dnd-gold rounded p-4">
        <h3 className="text-lg font-bold text-dnd-gold mb-3">Party Members</h3>
        {partyMembers.length > 0 ? (
          <div className="space-y-3">
            {partyMembers.map((member, index) => (
              <div key={index} className="bg-dnd-dark border border-dnd-gold rounded p-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Name:</span>
                    <span className="text-white ml-2">{member.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Gender:</span>
                    <span className="text-white ml-2">{member.gender}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Race:</span>
                    <span className="text-white ml-2">{member.race}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Class:</span>
                    <span className="text-white ml-2">{member.class}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Level:</span>
                    <span className="text-white ml-2">{member.level}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Experience:</span>
                    <span className="text-white ml-2">{member.experience.current}/{member.experience.needed}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm">No party members yet.</p>
        )}
      </div>
    </div>
  );

  const renderInventorySheet = () => (
    <div className="space-y-4">
      <div className="bg-dnd-darker border border-dnd-gold rounded p-4">
        <h3 className="text-lg font-bold text-dnd-gold mb-3">Currently Equipped</h3>
        <div className="text-white text-sm">
          {characterStats.equippedItems || 'No items equipped'}
        </div>
      </div>
      
      <div className="bg-dnd-darker border border-dnd-gold rounded p-4">
        <h3 className="text-lg font-bold text-dnd-gold mb-3">Inventory</h3>
        <div className="text-white text-sm whitespace-pre-wrap">
          {characterStats.inventory || 'No items in inventory'}
        </div>
      </div>
    </div>
  );

  const renderSpellSheet = () => (
    <div className="space-y-4">
      <div className="bg-dnd-darker border border-dnd-gold rounded p-4">
        <h3 className="text-lg font-bold text-dnd-gold mb-3">Spell Slots</h3>
        {characterStats.spells && characterStats.spells.length > 0 ? (
          <div className="space-y-2">
            {characterStats.spells.map((spell, index) => (
              <div key={index} className="text-white text-sm">
                {typeof spell === 'string' ? (
                  spell
                ) : (
                  `Level ${spell.level}: ${spell.slots} slots - ${spell.name}`
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm">No spells known.</p>
        )}
      </div>
    </div>
  );

  const renderSkillSheet = () => (
    <div className="space-y-4">
      <div className="bg-dnd-darker border border-dnd-gold rounded p-4">
        <h3 className="text-lg font-bold text-dnd-gold mb-3">Skills & Abilities</h3>
        {characterStats.skills && characterStats.skills.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {characterStats.skills.map((skill, index) => (
              <div key={index} className="text-white text-sm bg-dnd-dark rounded px-2 py-1">
                {skill}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm">No special skills or abilities.</p>
        )}
      </div>
    </div>
  );

  const renderQuestSheet = () => (
    <div className="space-y-4">
      <div className="bg-dnd-darker border border-dnd-gold rounded p-4">
        <h3 className="text-lg font-bold text-dnd-gold mb-3">Current Location</h3>
        <p className="text-white text-sm">{currentLocation}</p>
      </div>
      
      <div className="bg-dnd-darker border border-dnd-gold rounded p-4">
        <h3 className="text-lg font-bold text-dnd-gold mb-3">Active Quests</h3>
        {quests.length > 0 ? (
          <div className="space-y-3">
            {quests.map((quest, index) => (
              <div key={index} className="bg-dnd-dark border border-dnd-gold rounded p-3">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-white font-medium">{quest.title}</h4>
                  <span className={`text-xs px-2 py-1 rounded ${
                    quest.status === 'active' ? 'bg-green-600' :
                    quest.status === 'completed' ? 'bg-blue-600' : 'bg-red-600'
                  }`}>
                    {quest.status}
                  </span>
                </div>
                <p className="text-gray-300 text-sm">{quest.description}</p>
                <div className="text-xs text-dnd-gold mt-1">Type: {quest.type}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm">No active quests.</p>
        )}
      </div>
    </div>
  );

  const renderLoreSheet = () => (
    <div className="space-y-4">
      <div className="bg-dnd-darker border border-dnd-gold rounded p-4">
        <h3 className="text-lg font-bold text-dnd-gold mb-3">World Lore</h3>
        {lore.length > 0 ? (
          <div className="space-y-3">
            {lore.map((entry, index) => (
              <div key={index} className="bg-dnd-dark border border-dnd-gold rounded p-3">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-white font-medium">{entry.name}</h4>
                  <span className="text-xs text-dnd-gold bg-dnd-darker px-2 py-1 rounded">
                    {entry.type.toUpperCase()}
                  </span>
                </div>
                <p className="text-gray-300 text-sm">{entry.description}</p>
                {entry.details && (
                  <p className="text-gray-400 text-xs mt-2">{entry.details}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm">No lore entries yet.</p>
        )}
      </div>
    </div>
  );

  const sheetTabs = [
    { id: 'character', label: 'Character', icon: '👤' },
    { id: 'party', label: 'Party', icon: '👥' },
    { id: 'inventory', label: 'Inventory', icon: '🎒' },
    { id: 'spells', label: 'Spells', icon: '✨' },
    { id: 'skills', label: 'Skills', icon: '⚔️' },
    { id: 'quests', label: 'Quests', icon: '📜' },
    { id: 'lore', label: 'Lore', icon: '📚' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-dnd-darker border border-dnd-gold rounded-lg w-full max-w-4xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-dnd-gold">
          <h2 className="text-xl font-bold text-dnd-gold">Game Sheets</h2>
          <button
            onClick={onClose}
            className="text-dnd-gold hover:text-yellow-400 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-dnd-gold overflow-x-auto">
          {sheetTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSheet(tab.id as any)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${
                activeSheet === tab.id
                  ? 'bg-dnd-gold text-dnd-darker'
                  : 'text-dnd-gold hover:bg-dnd-dark'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeSheet === 'character' && renderCharacterSheet()}
          {activeSheet === 'party' && renderPartySheet()}
          {activeSheet === 'inventory' && renderInventorySheet()}
          {activeSheet === 'spells' && renderSpellSheet()}
          {activeSheet === 'skills' && renderSkillSheet()}
          {activeSheet === 'quests' && renderQuestSheet()}
          {activeSheet === 'lore' && renderLoreSheet()}
        </div>
      </div>
    </div>
  );
}
