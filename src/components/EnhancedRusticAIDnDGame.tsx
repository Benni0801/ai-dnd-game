'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { rollD20 } from '@/utils/dice';
import EnhancedCharacterCreation from './EnhancedCharacterCreation';
import SimpleGameSheets from './SimpleGameSheets';
import SimpleDiceRoll from './SimpleDiceRoll';
import RusticGameLayout from './RusticGameLayout';
import RusticCharacterSheet from './RusticCharacterSheet';
import RusticGameTools from './RusticGameTools';
import GameNotes from './GameNotes';

// Types
import { CharacterStats } from '../types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  diceRoll?: number;
  timestamp: Date;
  isError?: boolean;
}

interface GameSession {
  id: string;
  characterId: string;
  userId: string;
  currentLocation: string;
  questProgress: string;
  npcRelations: Record<string, number>;
  gameState: string;
  lastPlayed: Date;
  createdAt: Date;
}

const EnhancedRusticAIDnDGame: React.FC = () => {
  // State management
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCharacterCreation, setShowCharacterCreation] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentSession, setCurrentSession] = useState<GameSession | null>(null);
  const [characterStats, setCharacterStats] = useState<CharacterStats>({
    name: 'Adventurer',
    hp: 20,
    str: 12,
    dex: 12,
    int: 12,
    con: 12,
    wis: 12,
    cha: 12,
    inventory: 'Basic equipment',
    attributes: {
      str: 12,
      dex: 12,
      int: 12,
      con: 12,
      wis: 12,
      cha: 12
    }
  });
  const [selectedModel, setSelectedModel] = useState<string>('llama3.2:1b');
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
  const [showNotes, setShowNotes] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize user ID on component mount
  useEffect(() => {
    const userId = localStorage.getItem('dnd_user_id');
    if (!userId) {
      const newUserId = 'user_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('dnd_user_id', newUserId);
      setCurrentUserId(newUserId);
    } else {
      setCurrentUserId(userId);
    }
  }, []);

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
    } catch (error) {
      console.error('Error loading models:', error);
    }
  }, []);

  useEffect(() => {
    loadAvailableModels();
  }, [loadAvailableModels]);

  // Load existing game session if available
  const loadExistingSession = async () => {
    if (!currentUserId || !characterStats.id) return;

    try {
      const response = await fetch(`/api/sessions?userId=${currentUserId}`);
      if (response.ok) {
        const data = await response.json();
        const existingSession = data.sessions.find((s: GameSession) => s.characterId === characterStats.id);
        
        if (existingSession) {
          setCurrentSession(existingSession);
          setGameStarted(true);
          
          // Load previous turns as messages
          const turnsResponse = await fetch(`/api/turns?sessionId=${existingSession.id}`);
          if (turnsResponse.ok) {
            const turnsData = await turnsResponse.json();
            const loadedMessages: Message[] = [];
            
            turnsData.turns.forEach((turn: any) => {
              loadedMessages.push({
                id: `user_${turn.id}`,
                role: 'user',
                content: turn.playerInput,
                timestamp: new Date(turn.timestamp)
              });
              loadedMessages.push({
                id: `ai_${turn.id}`,
                role: 'assistant',
                content: turn.aiResponse,
                timestamp: new Date(turn.timestamp)
              });
            });
            
            setMessages(loadedMessages);
          }
        }
      }
    } catch (error) {
      console.error('Error loading existing session:', error);
    }
  };

  // Character creation handler
  const handleCharacterCreated = async (character: CharacterStats) => {
    setCharacterStats(character);
    setShowCharacterCreation(false);
    
    // Create or load game session
    if (currentUserId && character.id) {
      try {
        const response = await fetch('/api/sessions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            characterId: character.id,
            userId: currentUserId,
            initialLocation: 'Starting Village'
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setCurrentSession(data.session);
          setGameStarted(true);
          
          // Generate opening message
          const openingMessage = `Welcome, ${character.name}! 

You are a ${character.race || 'adventurer'} ${character.class || 'hero'} beginning your epic journey in the Starting Village. The world stretches before you, filled with possibilities and dangers. Your training and abilities have prepared you for this moment.

As you take in your surroundings, you notice various paths and opportunities ahead. What do you do first? Do you investigate the area, seek out information, or take a different approach entirely?

The adventure awaits!`;
          
          setMessages([{
            id: Date.now().toString(),
            role: 'assistant',
            content: openingMessage,
            timestamp: new Date()
          }]);
        }
      } catch (error) {
        console.error('Error creating game session:', error);
      }
    }
  };

  // Send message handler
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
    setLastFailedRequest(null);

    try {
      const response = await fetch('/api/ai-dnd', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          characterStats,
          selectedModel,
          aiSettings,
          sessionId: currentSession?.id,
          playerInput: message
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

      // Check for dice roll requests in AI response
      const diceRollMatch = data.message.match(/\[DICE_ROLL:([^\]]+)\]/);
      if (diceRollMatch) {
        const diceInfo = diceRollMatch[1];
        const [diceType, description] = diceInfo.split(':');
        const [dice, modifier] = diceType.split(/[+-]/);
        const diceNum = parseInt(dice.replace('d', ''));
        const mod = modifier ? parseInt(modifier) : 0;
        
        setPendingDiceRoll({
          diceType: diceNum,
          modifier: mod,
          description: description || 'AI Requested Roll'
        });
        setShowDiceRoll(true);
      }

    } catch (error: any) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${error.message}`,
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
      
      // Store failed request for retry
      setLastFailedRequest({
        messages: [...messages, userMessage],
        characterStats,
        diceRoll: null,
        selectedModel
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Dice roll handler
  const handleRollDice = (diceType: number, modifier: number = 0) => {
    const result = Math.floor(Math.random() * diceType) + 1 + modifier;
    setLastDiceRoll(result);
    
    const rollMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: `Rolled d${diceType}${modifier !== 0 ? (modifier > 0 ? ` + ${modifier}` : ` ${modifier}`) : ''} = ${result}`,
      timestamp: new Date(),
      diceRoll: result
    };
    
    setMessages(prev => [...prev, rollMessage]);
  };

  // Dice roll completion handler
  const handleDiceRollComplete = (result: number) => {
    if (pendingDiceRoll) {
      const rollMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `🎲 ${pendingDiceRoll.description}: ${result}`,
        timestamp: new Date(),
        diceRoll: result
      };
      
      setMessages(prev => [...prev, rollMessage]);
      setPendingDiceRoll(null);
    }
    setShowDiceRoll(false);
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

  // Show game sheets if needed
  if (showGameSheets) {
    return (
      <SimpleGameSheets
        characterStats={characterStats}
        onClose={() => setShowGameSheets(false)}
      />
    );
  }

  // Show dice roll animation if needed
  if (showDiceRoll && pendingDiceRoll) {
    return (
      <SimpleDiceRoll
        isVisible={showDiceRoll}
        diceType={pendingDiceRoll.diceType}
        modifier={pendingDiceRoll.modifier}
        onComplete={handleDiceRollComplete}
        onClose={() => setShowDiceRoll(false)}
      />
    );
  }

  // Header component
  const header = (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <h1 className="rustic-title text-2xl">⚔️ AI D&D Adventure</h1>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-green-400">Ollama Online</span>
        </div>
        {currentSession && (
          <div className="text-sm text-gray-400">
            📍 {currentSession.currentLocation}
          </div>
        )}
      </div>
      <div className="flex items-center space-x-2">
        {!gameStarted && (
          <button
            onClick={() => setShowCharacterCreation(true)}
            className="rustic-button text-sm"
          >
            ✨ Create Character
          </button>
        )}
        {gameStarted && (
          <>
            <button
              onClick={() => setShowGameSheets(true)}
              className="rustic-button text-sm"
            >
              📋 Game Sheets
            </button>
            <button
              onClick={() => setShowNotes(!showNotes)}
              className="rustic-button text-sm"
            >
              📝 Notes
            </button>
          </>
        )}
      </div>
    </div>
  );

  // Left panel - Character Sheet
  const leftPanel = gameStarted ? (
    <RusticCharacterSheet
      characterStats={characterStats}
      onEdit={() => setShowCharacterCreation(true)}
    />
  ) : (
    <div className="text-center text-gray-400 py-8">
      <div className="text-4xl mb-4">⚔️</div>
      <p className="text-lg mb-4">No Character Created</p>
      <p className="text-sm mb-4">Create a character to begin your adventure!</p>
      <button
        onClick={() => setShowCharacterCreation(true)}
        className="rustic-button"
      >
        🎭 Create Character
      </button>
    </div>
  );

  // Right panel - Game Tools and Notes
  const rightPanel = (
    <div className="space-y-4">
      <RusticGameTools
        onRollDice={handleRollDice}
        onShowGameSheets={() => setShowGameSheets(true)}
        onShowAISettings={() => setShowAISettings(true)}
        onShowCharacterCreation={() => setShowCharacterCreation(true)}
        selectedModel={selectedModel}
        availableModels={availableModels}
        onModelChange={setSelectedModel}
      />
      {showNotes && currentSession && (
        <GameNotes sessionId={currentSession.id} />
      )}
    </div>
  );

  // Main content - Chat
  const mainContent = (
    <div className="h-full flex flex-col">
      {/* Chat Header */}
      <div className="fantasy-card mb-4">
        <div className="flex items-center justify-between">
          <h2 className="rustic-title text-xl">🗣️ Adventure Chat</h2>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-green-400">AI Ready</span>
            {currentSession && (
              <span className="text-xs text-gray-400 ml-2">
                Session: {currentSession.id.slice(0, 8)}...
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto rustic-scrollbar mb-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="fantasy-card">
              <div className="text-4xl mb-4">⚔️</div>
              <h3 className="rustic-subtitle text-lg mb-2">Welcome, Adventurer!</h3>
              <p className="rustic-text text-sm">
                Your epic journey begins here. Tell the AI Dungeon Master what you'd like to do, 
                and let the adventure unfold!
              </p>
              <div className="mt-4 text-xs text-gray-400">
                <p>Try saying:</p>
                <p>• "I want to explore the forest"</p>
                <p>• "Roll for initiative"</p>
                <p>• "Show me my character sheet"</p>
              </div>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`message-card ${message.role} fade-in-up`}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  {message.role === 'user' ? (
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                      👤
                    </div>
                  ) : (
                    <div className="w-8 h-8 bg-dnd-gold rounded-full flex items-center justify-center text-dnd-darker font-bold">
                      🧙
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm font-bold text-dnd-gold">
                      {message.role === 'user' ? 'You' : 'Dungeon Master'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                    {message.isError && (
                      <span className="text-xs text-red-400">⚠️ Error</span>
                    )}
                  </div>
                  <div className="rustic-text text-sm leading-relaxed">
                    {message.content}
                  </div>
                  {message.isError && (
                    <button
                      onClick={() => {/* Retry logic */}}
                      className="mt-2 rustic-button text-xs"
                    >
                      🔄 Retry Request
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}

        {/* Loading Message */}
        {isLoading && (
          <div className="message-card ai fade-in-up">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-dnd-gold rounded-full flex items-center justify-center text-dnd-darker font-bold">
                🧙
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-sm font-bold text-dnd-gold">Dungeon Master</span>
                  <span className="text-xs text-gray-400">thinking...</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-dnd-gold rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-dnd-gold rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-dnd-gold rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <span className="text-sm text-gray-400 ml-2">The AI is crafting your adventure...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="fantasy-card">
        <form onSubmit={(e) => {
          e.preventDefault();
          if (inputMessage.trim() && !isLoading && gameStarted) {
            handleSendMessage(inputMessage.trim());
            setInputMessage('');
          }
        }} className="space-y-3">
          <div className="flex space-x-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={gameStarted ? "What would you like to do, adventurer?" : "Create a character to begin your adventure"}
              className="flex-1 rustic-input"
              disabled={isLoading || !gameStarted}
              suppressHydrationWarning
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading || !gameStarted}
              className="rustic-button px-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Sending...</span>
                </div>
              ) : (
                'Send'
              )}
            </button>
          </div>
          
          <div className="text-xs text-gray-400 text-center">
            Press Enter to send • Shift+Enter for new line
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <RusticGameLayout
      header={header}
      leftPanel={leftPanel}
      rightPanel={rightPanel}
    >
      {mainContent}
    </RusticGameLayout>
  );
};

export default EnhancedRusticAIDnDGame;


