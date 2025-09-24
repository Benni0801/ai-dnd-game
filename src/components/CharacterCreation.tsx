'use client';

import React, { useState } from 'react';

interface CharacterCreationProps {
  onCharacterCreated: (character: any) => void;
  onCancel: () => void;
}

const CharacterCreation: React.FC<CharacterCreationProps> = ({ onCharacterCreated, onCancel }) => {
  const [characterDescription, setCharacterDescription] = useState('');
  const [characterName, setCharacterName] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const generateCharacterFromDescription = (description: string, name: string) => {
    // Simple character generation based on description
    const words = description.toLowerCase();
    
    // Determine race based on keywords
    let race = 'Human';
    if (words.includes('elf') || words.includes('elven')) race = 'Elf';
    else if (words.includes('dwarf') || words.includes('dwarven')) race = 'Dwarf';
    else if (words.includes('halfling') || words.includes('hobbit')) race = 'Halfling';
    else if (words.includes('dragonborn') || words.includes('dragon')) race = 'Dragonborn';
    else if (words.includes('tiefling') || words.includes('demon')) race = 'Tiefling';
    
    // Determine class based on keywords
    let characterClass = 'Fighter';
    if (words.includes('wizard') || words.includes('mage') || words.includes('magic') || words.includes('spell')) characterClass = 'Wizard';
    else if (words.includes('rogue') || words.includes('thief') || words.includes('stealth') || words.includes('sneak')) characterClass = 'Rogue';
    else if (words.includes('cleric') || words.includes('priest') || words.includes('holy') || words.includes('divine')) characterClass = 'Cleric';
    else if (words.includes('ranger') || words.includes('hunter') || words.includes('archer') || words.includes('nature')) characterClass = 'Ranger';
    else if (words.includes('barbarian') || words.includes('berserker') || words.includes('rage') || words.includes('savage')) characterClass = 'Barbarian';
    
    // Determine background based on keywords
    let background = 'Folk Hero';
    if (words.includes('noble') || words.includes('royal') || words.includes('lord') || words.includes('lady')) background = 'Noble';
    else if (words.includes('criminal') || words.includes('thief') || words.includes('outlaw')) background = 'Criminal';
    else if (words.includes('acolyte') || words.includes('temple') || words.includes('religious')) background = 'Acolyte';
    else if (words.includes('sage') || words.includes('scholar') || words.includes('learned') || words.includes('wise')) background = 'Sage';
    else if (words.includes('soldier') || words.includes('military') || words.includes('warrior') || words.includes('guard')) background = 'Soldier';
    
    // Generate stats based on class
    let stats = { str: 10, dex: 10, int: 10, con: 10, wis: 10, cha: 10 };
    let hp = 10;
    
    if (characterClass === 'Fighter') {
      stats = { str: 16, dex: 14, int: 12, con: 15, wis: 13, cha: 11 };
      hp = 25;
    } else if (characterClass === 'Wizard') {
      stats = { str: 10, dex: 14, int: 16, con: 12, wis: 13, cha: 11 };
      hp = 15;
    } else if (characterClass === 'Rogue') {
      stats = { str: 12, dex: 16, int: 14, con: 13, wis: 11, cha: 10 };
      hp = 20;
    } else if (characterClass === 'Cleric') {
      stats = { str: 13, dex: 10, int: 12, con: 14, wis: 16, cha: 11 };
      hp = 20;
    } else if (characterClass === 'Ranger') {
      stats = { str: 14, dex: 16, int: 12, con: 13, wis: 15, cha: 10 };
      hp = 25;
    } else if (characterClass === 'Barbarian') {
      stats = { str: 16, dex: 14, int: 10, con: 16, wis: 12, cha: 11 };
      hp = 30;
    }
    
    // Apply race bonuses
    if (race === 'Elf') {
      stats.dex += 2;
      stats.int += 1;
    } else if (race === 'Dwarf') {
      stats.con += 2;
      stats.str += 1;
    } else if (race === 'Halfling') {
      stats.dex += 2;
      stats.cha += 1;
    } else if (race === 'Dragonborn') {
      stats.str += 2;
      stats.cha += 1;
    } else if (race === 'Tiefling') {
      stats.int += 1;
      stats.cha += 2;
    } else if (race === 'Human') {
      stats.str += 1;
      stats.dex += 1;
      stats.int += 1;
      stats.con += 1;
      stats.wis += 1;
      stats.cha += 1;
    }
    
    // Generate inventory based on class and background
    let inventory = 'Basic equipment';
    if (characterClass === 'Fighter') {
      inventory = 'Chain mail, Shield, Longsword, Handaxe, Dungeoneer\'s pack';
    } else if (characterClass === 'Wizard') {
      inventory = 'Quarterstaff, Dagger, Component pouch, Scholar\'s pack, Spellbook';
    } else if (characterClass === 'Rogue') {
      inventory = 'Rapier, Shortbow, Burglar\'s pack, Leather armor, Dagger';
    } else if (characterClass === 'Cleric') {
      inventory = 'Mace, Shield, Chain mail, Priest\'s pack, Holy symbol';
    } else if (characterClass === 'Ranger') {
      inventory = 'Longbow, Quiver, Scale mail, Explorer\'s pack, Dagger';
    } else if (characterClass === 'Barbarian') {
      inventory = 'Greataxe, Handaxe, Javelin, Explorer\'s pack';
    }
    
    return {
      name: name || 'Adventurer',
      race,
      class: characterClass,
      background,
      str: stats.str,
      dex: stats.dex,
      int: stats.int,
      con: stats.con,
      wis: stats.wis,
      cha: stats.cha,
      hp,
      inventory,
      level: 1,
      specialAbilities: [`${race} abilities`, `${characterClass} abilities`]
    };
  };

  const handleCreateCharacter = async () => {
    if (!characterDescription.trim()) {
      setError('Please describe your character!');
      return;
    }

    if (!username.trim()) {
      setError('Please enter a username!');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // First, get or create user
      let user;
      try {
        const userResponse = await fetch('/api/users', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          user = userData.user;
        } else {
          // User doesn't exist, create new one
          const createUserResponse = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: username.trim() }),
          });
          
          if (!createUserResponse.ok) {
            const errorData = await createUserResponse.json();
            throw new Error(errorData.error || 'Failed to create user');
          }
          
          const userData = await createUserResponse.json();
          user = userData.user;
        }
      } catch (error) {
        // If GET fails, try to create user
        const createUserResponse = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: username.trim() }),
        });
        
        if (!createUserResponse.ok) {
          const errorData = await createUserResponse.json();
          throw new Error(errorData.error || 'Failed to create user');
        }
        
        const userData = await createUserResponse.json();
        user = userData.user;
      }

      // Generate character data
      const characterData = generateCharacterFromDescription(characterDescription, characterName);
      
      // Create character in database
      const characterResponse = await fetch('/api/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          characterData: characterData
        }),
      });

      if (!characterResponse.ok) {
        const errorData = await characterResponse.json();
        throw new Error(errorData.error || 'Failed to create character');
      }

      const characterResult = await characterResponse.json();
      onCharacterCreated(characterResult.character);
      
    } catch (error) {
      console.error('Error creating character:', error);
      setError(error instanceof Error ? error.message : 'Failed to create character');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dnd-darker text-white p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-dnd-gold mb-2">Create Your Character</h1>
          <p className="text-gray-300">Describe who you are and what you can do. The AI will determine your race, class, and abilities based on your description.</p>
        </div>

        <div className="bg-dnd-dark border border-dnd-gold rounded p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-dnd-darker border border-dnd-gold rounded px-3 py-2 text-white"
              placeholder="Enter your username"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Character Name</label>
            <input
              type="text"
              value={characterName}
              onChange={(e) => setCharacterName(e.target.value)}
              className="w-full bg-dnd-darker border border-dnd-gold rounded px-3 py-2 text-white"
              placeholder="Enter your character's name (optional)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Character Description</label>
            <textarea
              value={characterDescription}
              onChange={(e) => setCharacterDescription(e.target.value)}
              className="w-full bg-dnd-darker border border-dnd-gold rounded px-3 py-2 text-white h-32 resize-none"
              placeholder="Describe your character! For example: 'I am a wise elven wizard who has studied magic for centuries and can cast powerful spells. I wear robes and carry a staff. I am intelligent and wise, but not very strong.'"
            />
          </div>

          <div className="bg-dnd-darker border border-dnd-gold rounded p-4">
            <h3 className="font-bold text-dnd-gold mb-2">Tips for Character Creation:</h3>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Mention your race (human, elf, dwarf, etc.)</li>
              <li>• Describe your class (warrior, wizard, rogue, etc.)</li>
              <li>• Include your background (noble, criminal, scholar, etc.)</li>
              <li>• Describe your abilities and equipment</li>
              <li>• The AI will automatically assign stats and abilities</li>
              <li>• You can create up to 3 characters per account</li>
            </ul>
          </div>

          {error && (
            <div className="bg-red-900 border border-red-500 rounded p-4">
              <p className="text-red-200">{error}</p>
            </div>
          )}
        </div>

        <div className="flex justify-between mt-6">
          <button
            onClick={onCancel}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded"
          >
            Cancel
          </button>
          
          <button
            onClick={handleCreateCharacter}
            disabled={!characterDescription.trim() || !username.trim() || isLoading}
            className="bg-dnd-gold hover:bg-yellow-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-dnd-darker px-6 py-2 rounded font-bold"
          >
            {isLoading ? 'Creating...' : 'Create Character'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CharacterCreation;