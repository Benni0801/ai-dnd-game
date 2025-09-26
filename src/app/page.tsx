'use client';

import React, { useState } from 'react';
import { CharacterStats, Message } from '../types';
import AdvancedDiceRoller from '../components/AdvancedDiceRoller';
import InventorySystem from '../components/InventorySystem';
import CombatSystem from '../components/CombatSystem';
import CharacterProgression from '../components/CharacterProgression';

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCharacterCreation, setShowCharacterCreation] = useState(true);
  const [characterStats, setCharacterStats] = useState<CharacterStats>({
    name: '',
    race: '',
    class: '',
    level: 1,
    xp: 0,
    hp: 20,
    maxHp: 20,
    str: 12,
    dex: 12,
    int: 12,
    con: 12,
    wis: 12,
    cha: 12,
    proficiencyBonus: 2,
    skills: [],
    abilities: [],
    spells: [],
    inventory: 'Basic equipment'
  });

  const [activeTab, setActiveTab] = useState<'chat' | 'character' | 'inventory' | 'combat' | 'dice'>('chat');
  const [inventory, setInventory] = useState<any[]>([]);

  const handleDiceRoll = (results: any[]) => {
    const rollText = results.map(r => `${r.value}${r.isCritical ? ' (Critical!)' : r.isFumble ? ' (Fumble!)' : ''}`).join(', ');
    const total = results.reduce((sum, r) => sum + r.value, 0);
    
    const diceMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: `🎲 You rolled: [${rollText}] = ${total}`,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, diceMessage]);
  };

  const handleCombatEnd = (victory: boolean) => {
    const combatMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: victory 
        ? `🎉 Victory! You have defeated your enemy and gained 100 XP!`
        : `💀 Defeat! You have been defeated in combat.`,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, combatMessage]);
    
    if (victory) {
      setCharacterStats(prev => ({
        ...prev,
        xp: (prev.xp || 0) + 100
      }));
    }
  };

  const handleCharacterCreated = (character: CharacterStats) => {
    setCharacterStats(character);
    setShowCharacterCreation(false);
    
    const openingMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: `Welcome, ${character.name}! You are a ${character.race} ${character.class} beginning your epic journey. The world stretches before you, filled with possibilities and dangers. What would you like to do first?`,
      timestamp: new Date()
    };
    
    setMessages([openingMessage]);
  };

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai-dnd', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          characterStats
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);

    } catch (error: any) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I apologize, but I encountered an error: ${error.message}. Please try again.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (showCharacterCreation) {
    return (
      <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0f0f23 0%, #0a0a1a 100%)' }}>
        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <div className="glass-card max-w-2xl w-full p-8">
            <h1 className="text-4xl font-bold text-center mb-8 purple-gradient bg-clip-text text-transparent">
              ⚔️ Create Your Character
            </h1>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-muted)' }}>
                  Character Name
                </label>
                <input
                  type="text"
                  value={characterStats.name}
                  onChange={(e) => setCharacterStats(prev => ({ ...prev, name: e.target.value }))}
                  className="input-field w-full"
                  placeholder="Enter your character's name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-muted)' }}>
                  Race
                </label>
                <select
                  value={characterStats.race || ''}
                  onChange={(e) => setCharacterStats(prev => ({ ...prev, race: e.target.value }))}
                  className="input-field w-full"
                >
                  <option value="">Select a race</option>
                  <option value="Human">Human</option>
                  <option value="Elf">Elf</option>
                  <option value="Dwarf">Dwarf</option>
                  <option value="Halfling">Halfling</option>
                  <option value="Dragonborn">Dragonborn</option>
                  <option value="Tiefling">Tiefling</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-muted)' }}>
                  Class
                </label>
                <select
                  value={characterStats.class || ''}
                  onChange={(e) => setCharacterStats(prev => ({ ...prev, class: e.target.value }))}
                  className="input-field w-full"
                >
                  <option value="">Select a class</option>
                  <option value="Fighter">Fighter</option>
                  <option value="Wizard">Wizard</option>
                  <option value="Rogue">Rogue</option>
                  <option value="Cleric">Cleric</option>
                  <option value="Ranger">Ranger</option>
                  <option value="Paladin">Paladin</option>
                  <option value="Barbarian">Barbarian</option>
                  <option value="Bard">Bard</option>
                </select>
              </div>
              
              <button
                onClick={() => handleCharacterCreated(characterStats)}
                disabled={!characterStats.name || !characterStats.race || !characterStats.class}
                className="btn-primary w-full text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🎭 Create Character & Start Adventure
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0f0f23 0%, #0a0a1a 100%)' }}>
      <div className="relative z-10 min-h-screen flex">
        {/* Sidebar */}
        <div className="w-80 m-4 space-y-4">
          {/* Character Info */}
          <div className="glass-panel p-6">
            <h3 className="text-xl font-bold mb-4 purple-gradient bg-clip-text text-transparent">
              📋 {characterStats.name}
            </h3>
            <div className="space-y-3 text-sm">
              <div className="character-stat">
                <span className="character-stat-label">Level {characterStats.level || 1} {characterStats.race} {characterStats.class}</span>
              </div>
              <div className="character-stat">
                <span className="character-stat-label">HP:</span>
                <span className="character-stat-value">{characterStats.hp}/{characterStats.maxHp || characterStats.hp}</span>
              </div>
              <div className="character-stat">
                <span className="character-stat-label">XP:</span>
                <span className="character-stat-value">{characterStats.xp || 0}</span>
              </div>
            </div>
            
            <button
              onClick={() => setShowCharacterCreation(true)}
              className="btn-secondary w-full mt-4 text-sm"
            >
              ✏️ Edit Character
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="glass-panel p-4">
            <div className="tab-nav">
              <button
                onClick={() => setActiveTab('chat')}
                className={`tab-button ${activeTab === 'chat' ? 'active' : ''}`}
              >
                💬 Chat
              </button>
              <button
                onClick={() => setActiveTab('character')}
                className={`tab-button ${activeTab === 'character' ? 'active' : ''}`}
              >
                📈 Stats
              </button>
              <button
                onClick={() => setActiveTab('inventory')}
                className={`tab-button ${activeTab === 'inventory' ? 'active' : ''}`}
              >
                🎒 Items
              </button>
              <button
                onClick={() => setActiveTab('combat')}
                className={`tab-button ${activeTab === 'combat' ? 'active' : ''}`}
              >
                ⚔️ Combat
              </button>
              <button
                onClick={() => setActiveTab('dice')}
                className={`tab-button ${activeTab === 'dice' ? 'active' : ''}`}
              >
                🎲 Dice
              </button>
            </div>
          </div>

          {/* Active Tab Content */}
          <div className="glass-panel">
            {activeTab === 'character' && (
              <CharacterProgression
                characterStats={characterStats}
                onStatsUpdate={(stats) => setCharacterStats(prev => ({ ...prev, ...stats }))}
              />
            )}
            {activeTab === 'inventory' && (
              <InventorySystem
                characterStats={characterStats}
                onInventoryChange={setInventory}
              />
            )}
            {activeTab === 'combat' && (
              <CombatSystem
                characterStats={characterStats}
                onCombatEnd={handleCombatEnd}
              />
            )}
            {activeTab === 'dice' && (
              <AdvancedDiceRoller
                onRollComplete={handleDiceRoll}
              />
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="glass-panel m-4 p-6">
            <h1 className="text-3xl font-bold purple-gradient bg-clip-text text-transparent">
              ⚔️ AI D&D Adventure
            </h1>
            <p className="mt-2" style={{ color: 'var(--text-muted)' }}>
              Playing as {characterStats.name} the {characterStats.race} {characterStats.class}
            </p>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`message-card ${message.role === 'user' ? 'user' : 'ai'}`}
              >
                <div className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>
                  {message.role === 'user' ? 'You' : 'Dungeon Master'} • {message.timestamp.toLocaleTimeString()}
                </div>
                <div style={{ color: 'var(--text-light)' }}>
                  {message.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="message-card ai">
                <div className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>
                  Dungeon Master • thinking...
                </div>
                <div style={{ color: 'var(--text-light)' }}>
                  The AI is crafting your adventure...
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="glass-panel m-4 p-4">
            <form onSubmit={(e) => {
              e.preventDefault();
              if (inputMessage.trim() && !isLoading) {
                handleSendMessage(inputMessage.trim());
                setInputMessage('');
              }
            }}>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="What would you like to do, adventurer?"
                  disabled={isLoading}
                  className="input-field flex-1"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isLoading}
                  className="btn-primary px-6 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Sending...' : 'Send'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}