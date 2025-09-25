'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { rollD20 } from '@/utils/dice';
import { generateScenario, generateOpeningMessage } from '@/utils/scenarioGenerator';
import EnhancedCharacterCreation from './EnhancedCharacterCreation';
import MultiplayerLobby from './MultiplayerLobby';
import SimpleGameSheets from './SimpleGameSheets';
import SimpleDiceRoll from './SimpleDiceRoll';
// import AISettings, { AISettingsData } from './AISettings';

// Types
import { CharacterStats, Message } from '../types';

const AIDnDGame: React.FC = () => {
  // State management
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCharacterCreation, setShowCharacterCreation] = useState(false);
  const [showMultiplayerLobby, setShowMultiplayerLobby] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [characterStats, setCharacterStats] = useState<CharacterStats>({
    name: 'Adventurer',
    hp: 20,
    str: 12,
    dex: 12,
    int: 12,
    con: 12,
    wis: 12,
    cha: 12,
    inventory: 'Basic equipment'
  });
  const [selectedModel, setSelectedModel] = useState<string>('llama3.2:latest');
  const [availableModels, setAvailableModels] = useState<Array<{name: string, size: number}>>([]);
  const [lastFailedRequest, setLastFailedRequest] = useState<{
    messages: any[];
    characterStats: any;
    diceRoll: number | null;
    selectedModel: string;
  } | null>(null);
  const [showGameSheets, setShowGameSheets] = useState(false);
  const [lastDiceRoll, setLastDiceRoll] = useState<number | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [showDiceRoll, setShowDiceRoll] = useState(false);
  const [pendingDiceRoll, setPendingDiceRoll] = useState<{
    diceType: number;
    modifier: number;
    description: string;
  } | null>(null);
  const [showAISettings, setShowAISettings] = useState(false);
  const [aiSettings, setAiSettings] = useState<any>({
    personality: 'friendly',
    difficulty: 'normal',
    descriptionLevel: 'moderate',
    diceFrequency: 'normal'
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load available models
  const loadAvailableModels = useCallback(async () => {
    try {
      const response = await fetch('/api/ai-status');
      const data = await response.json();
      if (data.models && data.models.length > 0) {
        setAvailableModels(data.models);
        // Only set default model if no model is currently selected
        setSelectedModel(prev => prev || data.models[0].name);
      }
    } catch (error: any) {
      console.error('Error loading models:', error);
    }
  }, []);

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedMessages = localStorage.getItem('dnd-chat-messages');
    const savedStats = localStorage.getItem('dnd-character-stats');
    const savedGameStarted = localStorage.getItem('dnd-game-started');
    
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages).map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(parsedMessages);
      } catch (error: any) {
        console.error('Error loading saved messages:', error);
      }
    }
    
    if (savedStats) {
      try {
        const stats = JSON.parse(savedStats);
        setCharacterStats(stats);
        // If character has race/class, they've been created
        if (stats.race && stats.class) {
          setGameStarted(true);
        }
      } catch (error: any) {
        console.error('Error loading saved stats:', error);
      }
    }
    
    if (savedGameStarted === 'true') {
      setGameStarted(true);
    }
    
    // Load available models
    loadAvailableModels();
  }, [loadAvailableModels]);

  // Save messages to localStorage whenever messages change
  useEffect(() => {
    localStorage.setItem('dnd-chat-messages', JSON.stringify(messages));
  }, [messages]);

  // Save character stats to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('dnd-character-stats', JSON.stringify(characterStats));
  }, [characterStats]);

  // Save game started state
  useEffect(() => {
    localStorage.setItem('dnd-game-started', gameStarted.toString());
  }, [gameStarted]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Character creation handlers
  const handleCharacterCreated = (newCharacter: any) => {
    setCharacterStats(newCharacter);
    setShowCharacterCreation(false);
    setGameStarted(true);
    
    // Generate a random scenario and start the game
    const scenario = generateScenario(newCharacter);
    const openingMessage = generateOpeningMessage(newCharacter, scenario);
    
    const dmMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: openingMessage,
      timestamp: new Date()
    };
    
    setMessages([dmMessage]);
  };

  // Multiplayer handlers
  const handleJoinRoom = (roomId: string) => {
    setCurrentRoomId(roomId);
    setShowMultiplayerLobby(false);
    setGameStarted(true);
  };

  const handleCreateRoom = (roomId: string) => {
    setCurrentRoomId(roomId);
    setShowMultiplayerLobby(false);
    setGameStarted(true);
  };

  const handleStartNewCharacter = () => {
    setShowCharacterCreation(true);
    setGameStarted(false);
    setMessages([]);
  };

  // Roll dice function
  const handleRollDice = () => {
    // Set up the dice roll animation for manual roll
    setPendingDiceRoll({
      diceType: 20,
      modifier: 0,
      description: 'Manual d20 Roll'
    });
    setShowDiceRoll(true);
  };

  // Retry last failed request
  const handleRetryRequest = async () => {
    if (!lastFailedRequest) return;
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/ai-dnd', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(lastFailedRequest),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.message) {
        throw new Error('No message received from AI');
      }
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
      setLastFailedRequest(null); // Clear failed request on success
    } catch (error: any) {
      console.error('Error retrying request:', error);
      // Keep the failed request for another retry attempt
    } finally {
      setIsLoading(false);
    }
  };

  // Send message to AI
  const handleSendMessage = async () => {
    if (!inputMessage.trim() && !lastDiceRoll) return;

    // Check for special commands first
    if (inputMessage.trim() && handleSpecialCommand(inputMessage.trim())) {
      setInputMessage('');
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim() || `I rolled a d20 and got ${lastDiceRoll}`,
      diceRoll: lastDiceRoll || undefined,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setLastDiceRoll(null);
    setLastFailedRequest(null); // Clear any previous failed request when sending new message

    try {
      const response = await fetch('/api/ai-dnd', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
            body: JSON.stringify({
              messages: [...messages, userMessage].map(msg => ({
                role: msg.role,
                content: msg.content
              })),
              characterStats,
              diceRoll: lastDiceRoll,
              selectedModel,
              aiSettings
            }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.message) {
        throw new Error('No message received from AI');
      }
      
      // Check if the AI response contains a dice roll request
      const diceRollRequest = parseDiceRollRequest(data.message);
      
      if (diceRollRequest) {
        // Set up the dice roll animation
        setPendingDiceRoll(diceRollRequest);
        setShowDiceRoll(true);
        
        // Add the AI message without the dice roll request
        const cleanMessage = data.message.replace(/\[DICE_ROLL:[^\]]+\]/g, '').trim();
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: cleanMessage,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        // Normal AI response without dice roll
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.message,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMessage]);
      }
      
      setLastFailedRequest(null); // Clear any previous failed request on success
    } catch (error: any) {
      console.error('Error sending message:', error);
      
      // Store the failed request for retry
      setLastFailedRequest({
        messages: [...messages, userMessage].map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        characterStats,
        diceRoll: lastDiceRoll,
        selectedModel
      });
      
      let errorText = 'I apologize, but I encountered an error. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('timeout') || error.message.includes('timed out')) {
          errorText = '⏱️ AI response timed out. The model is running slowly on your system. Try using a smaller model (llama3.2:1b) or wait a bit longer.';
        } else if (error.message.includes('not responding') || error.message.includes('Failed to fetch')) {
          errorText = '🔌 AI service is not responding. Please check if Ollama is running and try again.';
        } else if (error.message.includes('HTTP 500')) {
          errorText = '⚠️ AI service encountered an internal error. Please try again or restart Ollama.';
        } else if (error.message.includes('HTTP 404')) {
          errorText = '🤖 Selected model not found. Please check if the model is installed in Ollama.';
        } else {
          errorText = `❌ ${error.message}`;
        }
      }
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorText,
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle key press for sending messages
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Parse dice roll requests from AI responses
  const parseDiceRollRequest = (message: string) => {
    const diceRollRegex = /\[DICE_ROLL:d(\d+)([+-]\d+)?:([^\]]+)\]/g;
    const match = diceRollRegex.exec(message);
    
    if (match) {
      const diceType = parseInt(match[1]);
      const modifier = match[2] ? parseInt(match[2]) : 0;
      const description = match[3];
      
      return {
        diceType,
        modifier,
        description
      };
    }
    
    return null;
  };

  // Handle dice roll completion
  const handleDiceRollComplete = (result: number) => {
    if (pendingDiceRoll) {
      // Check if this is a manual roll or AI-requested roll
      if (pendingDiceRoll.description === 'Manual d20 Roll') {
        // For manual rolls, add as user message
        const diceMessage: Message = {
          id: Date.now().toString(),
          role: 'user',
          content: `🎲 Rolled a d20: ${result}`,
          diceRoll: result,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, diceMessage]);
        setLastDiceRoll(result);
      } else {
        // For AI-requested rolls, add as assistant message
        const diceMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `🎲 **${pendingDiceRoll.description}**\n\nRoll Result: **${result}**\n\n${getDiceResultDescription(result, pendingDiceRoll.diceType)}`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, diceMessage]);
      }
      
      setPendingDiceRoll(null);
      setShowDiceRoll(false);
    }
  };

  // Get description based on dice roll result
  const getDiceResultDescription = (result: number, diceType: number) => {
    if (diceType === 20) {
      if (result >= 20) return "🎉 **Critical Success!** An extraordinary result that exceeds all expectations!";
      if (result >= 15) return "✨ **Great Success!** You perform exceptionally well.";
      if (result >= 10) return "✅ **Success!** You accomplish what you set out to do.";
      if (result >= 5) return "⚠️ **Partial Success** - You succeed but with complications.";
      return "❌ **Failure** - Things don't go as planned.";
    }
    
    // For other dice types, use simpler descriptions
    if (result >= diceType * 0.8) return "🎉 **Excellent result!**";
    if (result >= diceType * 0.6) return "✨ **Good result!**";
    if (result >= diceType * 0.4) return "✅ **Decent result.**";
    return "❌ **Poor result.**";
  };

  // Handle special commands
  const handleSpecialCommand = (message: string) => {
    const lowerMessage = message.toLowerCase().trim();
    
    if (lowerMessage.includes('show character sheet') || lowerMessage.includes('character sheet')) {
      setShowGameSheets(true);
      return true;
    }
    
    if (lowerMessage.includes('show party') || lowerMessage.includes('party sheet')) {
      setShowGameSheets(true);
      return true;
    }
    
    if (lowerMessage.includes('show inventory') || lowerMessage.includes('inventory sheet')) {
      setShowGameSheets(true);
      return true;
    }
    
    if (lowerMessage.includes('show quests') || lowerMessage.includes('quest sheet')) {
      setShowGameSheets(true);
      return true;
    }
    
    if (lowerMessage.includes('show lore') || lowerMessage.includes('lore sheet')) {
      setShowGameSheets(true);
      return true;
    }
    
    return false;
  };

  // Update character stats
  const updateCharacterStat = (stat: keyof CharacterStats, value: string | number) => {
    setCharacterStats(prev => ({
      ...prev,
      [stat]: value
    }));
  };

  // Reset game
  const resetGame = () => {
    setMessages([]);
    setCharacterStats({
      name: 'Adventurer',
      hp: 20,
      str: 12,
      dex: 12,
      int: 12,
      con: 12,
      wis: 12,
      cha: 12,
      inventory: 'Basic equipment'
    });
    setLastDiceRoll(null);
    setGameStarted(false);
    setShowCharacterCreation(false);
    localStorage.removeItem('dnd-chat-messages');
    localStorage.removeItem('dnd-character-stats');
    localStorage.removeItem('dnd-game-started');
  };

  // Show character creation if needed
  if (showCharacterCreation) {
    return (
      <EnhancedCharacterCreation
        onCharacterCreated={handleCharacterCreated}
        onClose={() => setShowCharacterCreation(false)}
      />
    );
  }

  // Show multiplayer lobby if needed
  if (showMultiplayerLobby) {
    return (
      <MultiplayerLobby
        onJoinRoom={handleJoinRoom}
        onCreateRoom={handleCreateRoom}
        onBack={() => setShowMultiplayerLobby(false)}
        currentUserId={currentUserId || undefined}
      />
    );
  }

  return (
    <div className="min-h-screen bg-dnd-darker text-white font-fantasy">
      {/* Header */}
      <header className="bg-dnd-dark border-b border-dnd-gold p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-dnd-gold">⚔️ AI Dungeon Master</h1>
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-gray-300">Ollama Online</span>
            </div>
          </div>
          <div className="space-x-2">
            {gameStarted && (
              <>
                <button
                  onClick={() => setShowGameSheets(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors font-bold"
                >
                  📋 Game Sheets
                </button>
                {/* <button
                  onClick={() => setShowAISettings(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded transition-colors font-bold"
                >
                  🎭 AI Settings
                </button> */}
              </>
            )}
            {!gameStarted && (
              <>
                <button
                  onClick={handleStartNewCharacter}
                  className="bg-dnd-gold hover:bg-yellow-600 text-dnd-darker px-4 py-2 rounded transition-colors font-bold"
                >
                  🎭 Create Character
                </button>
                <button
                  onClick={() => setShowMultiplayerLobby(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors font-bold"
                >
                  🌐 Multiplayer
                </button>
              </>
            )}
            <button
              onClick={resetGame}
              className="bg-dnd-red hover:bg-red-700 text-white px-4 py-2 rounded transition-colors"
            >
              🗑️ Reset Adventure
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row h-[calc(100vh-80px)]">
        {/* Character Sheet Sidebar */}
        <div className="w-full lg:w-80 bg-dnd-dark border-r border-dnd-gold p-4 overflow-y-auto scrollbar-thin">
          <h2 className="text-xl font-bold text-dnd-gold mb-4">📜 Character Sheet</h2>
          
          {!gameStarted ? (
            <div className="text-center text-gray-400 py-8">
              <p className="text-lg mb-4">No Character Created</p>
              <p className="text-sm mb-4">Create a character to begin your adventure!</p>
              <button
                onClick={handleStartNewCharacter}
                className="bg-dnd-gold hover:bg-yellow-600 text-dnd-darker px-6 py-3 rounded font-bold transition-colors"
              >
                🎭 Create Character
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Basic Info */}
              <div className="bg-dnd-darker border border-dnd-gold rounded p-3">
                <h3 className="font-bold text-dnd-gold mb-2">Basic Information</h3>
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs font-medium mb-1">Name</label>
                    <input
                      type="text"
                      value={characterStats.name}
                      onChange={(e) => updateCharacterStat('name', e.target.value)}
                      className="w-full bg-dnd-dark border border-dnd-gold rounded px-2 py-1 text-white text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-400">Race:</span>
                      <div className="text-dnd-gold">{characterStats.race || 'Unknown'}</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Class:</span>
                      <div className="text-dnd-gold">{characterStats.class || 'Unknown'}</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Background:</span>
                      <div className="text-dnd-gold">{characterStats.background || 'Unknown'}</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Level:</span>
                      <div className="text-dnd-gold">{characterStats.level || 1}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ability Scores */}
              <div className="bg-dnd-darker border border-dnd-gold rounded p-3">
                <h3 className="font-bold text-dnd-gold mb-2">Ability Scores</h3>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(characterStats).filter(([key]) => 
                    ['str', 'dex', 'int', 'con', 'wis', 'cha'].includes(key)
                  ).map(([stat, value]) => (
                    <div key={stat} className="text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">{stat.toUpperCase()}</span>
                        <input
                          type="number"
                          value={value as number}
                          onChange={(e) => updateCharacterStat(stat as keyof CharacterStats, parseInt(e.target.value) || 0)}
                          className="w-12 bg-dnd-dark border border-dnd-gold rounded px-1 py-1 text-white text-center text-xs"
                        />
                      </div>
                      <div className="text-xs text-gray-500 text-center">
                        Mod: {Math.floor(((value as number) - 10) / 2) >= 0 ? '+' : ''}{Math.floor(((value as number) - 10) / 2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hit Points */}
              <div className="bg-dnd-darker border border-dnd-gold rounded p-3">
                <h3 className="font-bold text-dnd-gold mb-2">Hit Points</h3>
                <div className="flex items-center space-x-2">
                  <label className="text-sm">Current HP:</label>
                  <input
                    type="number"
                    value={characterStats.hp}
                    onChange={(e) => updateCharacterStat('hp', parseInt(e.target.value) || 0)}
                    className="w-16 bg-dnd-dark border border-dnd-gold rounded px-2 py-1 text-white text-center"
                  />
                </div>
              </div>

              {/* Special Abilities */}
              {characterStats.specialAbilities && characterStats.specialAbilities.length > 0 && (
                <div className="bg-dnd-darker border border-dnd-gold rounded p-3">
                  <h3 className="font-bold text-dnd-gold mb-2">Special Abilities</h3>
                  <div className="space-y-1">
                    {characterStats.specialAbilities.map((ability, index) => (
                      <div key={index} className="text-xs text-gray-300 bg-dnd-dark rounded px-2 py-1">
                        {ability}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Inventory */}
              <div className="bg-dnd-darker border border-dnd-gold rounded p-3">
                <h3 className="font-bold text-dnd-gold mb-2">Inventory</h3>
                <textarea
                  value={characterStats.inventory}
                  onChange={(e) => updateCharacterStat('inventory', e.target.value)}
                  className="w-full bg-dnd-dark border border-dnd-gold rounded px-2 py-2 text-white text-sm h-24 resize-none"
                  placeholder="List your items..."
                />
              </div>
            </div>
          )}
        </div>

        {/* Main Game Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
            {messages.length === 0 && !gameStarted && (
              <div className="text-center text-gray-400 mt-8">
                <div className="bg-dnd-dark border border-dnd-gold rounded-lg p-8 max-w-2xl mx-auto">
                  <h2 className="text-2xl font-bold text-dnd-gold mb-4">Welcome to AI Dungeon Master!</h2>
                  <p className="text-lg mb-4">Create your character to begin an epic adventure</p>
                  <p className="text-sm mb-6">Choose from 6 races, 6 classes, and 6 backgrounds to create your unique hero</p>
                  <button
                    onClick={handleStartNewCharacter}
                    className="bg-dnd-gold hover:bg-yellow-600 text-dnd-darker px-8 py-3 rounded font-bold transition-colors text-lg"
                  >
                    🎭 Create Your Character
                  </button>
                </div>
              </div>
            )}
            
            {messages.length === 0 && gameStarted && (
              <div className="text-center text-gray-400 mt-8">
                <p className="text-lg">Welcome to your adventure, {characterStats.name}!</p>
                <p className="text-sm mt-2">Type a message to begin your quest...</p>
              </div>
            )}
            
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-dnd-gold text-dnd-darker'
                      : message.isError
                      ? 'bg-red-900 border border-red-500'
                      : 'bg-dnd-dark border border-dnd-gold'
                  }`}
                >
                  <div className="text-sm font-medium mb-1">
                    {message.role === 'user' ? 'You' : 'Dungeon Master'}
                  </div>
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  {message.diceRoll && (
                    <div className="text-xs mt-1 opacity-75">
                      🎲 Rolled: {message.diceRoll}
                    </div>
                  )}
                  {message.isError && lastFailedRequest && (
                    <div className="mt-2 pt-2 border-t border-red-600">
                      <button
                        onClick={handleRetryRequest}
                        disabled={isLoading}
                        className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-3 py-1 rounded text-xs font-medium transition-colors flex items-center space-x-1"
                      >
                        {isLoading ? (
                          <>
                            <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Retrying...</span>
                          </>
                        ) : (
                          <>
                            <span>🔄</span>
                            <span>Retry Request</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {/* AI Thinking Indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-dnd-dark border border-dnd-gold">
                  <div className="text-sm font-medium mb-1 text-dnd-gold">
                    Dungeon Master
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-dnd-gold border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm text-gray-300">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
            
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-dnd-gold p-4 bg-dnd-dark">
            {/* Model Selector */}
            {availableModels.length > 0 ? (
              <div className="mb-3">
                <label className="block text-sm text-dnd-gold mb-1">AI Model:</label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="bg-dnd-darker border border-dnd-gold rounded px-3 py-2 text-white text-sm"
                  disabled={isLoading}
                >
                  {availableModels.map((model) => (
                    <option key={model.name} value={model.name}>
                      {model.name} ({(model.size / (1024 * 1024 * 1024)).toFixed(1)} GB)
                    </option>
                  ))}
                </select>
                <div className="text-xs text-gray-400 mt-1">
                  💡 Tip: Use llama3.2:1b for faster responses on slower systems
                </div>
              </div>
            ) : (
              <div className="mb-3">
                <div className="text-sm text-yellow-400">
                  🔄 Loading available AI models...
                </div>
              </div>
            )}
            
            <div className="flex space-x-2 mb-2">
              <button
                onClick={handleRollDice}
                disabled={!gameStarted}
                className="bg-dnd-gold hover:bg-yellow-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-dnd-darker px-4 py-2 rounded font-bold transition-colors"
              >
                🎲 Roll d20
              </button>
              {lastDiceRoll && (
                <div className="bg-dnd-darker border border-dnd-gold px-3 py-2 rounded text-dnd-gold">
                  Last roll: {lastDiceRoll}
                </div>
              )}
            </div>
            
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={gameStarted ? "Describe your action or ask the Dungeon Master..." : "Create a character to begin your adventure"}
                className="flex-1 bg-dnd-darker border border-dnd-gold rounded px-3 py-2 text-white placeholder-gray-400"
                disabled={isLoading || !gameStarted}
              />
              {lastFailedRequest && (
                <button
                  onClick={handleRetryRequest}
                  disabled={isLoading}
                  className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded font-bold transition-colors flex items-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Retrying...</span>
                    </>
                  ) : (
                    <>
                      <span>🔄</span>
                      <span>Retry</span>
                    </>
                  )}
                </button>
              )}
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !gameStarted || (!inputMessage.trim() && !lastDiceRoll)}
                className="bg-dnd-red hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded font-bold transition-colors flex items-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>AI Thinking...</span>
                  </>
                ) : (
                  <span>Send</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Game Sheets Modal */}
      {showGameSheets && (
        <SimpleGameSheets
          characterStats={characterStats}
          onClose={() => setShowGameSheets(false)}
        />
      )}

      {/* Dice Roll Animation */}
      {showDiceRoll && pendingDiceRoll && (
        <SimpleDiceRoll
          isVisible={showDiceRoll}
          diceType={pendingDiceRoll.diceType}
          modifier={pendingDiceRoll.modifier}
          onComplete={handleDiceRollComplete}
          onClose={() => {
            setShowDiceRoll(false);
            setPendingDiceRoll(null);
          }}
        />
      )}

      {/* AI Settings Modal - Temporarily disabled */}
      {/* {showAISettings && (
        <AISettings
          isVisible={showAISettings}
          onClose={() => setShowAISettings(false)}
          onSettingsChange={setAiSettings}
          currentSettings={aiSettings}
        />
      )} */}
    </div>
  );
};

export default AIDnDGame;
