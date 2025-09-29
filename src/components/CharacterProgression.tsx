'use client';

import React, { useState, useCallback } from 'react';

interface CharacterStats {
  name: string;
  race?: string;
  class?: string;
  level?: number;
  xp?: number;
  hp: number;
  maxHp?: number;
  str: number;
  dex: number;
  int: number;
  con: number;
  wis: number;
  cha: number;
  gold?: number;
  proficiencyBonus?: number;
  skills?: string[];
  abilities?: string[];
  spells?: string[] | Array<{ name: string; level: number; slots: number }>;
}

interface CharacterProgressionProps {
  characterStats: CharacterStats;
  onStatsUpdate: (stats: CharacterStats) => void;
}

const XP_THRESHOLDS = [
  { level: 1, xp: 0 },
  { level: 2, xp: 300 },
  { level: 3, xp: 900 },
  { level: 4, xp: 2700 },
  { level: 5, xp: 6500 },
  { level: 6, xp: 14000 },
  { level: 7, xp: 23000 },
  { level: 8, xp: 34000 },
  { level: 9, xp: 48000 },
  { level: 10, xp: 64000 }
];

const CLASS_FEATURES = {
  Fighter: {
    abilities: ['Second Wind', 'Action Surge', 'Extra Attack'],
    spells: []
  },
  Wizard: {
    abilities: ['Spellcasting', 'Arcane Recovery', 'Ritual Casting'],
    spells: ['Magic Missile', 'Fireball', 'Lightning Bolt', 'Teleport']
  },
  Rogue: {
    abilities: ['Sneak Attack', 'Thieves\' Cant', 'Cunning Action'],
    spells: []
  },
  Cleric: {
    abilities: ['Spellcasting', 'Divine Domain', 'Channel Divinity'],
    spells: ['Heal', 'Cure Wounds', 'Bless', 'Spiritual Weapon']
  },
  Ranger: {
    abilities: ['Favored Enemy', 'Natural Explorer', 'Spellcasting'],
    spells: ['Hunter\'s Mark', 'Cure Wounds', 'Spike Growth']
  },
  Paladin: {
    abilities: ['Divine Sense', 'Lay on Hands', 'Spellcasting'],
    spells: ['Cure Wounds', 'Bless', 'Divine Smite']
  },
  Barbarian: {
    abilities: ['Rage', 'Unarmored Defense', 'Reckless Attack'],
    spells: []
  },
  Bard: {
    abilities: ['Spellcasting', 'Bardic Inspiration', 'Jack of All Trades'],
    spells: ['Vicious Mockery', 'Healing Word', 'Charm Person', 'Suggestion']
  }
};

