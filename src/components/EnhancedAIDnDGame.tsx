'use client';

import React, { useState, useEffect, useRef } from 'react';
import { rollD20 } from '@/utils/dice';
import { generateScenario, generateOpeningMessage } from '@/utils/scenarioGenerator';
import EnhancedCharacterCreation from './EnhancedCharacterCreation';
import MultiplayerLobby from './MultiplayerLobby';
import SimpleGameSheets from './SimpleGameSheets';
import SimpleDiceRoll from './SimpleDiceRoll';
import RusticGameLayout from './RusticGameLayout';
import RusticCharacterSheet from './RusticCharacterSheet';
import RusticGameTools from './RusticGameTools';
import RusticChat from './RusticChat';

// Types
interface CharacterStats {
  name: string;
  race?: string;
  class?: string;
  background?: string;
  level?: number;
  hp: number;
  maxHp?: number;
  str: number;
  dex: number;
  int: number;
  con?: number;
  wis?: number;
  cha?: number;
  inventory: string;
  equippedItems?: string;
  spells?: string[];
  skills?: string[];
  specialAbilities?: string[];
  backstory?: string;
  attributes?: {
    str: number;
    dex: number;
    int: number;
    con: number;
    wis: number;
    cha: number;
  };
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  diceRoll?: number;
  timestamp: Date;
  isError?: boolean;
}

const EnhancedAIDnDGame: React.FC = () => {
  // State management
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCharacterCreation, setShowCharacterCreation] = useState(false);
  const [showMultiplayerLobby, setShowMultiplayerLobby] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [characterStats, setCharacterStats] = useState<CharacterStats>({
    name: 'Adventurer',
    hp: 20,
    maxHp: 20,
    str: 12,
    dex: 12,
    int: 12,
    con: 12,
    wis: 12,
    cha: 12,
    inventory: 'Basic equipment',
    equippedItems: 'None',
    spells: [],
    skills: [],
    specialAbilities: [],
    backstory: '',
    attributes: {
      str: 12,
      dex: 12,
      int: 12,
      con: 12,
      wis: 12,
      cha: 12
    }
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

  // Load available models
  const loadAvailableModels = async () => {
    try {
      const response = await fetch('/api/ai-status');
      const data = await response.json();
      if (data.models && data.models.length > 0) {
        setAvailableModels(data.models);
        if (!selectedModel && data.models.length > 0) {
          setSelectedModel(data.models[0].name);
        }
      }
    } catch (error) {
      console.error('Error loading models:', error);
    }
  };

  useEffect(() => {
    loadAvailableModels();
  }, []);

  // Character creation handler
  const handleCharacterCreated = (character: CharacterStats) => {
    setCharacterStats(character);
    setShowCharacterCreation(false);
    setGameStarted(true);
    
    // Generate opening message
    const openingMessage = generateOpeningMessage(character);
    setMessages([{
      id: Date.now().toString(),
      role: 'assistant',
      content: openingMessage,
      timestamp: new Date()
    }]);
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
          aiSettings
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

  // Retry request handler
  const handleRetryRequest = async () => {
    if (!lastFailedRequest) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/ai-dnd', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: lastFailedRequest.messages,
          characterStats: lastFailedRequest.characterStats,
          selectedModel: lastFailedRequest.selectedModel,
          aiSettings
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      // Remove the error message and add the successful response
      setMessages(prev => {
        const withoutError = prev.filter(msg => !msg.isError);
        return [...withoutError, {
          id: Date.now().toString(),
          role: 'assistant',
          content: data.message,
          timestamp: new Date()
        }];
      });

      setLastFailedRequest(null);

    } catch (error: any) {
      console.error('Error retrying request:', error);
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

  // Special command handler
  const handleSpecialCommand = (message: string) => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('character sheet') || lowerMessage.includes('show character')) {
      setShowGameSheets(true);
      return true;
    }
    
    return false;
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
        onClose={() => setShowMultiplayerLobby(false)}
        onJoinRoom={(roomId, userId) => {
          setCurrentRoomId(roomId);
          setCurrentUserId(userId);
          setShowMultiplayerLobby(false);
        }}
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
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => setShowCharacterCreation(true)}
          className="rustic-button text-sm"
        >
          ✨ Create Character
        </button>
        <button
          onClick={() => setShowMultiplayerLobby(true)}
          className="rustic-button text-sm"
        >
          👥 Multiplayer
        </button>
      </div>
    </div>
  );

  // Left panel - Character Sheet
  const leftPanel = (
    <RusticCharacterSheet
      characterStats={characterStats}
      onEdit={() => setShowCharacterCreation(true)}
    />
  );

  // Right panel - Game Tools
  const rightPanel = (
    <RusticGameTools
      onRollDice={handleRollDice}
      onShowGameSheets={() => setShowGameSheets(true)}
      onShowAISettings={() => setShowAISettings(true)}
      onShowCharacterCreation={() => setShowCharacterCreation(true)}
      selectedModel={selectedModel}
      availableModels={availableModels}
      onModelChange={setSelectedModel}
    />
  );

  // Main content - Chat
  const mainContent = (
    <RusticChat
      messages={messages}
      isLoading={isLoading}
      onSendMessage={handleSendMessage}
      onRetryRequest={handleRetryRequest}
      lastFailedRequest={lastFailedRequest}
    />
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

export default EnhancedAIDnDGame;


