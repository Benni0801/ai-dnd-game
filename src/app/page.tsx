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
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#1a1a1a', 
        color: 'white', 
        padding: '2rem',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '2.5rem', textAlign: 'center', marginBottom: '2rem' }}>
            ⚔️ Create Your Character
          </h1>
          
          <div style={{ 
            backgroundColor: '#2a2a2a', 
            padding: '2rem', 
            borderRadius: '8px'
          }}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Character Name:</label>
              <input
                type="text"
                value={characterStats.name}
                onChange={(e) => setCharacterStats(prev => ({ ...prev, name: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  backgroundColor: '#3a3a3a',
                  border: '1px solid #555',
                  borderRadius: '4px',
                  color: 'white'
                }}
                placeholder="Enter your character's name"
              />
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Race:</label>
              <select
                value={characterStats.race}
                onChange={(e) => setCharacterStats(prev => ({ ...prev, race: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  backgroundColor: '#3a3a3a',
                  border: '1px solid #555',
                  borderRadius: '4px',
                  color: 'white'
                }}
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
            
            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Class:</label>
              <select
                value={characterStats.class}
                onChange={(e) => setCharacterStats(prev => ({ ...prev, class: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  backgroundColor: '#3a3a3a',
                  border: '1px solid #555',
                  borderRadius: '4px',
                  color: 'white'
                }}
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
              style={{
                width: '100%',
                padding: '1rem',
                backgroundColor: characterStats.name && characterStats.race && characterStats.class ? '#4CAF50' : '#666',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '1.1rem',
                cursor: characterStats.name && characterStats.race && characterStats.class ? 'pointer' : 'not-allowed'
              }}
            >
              🎭 Create Character & Start Adventure
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#1a1a1a', 
      color: 'white', 
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ 
        display: 'flex', 
        height: '100vh'
      }}>
        {/* Character Sheet Sidebar */}
        <div style={{ 
          width: '300px', 
          backgroundColor: '#2a2a2a', 
          padding: '1rem',
          borderRight: '1px solid #444'
        }}>
          <h3 style={{ marginBottom: '1rem', color: '#FFD700' }}>📋 Character Sheet</h3>
          <div style={{ marginBottom: '0.5rem' }}>
            <strong>Name:</strong> {characterStats.name}
          </div>
          <div style={{ marginBottom: '0.5rem' }}>
            <strong>Race:</strong> {characterStats.race}
          </div>
          <div style={{ marginBottom: '0.5rem' }}>
            <strong>Class:</strong> {characterStats.class}
          </div>
          <div style={{ marginBottom: '0.5rem' }}>
            <strong>HP:</strong> {characterStats.hp}
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <strong>Inventory:</strong> {characterStats.inventory}
          </div>
          
          <button
            onClick={() => setShowCharacterCreation(true)}
            style={{
              width: '100%',
              padding: '0.5rem',
              backgroundColor: '#666',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            ✏️ Edit Character
          </button>
        </div>

        {/* Main Chat Area */}
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column'
        }}>
          {/* Header */}
          <div style={{ 
            padding: '1rem', 
            backgroundColor: '#2a2a2a', 
            borderBottom: '1px solid #444'
          }}>
            <h1 style={{ margin: 0, fontSize: '1.5rem' }}>
              ⚔️ AI D&D Adventure
            </h1>
            <p style={{ margin: '0.5rem 0 0 0', color: '#ccc' }}>
              Playing as {characterStats.name} the {characterStats.race} {characterStats.class}
            </p>
          </div>

          {/* Messages */}
          <div style={{ 
            flex: 1, 
            padding: '1rem', 
            overflowY: 'auto',
            backgroundColor: '#1a1a1a'
          }}>
            {messages.map((message) => (
              <div
                key={message.id}
                style={{
                  marginBottom: '1rem',
                  padding: '1rem',
                  backgroundColor: message.role === 'user' ? '#2a4a2a' : '#2a2a4a',
                  borderRadius: '8px',
                  borderLeft: `4px solid ${message.role === 'user' ? '#4CAF50' : '#2196F3'}`
                }}
              >
                <div style={{ 
                  fontSize: '0.8rem', 
                  color: '#ccc', 
                  marginBottom: '0.5rem' 
                }}>
                  {message.role === 'user' ? 'You' : 'Dungeon Master'} • {message.timestamp.toLocaleTimeString()}
                </div>
                <div style={{ lineHeight: '1.5' }}>
                  {message.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div style={{
                marginBottom: '1rem',
                padding: '1rem',
                backgroundColor: '#2a2a4a',
                borderRadius: '8px',
                borderLeft: '4px solid #2196F3'
              }}>
                <div style={{ fontSize: '0.8rem', color: '#ccc', marginBottom: '0.5rem' }}>
                  Dungeon Master • thinking...
                </div>
                <div style={{ color: '#ccc' }}>
                  The AI is crafting your adventure...
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div style={{ 
            padding: '1rem', 
            backgroundColor: '#2a2a2a', 
            borderTop: '1px solid #444'
          }}>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (inputMessage.trim() && !isLoading) {
                handleSendMessage(inputMessage.trim());
                setInputMessage('');
              }
            }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="What would you like to do, adventurer?"
                  disabled={isLoading}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    backgroundColor: '#3a3a3a',
                    border: '1px solid #555',
                    borderRadius: '4px',
                    color: 'white',
                    fontSize: '1rem'
                  }}
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isLoading}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: !inputMessage.trim() || isLoading ? '#666' : '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: !inputMessage.trim() || isLoading ? 'not-allowed' : 'pointer',
                    fontSize: '1rem'
                  }}
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