export default function CharacterProgression({ characterStats, onStatsUpdate }: CharacterProgressionProps) {
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [availableAbilities, setAvailableAbilities] = useState<string[]>([]);

  const getProficiencyBonus = (level: number) => {
    return Math.ceil(level / 4) + 1;
  };

  const getXpToNextLevel = (currentXp: number) => {
    const currentLevel = getLevelFromXp(currentXp);
    const nextLevel = currentLevel + 1;
    const nextThreshold = XP_THRESHOLDS.find(t => t.level === nextLevel);
    return nextThreshold ? nextThreshold.xp - currentXp : 0;
  };

  const getLevelFromXp = (xp: number) => {
    for (let i = XP_THRESHOLDS.length - 1; i >= 0; i--) {
      if (xp >= XP_THRESHOLDS[i].xp) {
        return XP_THRESHOLDS[i].level;
      }
    }
    return 1;
  };

  const addXp = useCallback((amount: number) => {
    const newXp = (characterStats.xp || 0) + amount;
    const newLevel = getLevelFromXp(newXp);
    const oldLevel = characterStats.level || 1;
    
    const updatedStats = {
      ...characterStats,
      xp: newXp,
      level: newLevel,
      proficiencyBonus: getProficiencyBonus(newLevel)
    };

    // Level up bonuses
    if (newLevel > oldLevel) {
      const levelDiff = newLevel - oldLevel;
      
      // Increase HP
      const hpIncrease = levelDiff * (characterStats.con > 0 ? Math.floor((characterStats.con - 10) / 2) + 5 : 5);
      updatedStats.maxHp = (updatedStats.maxHp || characterStats.hp) + hpIncrease;
      updatedStats.hp += hpIncrease;
      
      // Add new abilities based on class
      const classFeatures = CLASS_FEATURES[characterStats.class as keyof typeof CLASS_FEATURES];
      if (classFeatures) {
        const newAbilities = classFeatures.abilities.slice(0, newLevel);
        const newSpells = classFeatures.spells.slice(0, Math.floor(newLevel / 2));
        
        updatedStats.abilities = Array.from(new Set([...(updatedStats.abilities || []), ...newAbilities]));
        // Convert existing spells to strings if they're objects
        const existingSpells = (updatedStats.spells || []).map(spell => 
          typeof spell === 'string' ? spell : spell.name
        );
        updatedStats.spells = Array.from(new Set([...existingSpells, ...newSpells]));
      }
      
      setShowLevelUp(true);
    }

    onStatsUpdate(updatedStats);
  }, [characterStats, onStatsUpdate]);

  const getAbilityModifier = (score: number) => {
    return Math.floor((score - 10) / 2);
  };

  const getSkillBonus = (abilityScore: number, isProficient: boolean = false) => {
    const abilityModifier = getAbilityModifier(abilityScore);
    const proficiencyBonus = isProficient ? (characterStats.proficiencyBonus || 0) : 0;
    return abilityModifier + proficiencyBonus;
  };

  const getXpProgress = () => {
    const currentLevel = characterStats.level || 1;
    const currentThreshold = XP_THRESHOLDS.find(t => t.level === currentLevel);
    const nextThreshold = XP_THRESHOLDS.find(t => t.level === currentLevel + 1);
    
    if (!currentThreshold || !nextThreshold) return 0;
    
    const progress = (characterStats.xp || 0) - currentThreshold.xp;
    const total = nextThreshold.xp - currentThreshold.xp;
    
    return (progress / total) * 100;
  };

  return (
    <div className="character-stats" style={{
      background: 'rgba(15, 15, 35, 0.9)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(139, 92, 246, 0.3)',
      borderRadius: '16px',
      padding: '1.5rem'
    }}>
      <h3 style={{
        fontSize: '1.25rem',
        fontWeight: 'bold',
        background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        📈 Character Stats
      </h3>

        {/* Level, XP, and Gold */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{
            background: 'rgba(139, 92, 246, 0.1)',
            border: '1px solid rgba(139, 92, 246, 0.2)',
            borderRadius: '16px',
            padding: '1rem',
            textAlign: 'center',
            minHeight: '80px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            minWidth: '0'
          }}>
            <div style={{ 
              fontSize: '0.75rem', 
              color: '#94a3b8', 
              marginBottom: '0.5rem', 
              fontWeight: '500',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>Level</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#e2e8f0' }}>{characterStats.level || 1}</div>
          </div>
          <div style={{
            background: 'rgba(139, 92, 246, 0.1)',
            border: '1px solid rgba(139, 92, 246, 0.2)',
            borderRadius: '16px',
            padding: '1rem',
            textAlign: 'center',
            minHeight: '80px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            minWidth: '0'
          }}>
            <div style={{ 
              fontSize: '0.75rem', 
              color: '#94a3b8', 
              marginBottom: '0.5rem', 
              fontWeight: '500',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>XP</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#e2e8f0' }}>{(characterStats.xp || 0).toLocaleString()}</div>
          </div>
          <div style={{
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            borderRadius: '16px',
            padding: '1rem',
            textAlign: 'center',
            minHeight: '80px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            minWidth: '0'
          }}>
            <div style={{ 
              fontSize: '0.75rem', 
              color: '#94a3b8', 
              marginBottom: '0.5rem', 
              fontWeight: '500',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>Gold</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b' }}>{(characterStats.gold || 0).toLocaleString()}</div>
          </div>
        </div>

      {/* XP Progress Bar */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
          <span>Progress to Level {(characterStats.level || 1) + 1}</span>
          <span>{getXpToNextLevel(characterStats.xp || 0).toLocaleString()} XP needed</span>
        </div>
        <div style={{ width: '100%', background: 'rgba(55, 65, 81, 0.6)', borderRadius: '8px', height: '8px' }}>
          <div
            style={{ 
              background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
              height: '8px',
              borderRadius: '8px',
              transition: 'all 0.5s ease',
              width: `${getXpProgress()}%`
            }}
          ></div>
        </div>
      </div>

      {/* Ability Scores */}
      <div style={{ marginBottom: '2rem' }}>
        <h4 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#a78bfa', marginBottom: '1.25rem' }}>Ability Scores</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
          {[
            { name: 'STR', value: characterStats.str, short: 'STR' },
            { name: 'DEX', value: characterStats.dex, short: 'DEX' },
            { name: 'CON', value: characterStats.con, short: 'CON' },
            { name: 'INT', value: characterStats.int, short: 'INT' },
            { name: 'WIS', value: characterStats.wis, short: 'WIS' },
            { name: 'CHA', value: characterStats.cha, short: 'CHA' }
          ].map(ability => {
            const modifier = getAbilityModifier(ability.value);
            return (
              <div key={ability.name} style={{
                background: 'rgba(139, 92, 246, 0.1)',
                border: '1px solid rgba(139, 92, 246, 0.2)',
                borderRadius: '12px',
                padding: '0.75rem',
                textAlign: 'center',
                minHeight: '70px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                minWidth: '0'
              }}>
                <div style={{ 
                  fontSize: '0.7rem', 
                  color: '#94a3b8', 
                  marginBottom: '0.25rem', 
                  fontWeight: '500',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>{ability.short}</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#e2e8f0', marginBottom: '0.25rem' }}>{ability.value}</div>
                <div style={{ 
                  fontSize: '0.7rem', 
                  color: modifier >= 0 ? '#10b981' : '#ef4444',
                  fontWeight: 'bold'
                }}>
                  {modifier >= 0 ? '+' : ''}{modifier}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Skills */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ fontSize: '1rem', fontWeight: 'bold', color: '#a78bfa', marginBottom: '1rem' }}>Skills</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', fontSize: '0.8rem' }}>
          {[
            { name: 'Acrobatics', ability: 'dex' },
            { name: 'Animal Handling', ability: 'wis' },
            { name: 'Arcana', ability: 'int' },
            { name: 'Athletics', ability: 'str' },
            { name: 'Deception', ability: 'cha' },
            { name: 'History', ability: 'int' },
            { name: 'Insight', ability: 'wis' },
            { name: 'Intimidation', ability: 'cha' },
            { name: 'Investigation', ability: 'int' },
            { name: 'Medicine', ability: 'wis' },
            { name: 'Nature', ability: 'int' },
            { name: 'Perception', ability: 'wis' },
            { name: 'Performance', ability: 'cha' },
            { name: 'Persuasion', ability: 'cha' },
            { name: 'Religion', ability: 'int' },
            { name: 'Sleight of Hand', ability: 'dex' },
            { name: 'Stealth', ability: 'dex' },
            { name: 'Survival', ability: 'wis' }
          ].map(skill => {
            const abilityScore = characterStats[skill.ability as keyof CharacterStats] as number;
            const bonus = getSkillBonus(abilityScore, characterStats.skills?.includes(skill.name) || false);
            return (
              <div key={skill.name} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'rgba(139, 92, 246, 0.05)',
                border: '1px solid rgba(139, 92, 246, 0.1)',
                borderRadius: '6px',
                padding: '0.5rem'
              }}>
                <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>{skill.name}</span>
                <span style={{ 
                  fontWeight: 'bold',
                  color: bonus >= 0 ? '#10b981' : '#ef4444',
                  fontSize: '0.7rem'
                }}>
                  {bonus >= 0 ? '+' : ''}{bonus}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Abilities and Spells */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#a78bfa', marginBottom: '0.75rem' }}>Class Abilities</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {(characterStats.abilities || []).map(ability => (
              <div key={ability} style={{
                background: 'rgba(139, 92, 246, 0.1)',
                border: '1px solid rgba(139, 92, 246, 0.2)',
                borderRadius: '6px',
                padding: '0.5rem',
                fontSize: '0.7rem',
                color: '#94a3b8'
              }}>
                {ability}
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#a78bfa', marginBottom: '0.75rem' }}>Spells</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {(characterStats.spells || []).map(spell => (
              <div key={typeof spell === 'string' ? spell : spell.name} style={{
                background: 'rgba(139, 92, 246, 0.1)',
                border: '1px solid rgba(139, 92, 246, 0.2)',
                borderRadius: '6px',
                padding: '0.5rem',
                fontSize: '0.7rem',
                color: '#94a3b8'
              }}>
                {typeof spell === 'string' ? spell : spell.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* XP Gain Button (for testing) */}
      <button
        onClick={() => addXp(100)}
        style={{
          width: '100%',
          padding: '0.75rem',
          background: 'linear-gradient(135deg, #10b981, #059669)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '8px',
          color: 'white',
          fontSize: '0.8rem',
          fontWeight: 'bold',
          cursor: 'pointer',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'linear-gradient(135deg, #059669, #047857)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'linear-gradient(135deg, #10b981, #059669)'
        }}
      >
        +100 XP (Test)
      </button>

      {/* Level Up Modal */}
      {showLevelUp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-600 w-96">
            <h4 className="text-2xl font-bold text-yellow-400 mb-4 text-center">
              🎉 LEVEL UP! 🎉
            </h4>
            <div className="text-white text-center mb-4">
              <div className="text-lg">Congratulations!</div>
              <div>You are now level {characterStats.level || 1}!</div>
            </div>
            <div className="bg-gray-700 p-3 rounded mb-4">
              <div className="text-sm text-gray-300 mb-2">Level Up Bonuses:</div>
              <div className="text-sm text-green-400">+{Math.floor((characterStats.con - 10) / 2) + 5} Maximum HP</div>
              <div className="text-sm text-blue-400">Proficiency Bonus: +{characterStats.proficiencyBonus || 0}</div>
            </div>
            <button
              onClick={() => setShowLevelUp(false)}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold"
            >
              Continue Adventure!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
