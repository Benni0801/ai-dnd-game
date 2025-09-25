'use client';

import React, { useState } from 'react';
import { CharacterStats, Message } from '../types';

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCharacterCreation, setShowCharacterCreation] = useState(true);
  const [characterStats, setCharacterStats] = useState<CharacterStats>({
    name: '',
    race: '',
    class: '',
    hp: 20,
    str: 12,
    dex: 12,
    int: 12,
    con: 12,
    wis: 12,
    cha: 12,
    inventory: 'Basic equipment'
  });

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
      <div className="min-h-screen rustic-background">
        <div className="fixed inset-0 rustic-wood-bg opacity-20"></div>
        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <div className="fantasy-card max-w-2xl w-full">
            <h1 className="rustic-title text-4xl text-center mb-8">
              ⚔️ Create Your Character
            </h1>
            
            <div className="space-y-4">
              <div>
                <label className="block rustic-text mb-2">Character Name:</label>
                <input
                  type="text"
                  value={characterStats.name}
                  onChange={(e) => setCharacterStats(prev => ({ ...prev, name: e.target.value }))}
                  className="rustic-input w-full"
                  placeholder="Enter your character's name"
                />
              </div>
              
              <div>
                <label className="block rustic-text mb-2">Race:</label>
                <select
                  value={characterStats.race}
                  onChange={(e) => setCharacterStats(prev => ({ ...prev, race: e.target.value }))}
                  className="rustic-input w-full"
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
                <label className="block rustic-text mb-2">Class:</label>
                <select
                  value={characterStats.class}
                  onChange={(e) => setCharacterStats(prev => ({ ...prev, class: e.target.value }))}
                  className="rustic-input w-full"
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
                className="rustic-button w-full text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed"
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
    <div className="min-h-screen rustic-background">
      <div className="fixed inset-0 rustic-wood-bg opacity-20"></div>
      <div className="relative z-10 min-h-screen flex">
        {/* Character Sheet Sidebar */}
        <div className="w-80 rustic-panel m-4">
          <div className="rustic-panel-content">
            <h3 className="rustic-title text-xl mb-4">📋 Character Sheet</h3>
            <div className="space-y-2">
              <div className="character-stat">
                <span className="character-stat-label">Name:</span>
                <span className="character-stat-value">{characterStats.name}</span>
              </div>
              <div className="character-stat">
                <span className="character-stat-label">Race:</span>
                <span className="character-stat-value">{characterStats.race}</span>
              </div>
              <div className="character-stat">
                <span className="character-stat-label">Class:</span>
                <span className="character-stat-value">{characterStats.class}</span>
              </div>
              <div className="character-stat">
                <span className="character-stat-label">HP:</span>
                <span className="character-stat-value">{characterStats.hp}</span>
              </div>
              <div className="character-stat">
                <span className="character-stat-label">Inventory:</span>
                <span className="character-stat-value text-sm">{characterStats.inventory}</span>
              </div>
            </div>
            
            <button
              onClick={() => setShowCharacterCreation(true)}
              className="rustic-button w-full mt-4"
            >
              ✏️ Edit Character
            </button>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="rustic-header">
            <h1 className="rustic-title text-2xl">
              ⚔️ AI D&D Adventure
            </h1>
            <p className="rustic-text mt-2">
              Playing as {characterStats.name} the {characterStats.race} {characterStats.class}
            </p>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto rustic-scrollbar">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`message-card ${message.role === 'user' ? 'user' : 'ai'} mb-4`}
              >
                <div className="text-sm text-gray-400 mb-2">
                  {message.role === 'user' ? 'You' : 'Dungeon Master'} • {message.timestamp.toLocaleTimeString()}
                </div>
                <div className="rustic-text">
                  {message.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="message-card ai mb-4">
                <div className="text-sm text-gray-400 mb-2">
                  Dungeon Master • thinking...
                </div>
                <div className="rustic-text">
                  The AI is crafting your adventure...
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="rustic-header">
            <form onSubmit={(e) => {
              e.preventDefault();
              if (inputMessage.trim() && !isLoading) {
                handleSendMessage(inputMessage.trim());
                setInputMessage('');
              }
            }}>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="What would you like to do, adventurer?"
                  disabled={isLoading}
                  className="rustic-input flex-1"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isLoading}
                  className="rustic-button px-6 disabled:opacity-50 disabled:cursor-not-allowed"
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