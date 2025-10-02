'use client';

import React, { useState, useRef, useEffect } from 'react';
import { CharacterStats, Message } from '../types/index';
import AdvancedDiceRoller from '../components/AdvancedDiceRoller';
import InventorySystem, { InventorySystemRef } from '../components/InventorySystem';
import ActionLog from '../components/ActionLog';
import DiceRoller from '../components/DiceRoller';
import DiceRoller3D from '../components/DiceRoller3D';

interface ActionLogEntry {
  id: string;
  type: 'damage' | 'heal' | 'xp' | 'level' | 'item' | 'stat' | 'gold' | 'death';
  message: string;
  timestamp: Date;
  icon: string;
}
import CombatSystem from '../components/CombatSystem';
import CharacterProgression from '../components/CharacterProgression';
import SupabaseAuthModal from '../components/SupabaseAuthModal';
import SupabaseCharacterSelector from '../components/SupabaseCharacterSelector';
import HomePage from '../components/HomePage';
import AICharacterCreation from '../components/AICharacterCreation';
import QuestSystem, { Quest } from '../components/QuestSystem';
import { authService, characterService, getSupabase } from '../lib/supabase-auth';
import { adventureService } from '../lib/adventure-service';
import MultiplayerLobby from '../components/MultiplayerLobby';
import MultiplayerGameWithAI from '../components/MultiplayerGameWithAI';
import GameModeSelector from '../components/GameModeSelector';

export default function Home() {
  // UI Update - Force refresh
  const [messages, setMessages] = useState<Message[]>([]);
  
  // Dice rolling state
  const [diceRolling, setDiceRolling] = useState(false);
  const [currentDice, setCurrentDice] = useState('');
  const [showDiceResult, setShowDiceResult] = useState(false);
  const [diceResult, setDiceResult] = useState<{result: number, rolls: number[]} | null>(null);
  
  // Handle dice roll completion
  const handleDiceRollComplete = (result: number, rolls: number[]) => {
    setDiceRolling(false);
    setDiceResult({result, rolls});
    setShowDiceResult(true);
    // Add dice roll result to action log
    addActionLogEntry('stat', `Dice Roll: ${currentDice} = ${result} (${rolls.join(', ')})`, '🎲');
  };

  // Handle dice roller close
  const handleDiceClose = () => {
    setDiceRolling(false);
    setShowDiceResult(false);
    setCurrentDice('');
    setDiceResult(null);
  };

  // Handle combat action
  const handleCombatAction = async (action: string) => {
    if (combatTurn !== 'player' || waitingForEnemyTurn) return;
    
    // Add action to combat log
    setCombatLog(prev => [...prev, `You ${action.toLowerCase()}.`]);
    
    // Send action to AI
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: `I ${action.toLowerCase()}`,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    
    // Set waiting state
    setWaitingForEnemyTurn(true);
    
    // Call AI
    try {
      const response = await fetch('/api/ai-dnd', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          characterStats,
          inventory,
          isInCombat: true,
          combatTurn: 'player'
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      // Process AI response
      const responseText = data.response || data.message || '';
      
      // Add AI response to messages
      const aiMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: responseText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
      
      // Check for dice rolls
      if (responseText.includes('[DICE:')) {
        try {
          const diceMatch = responseText.match(/\[DICE:([^\]]+)\]/);
          if (diceMatch && diceMatch[1]) {
            const diceString = diceMatch[1];
            setCurrentDice(diceString);
            setDiceRolling(true);
          }
        } catch (error) {
          console.error('Error parsing dice data:', error);
        }
      }
      
      // Check for turn change
      if (responseText.includes('[TURN:enemy]')) {
        setCombatTurn('enemy');
        setWaitingForEnemyTurn(false);
        // Trigger enemy turn after a short delay
        setTimeout(() => {
          triggerEnemyTurn();
        }, 2000);
      } else if (responseText.includes('[TURN:player]')) {
        setCombatTurn('player');
        setWaitingForEnemyTurn(false);
      }
      
      // Check for combat end
      if (responseText.includes('[COMBAT_END]')) {
        endCombat(true);
      }
      
    } catch (error) {
      console.error('Error in combat action:', error);
      setWaitingForEnemyTurn(false);
    }
  };

  // Trigger enemy turn
  const triggerEnemyTurn = async () => {
    if (combatTurn !== 'enemy') return;
    
    setCombatLog(prev => [...prev, `${enemyStats.name} takes their turn...`]);
    
    try {
      const response = await fetch('/api/ai-dnd', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'enemy turn' }],
          characterStats,
          inventory,
          isInCombat: true,
          combatTurn: 'enemy',
          enemyStats
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      const responseText = data.response || data.message || '';
      
      // Add AI response to messages
      const aiMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: responseText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
      
      // Check for dice rolls
      if (responseText.includes('[DICE:')) {
        try {
          const diceMatch = responseText.match(/\[DICE:([^\]]+)\]/);
          if (diceMatch && diceMatch[1]) {
            const diceString = diceMatch[1];
            setCurrentDice(diceString);
            setDiceRolling(true);
          }
        } catch (error) {
          console.error('Error parsing dice data:', error);
        }
      }
      
      // Check for turn change back to player
      if (responseText.includes('[TURN:player]')) {
        setCombatTurn('player');
        setCombatRound(prev => prev + 1);
      }
      
      // Check for combat end
      if (responseText.includes('[COMBAT_END]')) {
        endCombat(true);
      }
      
    } catch (error) {
      console.error('Error in enemy turn:', error);
      // Fallback: switch back to player turn
      setCombatTurn('player');
    }
  };

  // End combat
  const endCombat = (victory: boolean) => {
    setIsInCombat(false);
    setEnemyStats(null);
    setCombatTurn('player');
    setCombatLog([]);
    setCombatRound(1);
    setWaitingForEnemyTurn(false);
    setActiveTab('chat');
    
    const combatMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: victory 
        ? `🎉 Victory! You have defeated your enemy!`
        : `💀 Defeat! You have been defeated in combat.`,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, combatMessage]);
  };

  // Add global styles to prevent overflow
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      * {
        box-sizing: border-box;
        max-width: 100%;
      }
      html, body {
        width: 100%;
        max-width: 100vw;
        overflow-x: hidden;
        margin: 0;
        padding: 0;
        background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
        min-height: 100vh;
        word-wrap: break-word;
        overflow-wrap: break-word;
        word-break: break-word;
        position: relative;
      }
      #__next {
        width: 100%;
        max-width: 100vw;
        overflow-x: hidden;
        position: relative;
      }
      @media (max-width: 1023px) {
        * {
          max-width: 100vw !important;
        }
        div, section, main, article {
          overflow-x: hidden !important;
        }
      }
      div, span, p, h1, h2, h3, h4, h5, h6 {
        word-wrap: break-word;
        overflow-wrap: break-word;
        hyphens: auto;
        -webkit-hyphens: auto;
        -ms-hyphens: auto;
      }
      .character-stats * {
        word-break: normal !important;
        white-space: normal !important;
      }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(139, 92, 246, 0.3); }
          50% { box-shadow: 0 0 40px rgba(139, 92, 246, 0.6), 0 0 60px rgba(236, 72, 153, 0.4); }
        }
        .floating-particle {
          position: absolute;
          width: 3px;
          height: 3px;
          background: radial-gradient(circle, rgba(139, 92, 246, 0.6) 0%, transparent 70%);
          border-radius: 50%;
          animation: float 8s ease-in-out infinite;
        }
        .glow-on-event {
          animation: glow 2s ease-in-out;
        }
    `;
    document.head.appendChild(style);
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  // Debug: Check for overflow
  useEffect(() => {
    const checkOverflow = () => {
      if (window.innerWidth < 1024) {
        const body = document.body;
        const html = document.documentElement;
        console.log('Debug - Body width:', body.scrollWidth, 'vs viewport:', window.innerWidth);
        console.log('Debug - HTML width:', html.scrollWidth, 'vs viewport:', window.innerWidth);
        
        if (body.scrollWidth > window.innerWidth || html.scrollWidth > window.innerWidth) {
          console.log('OVERFLOW DETECTED!');
          // Find elements causing overflow
          const allElements = document.querySelectorAll('*');
          allElements.forEach((el: any) => {
            if (el.scrollWidth > window.innerWidth) {
              console.log('Overflow element:', el, 'Width:', el.scrollWidth);
            }
          });
        }
      }
    };
    
    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [messages]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCharacterCreation, setShowCharacterCreation] = useState(false);
  const [showAICharacterCreation, setShowAICharacterCreation] = useState(false);
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
    gold: 50, // Starting gold
    proficiencyBonus: 2,
    skills: [],
    abilities: [],
    spells: [],
    inventory: 'Basic equipment',
    isDead: false // Add death state
  });

  const [activeTab, setActiveTab] = useState<'chat' | 'character' | 'inventory' | 'combat' | 'quests' | 'actions'>('chat');
  const [inventory, setInventory] = useState<any[]>([
    {
      id: '1',
      name: 'Iron Sword',
      type: 'weapon',
      rarity: 'common',
      value: 10,
      weight: 3,
      description: 'A sturdy iron sword, reliable in combat.',
      quantity: 1,
      equipped: true,
      stats: { damage: '1d8+1' }
    },
    {
      id: '2',
      name: 'Leather Armor',
      type: 'armor',
      rarity: 'common',
      value: 10,
      weight: 10,
      description: 'Basic leather armor providing minimal protection.',
      quantity: 1,
      equipped: true,
      stats: { armor: 1 }
    },
    {
      id: '3',
      name: 'Health Potion',
      type: 'consumable',
      rarity: 'common',
      value: 25,
      weight: 0.5,
      description: 'A red potion that restores 2d4+2 hit points.',
      quantity: 3,
      stats: { bonus: 2 }
    },
    {
      id: '4',
      name: 'Rope (50ft)',
      type: 'tool',
      rarity: 'common',
      value: 2,
      weight: 10,
      description: 'Strong hemp rope, useful for climbing and binding.',
      quantity: 1
    },
    {
      id: '5',
      name: 'Torch',
      type: 'tool',
      rarity: 'common',
      value: 1,
      weight: 1,
      description: 'A wooden torch that burns for 1 hour.',
      quantity: 5
    }
  ]);
  const [actionLog, setActionLog] = useState<ActionLogEntry[]>([]);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [processedItems, setProcessedItems] = useState<Set<string>>(new Set());
  
  // Authentication state
  const [user, setUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCharacterSelector, setShowCharacterSelector] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<any>(null);
  const [showHomePage, setShowHomePage] = useState(true);
  
  // Multiplayer state
  const [showMultiplayerLobby, setShowMultiplayerLobby] = useState(false);
  const [showMultiplayerGameRoom, setShowMultiplayerGameRoom] = useState(false);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  
  // Game mode state
  const [showGameModeSelector, setShowGameModeSelector] = useState(false);
  const [gameMode, setGameMode] = useState<'single' | 'multiplayer' | null>(null);
  const [userHasChosenMode, setUserHasChosenMode] = useState(false);
  
  // Quest system state
  const [quests, setQuests] = useState<Quest[]>([]);
  const [showQuestPopup, setShowQuestPopup] = useState(false);
  const [pendingQuest, setPendingQuest] = useState<Quest | null>(null);
  const [isQuestWindowMinimized, setIsQuestWindowMinimized] = useState(false);
  
  // Combat system state
  const [isInCombat, setIsInCombat] = useState(false);
  const [combatTurn, setCombatTurn] = useState<'player' | 'enemy'>('player');
  const [enemyStats, setEnemyStats] = useState<any>(null);
  const [combatActions, setCombatActions] = useState<string[]>([]);
  const [combatLog, setCombatLog] = useState<string[]>([]);
  const [playerInitiative, setPlayerInitiative] = useState<number>(0);
  const [enemyInitiative, setEnemyInitiative] = useState<number>(0);
  const [combatRound, setCombatRound] = useState<number>(1);
  const [waitingForEnemyTurn, setWaitingForEnemyTurn] = useState(false);
  
  // Refs for auto-scrolling and inventory
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inventoryRef = useRef<InventorySystemRef>(null);

  const addActionLogEntry = (type: ActionLogEntry['type'], message: string, icon: string) => {
    // Check for duplicates within the last 10 entries to prevent spam
    setActionLog(prev => {
      const recentEntries = prev.slice(0, 10);
      const isDuplicate = recentEntries.some(entry => 
        entry.type === type && 
        entry.message === message && 
        entry.icon === icon &&
        // Check if the timestamp is within the last 5 seconds (same session)
        (Date.now() - entry.timestamp.getTime()) < 5000
      );
      
      if (isDuplicate) {
        console.log('Preventing duplicate action log entry:', message);
        return prev; // Don't add duplicate
      }
      
      const entry: ActionLogEntry = {
        id: Date.now().toString(),
        type,
        message,
        timestamp: new Date(),
        icon
      };
      return [entry, ...prev.slice(0, 49)]; // Keep last 50 entries
    });
  };

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  // Check if user has scrolled up to show scroll button
  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom);
    }
  };

  // Class starting equipment system
  const getClassStartingEquipment = (className: string): Array<{ name: string; type: string; rarity: string; value: number; weight: number; quantity: number }> => {
    const classEquipment: { [key: string]: Array<{ name: string; type: string; rarity: string; value: number; weight: number; quantity: number }> } = {
      'Fighter': [
        { name: 'Longsword', type: 'weapon', rarity: 'common', value: 15, weight: 3, quantity: 1 },
        { name: 'Shield', type: 'armor', rarity: 'common', value: 10, weight: 6, quantity: 1 },
        { name: 'Chain Mail', type: 'armor', rarity: 'common', value: 75, weight: 55, quantity: 1 },
        { name: 'Crossbow', type: 'weapon', rarity: 'common', value: 25, weight: 5, quantity: 1 },
        { name: 'Crossbow Bolts', type: 'ammunition', rarity: 'common', value: 1, weight: 0.05, quantity: 20 }
      ],
      'Wizard': [
        { name: 'Quarterstaff', type: 'weapon', rarity: 'common', value: 2, weight: 4, quantity: 1 },
        { name: 'Component Pouch', type: 'misc', rarity: 'common', value: 25, weight: 2, quantity: 1 },
        { name: 'Scholar\'s Pack', type: 'misc', rarity: 'common', value: 40, weight: 8, quantity: 1 },
        { name: 'Spellbook', type: 'misc', rarity: 'common', value: 50, weight: 3, quantity: 1 }
      ],
      'Rogue': [
        { name: 'Rapier', type: 'weapon', rarity: 'common', value: 25, weight: 2, quantity: 1 },
        { name: 'Shortbow', type: 'weapon', rarity: 'common', value: 25, weight: 2, quantity: 1 },
        { name: 'Arrows', type: 'ammunition', rarity: 'common', value: 1, weight: 0.05, quantity: 20 },
        { name: 'Leather Armor', type: 'armor', rarity: 'common', value: 10, weight: 10, quantity: 1 },
        { name: 'Thieves\' Tools', type: 'misc', rarity: 'common', value: 25, weight: 1, quantity: 1 }
      ],
      'Cleric': [
        { name: 'Mace', type: 'weapon', rarity: 'common', value: 5, weight: 4, quantity: 1 },
        { name: 'Shield', type: 'armor', rarity: 'common', value: 10, weight: 6, quantity: 1 },
        { name: 'Scale Mail', type: 'armor', rarity: 'common', value: 50, weight: 45, quantity: 1 },
        { name: 'Holy Symbol', type: 'misc', rarity: 'common', value: 5, weight: 1, quantity: 1 },
        { name: 'Priest\'s Pack', type: 'misc', rarity: 'common', value: 19, weight: 24, quantity: 1 }
      ],
      'Ranger': [
        { name: 'Longsword', type: 'weapon', rarity: 'common', value: 15, weight: 3, quantity: 1 },
        { name: 'Longbow', type: 'weapon', rarity: 'common', value: 50, weight: 2, quantity: 1 },
        { name: 'Arrows', type: 'ammunition', rarity: 'common', value: 1, weight: 0.05, quantity: 20 },
        { name: 'Leather Armor', type: 'armor', rarity: 'common', value: 10, weight: 10, quantity: 1 },
        { name: 'Explorer\'s Pack', type: 'misc', rarity: 'common', value: 10, weight: 59, quantity: 1 }
      ],
      'Paladin': [
        { name: 'Longsword', type: 'weapon', rarity: 'common', value: 15, weight: 3, quantity: 1 },
        { name: 'Shield', type: 'armor', rarity: 'common', value: 10, weight: 6, quantity: 1 },
        { name: 'Chain Mail', type: 'armor', rarity: 'common', value: 75, weight: 55, quantity: 1 },
        { name: 'Holy Symbol', type: 'misc', rarity: 'common', value: 5, weight: 1, quantity: 1 },
        { name: 'Priest\'s Pack', type: 'misc', rarity: 'common', value: 19, weight: 24, quantity: 1 }
      ],
      'Barbarian': [
        { name: 'Greataxe', type: 'weapon', rarity: 'common', value: 30, weight: 7, quantity: 1 },
        { name: 'Handaxe', type: 'weapon', rarity: 'common', value: 5, weight: 2, quantity: 2 },
        { name: 'Javelin', type: 'weapon', rarity: 'common', value: 5, weight: 2, quantity: 4 },
        { name: 'Explorer\'s Pack', type: 'misc', rarity: 'common', value: 10, weight: 59, quantity: 1 }
      ],
      'Bard': [
        { name: 'Rapier', type: 'weapon', rarity: 'common', value: 25, weight: 2, quantity: 1 },
        { name: 'Lute', type: 'misc', rarity: 'common', value: 35, weight: 2, quantity: 1 },
        { name: 'Leather Armor', type: 'armor', rarity: 'common', value: 10, weight: 10, quantity: 1 },
        { name: 'Entertainer\'s Pack', type: 'misc', rarity: 'common', value: 40, weight: 38, quantity: 1 }
      ],
      'Sorcerer': [
        { name: 'Dagger', type: 'weapon', rarity: 'common', value: 2, weight: 1, quantity: 2 },
        { name: 'Component Pouch', type: 'misc', rarity: 'common', value: 25, weight: 2, quantity: 1 },
        { name: 'Dungeoneer\'s Pack', type: 'misc', rarity: 'common', value: 12, weight: 61.5, quantity: 1 }
      ],
      'Warlock': [
        { name: 'Light Crossbow', type: 'weapon', rarity: 'common', value: 25, weight: 5, quantity: 1 },
        { name: 'Crossbow Bolts', type: 'ammunition', rarity: 'common', value: 1, weight: 0.05, quantity: 20 },
        { name: 'Component Pouch', type: 'misc', rarity: 'common', value: 25, weight: 2, quantity: 1 },
        { name: 'Scholar\'s Pack', type: 'misc', rarity: 'common', value: 40, weight: 8, quantity: 1 }
      ],
      'Druid': [
        { name: 'Scimitar', type: 'weapon', rarity: 'common', value: 25, weight: 3, quantity: 1 },
        { name: 'Leather Armor', type: 'armor', rarity: 'common', value: 10, weight: 10, quantity: 1 },
        { name: 'Shield', type: 'armor', rarity: 'common', value: 10, weight: 6, quantity: 1 },
        { name: 'Explorer\'s Pack', type: 'misc', rarity: 'common', value: 10, weight: 59, quantity: 1 },
        { name: 'Druidic Focus', type: 'misc', rarity: 'common', value: 1, weight: 0, quantity: 1 }
      ],
      'Monk': [
        { name: 'Shortsword', type: 'weapon', rarity: 'common', value: 10, weight: 2, quantity: 1 },
        { name: 'Dart', type: 'weapon', rarity: 'common', value: 5, weight: 0.25, quantity: 10 },
        { name: 'Explorer\'s Pack', type: 'misc', rarity: 'common', value: 10, weight: 59, quantity: 1 }
      ],
      'Artificer': [
        { name: 'Light Crossbow', type: 'weapon', rarity: 'common', value: 25, weight: 5, quantity: 1 },
        { name: 'Crossbow Bolts', type: 'ammunition', rarity: 'common', value: 1, weight: 0.05, quantity: 20 },
        { name: 'Scale Mail', type: 'armor', rarity: 'common', value: 50, weight: 45, quantity: 1 },
        { name: 'Thieves\' Tools', type: 'misc', rarity: 'common', value: 25, weight: 1, quantity: 1 },
        { name: 'Dungeoneer\'s Pack', type: 'misc', rarity: 'common', value: 12, weight: 61.5, quantity: 1 }
      ]
    };
    
    return classEquipment[className] || [];
  };

  // Combat system functions
  const getClassCombatActions = (className: string) => {
    const classActions: { [key: string]: string[] } = {
      'Fighter': ['Attack', 'Second Wind', 'Action Surge', 'Defend'],
      'Wizard': ['Attack', 'Cast Spell', 'Use Item', 'Dodge'],
      'Rogue': ['Attack', 'Sneak Attack', 'Use Item', 'Hide'],
      'Cleric': ['Attack', 'Cast Spell', 'Heal', 'Turn Undead'],
      'Ranger': ['Attack', 'Hunter\'s Mark', 'Use Item', 'Dodge'],
      'Paladin': ['Attack', 'Divine Smite', 'Lay on Hands', 'Cast Spell'],
      'Barbarian': ['Attack', 'Rage', 'Reckless Attack', 'Intimidate'],
      'Bard': ['Attack', 'Bardic Inspiration', 'Cast Spell', 'Use Item'],
      'Sorcerer': ['Attack', 'Cast Spell', 'Metamagic', 'Use Item'],
      'Warlock': ['Attack', 'Eldritch Blast', 'Cast Spell', 'Use Item'],
      'Druid': ['Attack', 'Wild Shape', 'Cast Spell', 'Use Item'],
      'Monk': ['Attack', 'Flurry of Blows', 'Stunning Strike', 'Dodge'],
      'Artificer': ['Attack', 'Infuse Item', 'Cast Spell', 'Use Item']
    };
    return classActions[className] || ['Attack', 'Use Item', 'Dodge'];
  };

  // AI now controls all enemy creation through [ENEMY:] tags
  // No more hardcoded enemy templates - AI creates dynamic enemies

  const startCombatWithEnemy = (enemyData: any) => {
    console.log('Starting combat with enemy:', enemyData);
    // Ensure enemy has maxHp if not provided
    const enemy = {
      ...enemyData,
      maxHp: enemyData.maxHp || enemyData.hp
    };
    setEnemyStats(enemy);
    setCombatActions(getClassCombatActions(characterStats.class || 'Fighter'));
    setCombatTurn('player');
    setIsInCombat(true);
    setCombatLog([`Combat begins! You encounter a ${enemy.name}!`]);
  };


  const rollDamage = (damageDice: string) => {
    // Parse dice notation like "1d4", "2d6+1", "1d8+2"
    const match = damageDice.match(/(\d+)d(\d+)([+-]\d+)?/);
    if (!match) return 1;
    
    const numDice = parseInt(match[1]);
    const dieSize = parseInt(match[2]);
    const modifier = match[3] ? parseInt(match[3]) : 0;
    
    let damage = 0;
    for (let i = 0; i < numDice; i++) {
      damage += Math.floor(Math.random() * dieSize) + 1;
    }
    damage += modifier;
    
    return Math.max(1, damage);
  };

  const handleEnemyAttack = () => {
    if (!enemyStats || !isInCombat) return;

    // Roll enemy attack (enemy gets +2 bonus to hit)
    const enemyAttackRoll = Math.floor(Math.random() * 20) + 1 + 2;
    const playerAC = 10 + (characterStats.dex || 0);
    setCombatLog(prev => [...prev, `The ${enemyStats.name} rolls ${enemyAttackRoll} to hit (need ${playerAC})`]);
    
    if (enemyAttackRoll >= playerAC) {
      // Hit - roll damage based on enemy's damage dice
      const enemyDamage = rollDamage(enemyStats.damage || '1d4');
      setCombatLog(prev => [...prev, `The ${enemyStats.name} rolls ${enemyDamage} damage!`]);
      setCharacterStats(prev => ({
        ...prev,
        hp: Math.max(0, prev.hp - enemyDamage)
      }));
      setCombatLog(prev => [...prev, `The ${enemyStats.name} attacks and hits for ${enemyDamage} damage!`]);
      addActionLogEntry('damage', `Enemy attack: -${enemyDamage} HP`, '⚔️');
      
      // Check if player is defeated
      if (characterStats.hp - enemyDamage <= 0) {
        setCombatLog(prev => [...prev, `You are defeated!`]);
        endCombat(false);
        return;
      }
    } else {
      setCombatLog(prev => [...prev, `The ${enemyStats.name} attacks but misses!`]);
    }

    // Switch back to player turn
    setCombatTurn('player');
    setCombatLog(prev => [...prev, `The ${enemyStats.name} has finished their turn. It's your turn now.`]);
  };

  const performCombatAction = (action: string) => {
    console.log('performCombatAction called:', { action, isInCombat, combatTurn, enemyStats });
    if (!isInCombat || combatTurn !== 'player' || !enemyStats) {
      console.log('Combat action blocked:', { isInCombat, combatTurn, enemyStats });
      return;
    }
    
    // Send combat action to AI instead of handling locally
    let combatMessage = '';
    
    if (action === 'Attack') {
      combatMessage = `I attack the ${enemyStats.name} with my weapon.`;
    } else if (action === 'Cast Spell') {
      combatMessage = `I cast a spell at the ${enemyStats.name}.`;
    } else if (action === 'Use Item') {
      combatMessage = `I use an item from my inventory.`;
    } else if (action === 'Dodge') {
      combatMessage = `I dodge and try to avoid the ${enemyStats.name}'s attacks.`;
    } else {
      combatMessage = `I attempt to ${action.toLowerCase()} against the ${enemyStats.name}.`;
    }
    
    // Add the combat message to the chat
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: combatMessage,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // Update combat log
    setCombatLog(prev => [...prev, `You ${action.toLowerCase()} against the ${enemyStats.name}.`]);
    
    // Set to enemy turn and send to AI
    setCombatTurn('enemy');
    
    // Send the message to AI
    handleSendMessage(combatMessage);
  };


  // Quest management functions
  const handleAcceptQuest = (quest: Quest) => {
    console.log('handleAcceptQuest called with:', quest);
    const newQuest = { ...quest, status: 'active' as const };
    setQuests(prev => {
      const updated = [...prev, newQuest];
      console.log('Updated quests array:', updated);
      return updated;
    });
    addActionLogEntry('item', `Accepted quest: ${quest.title}`, '📜');
  };

  const handleDeclineQuest = (questId: string) => {
    addActionLogEntry('item', 'Declined quest offer', '❌');
  };

  const handleUpdateQuest = (questId: string, updates: Partial<Quest>) => {
    setQuests(prev => prev.map(quest => 
      quest.id === questId ? { ...quest, ...updates } : quest
    ));
  };

  const handleCompleteQuest = (questId: string) => {     
    const quest = quests.find(q => q.id === questId);    
    if (quest) {
      handleUpdateQuest(questId, {
        status: 'completed',
        completedAt: new Date()
      });

      // Award XP and gold
      setCharacterStats(prev => ({
        ...prev,
        xp: (prev.xp || 0) + quest.xpReward,
        gold: (prev.gold || 0) + (quest.goldReward || 0) 
      }));

      addActionLogEntry('xp', `Completed quest: ${quest.title} (+${quest.xpReward} XP)`, '✅');
      
      // Send quest completion message to AI
      const completionMessage = `I have completed the quest "${quest.title}". ${quest.description}`;
      handleSendMessage(completionMessage);
      if (quest.goldReward) {
        addActionLogEntry('gold', `Quest reward: +${quest.goldReward} gold`, '🪙');
      }
    }
  };

  const showQuestOffer = (quest: Quest) => {
    console.log('showQuestOffer called with:', quest);
    setPendingQuest(quest);
    setShowQuestPopup(true);
    console.log('Quest popup state set to true');
  };

  // Function to trigger glow effect on specific elements
  const triggerGlowEffect = (elementId: string) => {
    const element = document.getElementById(elementId);
    if (element) {
      element.classList.add('glow-on-event');
      setTimeout(() => {
        element.classList.remove('glow-on-event');
      }, 2000);
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Debug quest popup state
  useEffect(() => {
    console.log('Quest popup state changed:', showQuestPopup, 'Pending quest:', pendingQuest);
  }, [showQuestPopup, pendingQuest]);

  // Auto-save adventure session when messages or character stats change
  useEffect(() => {
    console.log('Auto-save useEffect triggered:', {
      hasUser: !!user,
      hasSelectedCharacter: !!selectedCharacter,
      messagesLength: messages.length,
      characterStats: characterStats.name,
      inventoryLength: inventory.length
    });
    
    if (user && selectedCharacter && messages.length > 0) {
      const saveSession = async () => {
        try {
          const sessionData = {
            messages,
            characterStats,
            inventory,
            quests,
            lastSaved: new Date().toISOString()
          };
          
          console.log('Auto-saving session data:', {
            userId: user.id,
            characterId: selectedCharacter.id,
            messagesCount: messages.length,
            characterName: characterStats.name,
            inventoryCount: inventory.length
          });
          
          await adventureService.saveAdventureSession(user.id, selectedCharacter.id, sessionData);
          console.log('✅ Adventure session auto-saved successfully');
        } catch (error) {
          console.error('❌ Error auto-saving adventure session:', error);
        }
      };

      // Debounce auto-save to avoid too many saves (reduced to 1 second for better reliability)
      const timeoutId = setTimeout(saveSession, 1000);
      return () => clearTimeout(timeoutId);
    } else {
      console.log('Auto-save skipped - missing requirements:', {
        user: !!user,
        selectedCharacter: !!selectedCharacter,
        messagesLength: messages.length
      });
    }
  }, [messages, characterStats, inventory, quests, user, selectedCharacter]);

  // Save on page unload to prevent data loss
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (user && selectedCharacter && messages.length > 0) {
        // Use sendBeacon for reliable saving on page unload
        const sessionData = {
          messages,
          characterStats,
          inventory,
          quests,
          lastSaved: new Date().toISOString()
        };
        
        const data = JSON.stringify({
          userId: user.id,
          characterId: selectedCharacter.id,
          sessionData
        });
        
        // Try to save using sendBeacon (more reliable for page unload)
        if (navigator.sendBeacon) {
          const blob = new Blob([data], { type: 'application/json' });
          navigator.sendBeacon('/api/save-adventure', blob);
          console.log('Adventure session saved on page unload via sendBeacon');
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user, selectedCharacter, messages, characterStats, inventory, quests]);

  // Function to clean up Action Log entries that don't match inventory
  const cleanupActionLog = () => {
    setActionLog(prev => {
      const inventoryItemNames = inventory.map(item => item.name.toLowerCase());
      return prev.filter(entry => {
        if (entry.type === 'item' && entry.message.startsWith('Found ')) {
          const itemName = entry.message.replace('Found ', '').toLowerCase();
          const hasItem = inventoryItemNames.some(invName => invName.includes(itemName) || itemName.includes(invName));
          if (!hasItem) {
            console.log('Removing Action Log entry for item not in inventory:', entry.message);
            return false;
          }
        }
        return true;
      });
    });
  };

  // Clean up Action Log when inventory changes
  useEffect(() => {
    cleanupActionLog();
  }, [inventory]);

  // Manual save function
  const saveAdventure = async () => {
    if (user && selectedCharacter && messages.length > 0) {
      try {
        const sessionData = {
          messages,
          characterStats,
          inventory,
          quests,
          lastSaved: new Date().toISOString()
        };
        
        await adventureService.saveAdventureSession(user.id, selectedCharacter.id, sessionData);
        console.log('Adventure session manually saved');
        
        // Show success message
        const successMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: '💾 Adventure saved successfully!',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, successMessage]);
      } catch (error) {
        console.error('Error manually saving adventure session:', error);
        
        // Show error message
        const errorMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: '❌ Failed to save adventure. Please try again.',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    }
  };

  // Load user session on app startup
  useEffect(() => {
    const loadUserSession = async () => {
      if (user && !selectedCharacter) {
        console.log('Loading user session on startup...');
        try {
          // Get user's characters
          const { data: characters, error } = await getSupabase()
            .from('characters')
            .select('*')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false })
            .limit(1);

          if (error) {
            console.error('Error loading characters:', error);
            return;
          }

          if (characters && characters.length > 0) {
            const lastCharacter = characters[0];
            console.log('Found last character:', lastCharacter);
            
            // Set the character
            setSelectedCharacter(lastCharacter);
            
            // Load the adventure session
            const session = await adventureService.loadAdventureSession(lastCharacter.id);
            if (session && session.session_data) {
              console.log('Loading existing adventure session on startup:', session.session_data);
              
              // Restore messages
              if (session.session_data.messages) {
                const messagesWithDates = session.session_data.messages.map((msg: any) => ({
                  ...msg,
                  timestamp: new Date(msg.timestamp)
                }));
                setMessages(messagesWithDates);
              }
              
              // Restore character stats
              if (session.session_data.characterStats) {
                setCharacterStats(session.session_data.characterStats);
              }
              
              // Restore inventory
              if (session.session_data.inventory) {
                setInventory(session.session_data.inventory);
              }
              
              // Restore quests
              if (session.session_data.quests) {
                console.log('Loading saved quests on startup:', session.session_data.quests);
                const questsWithDates = session.session_data.quests.map((quest: any) => ({
                  ...quest,
                  createdAt: new Date(quest.createdAt),
                  completedAt: quest.completedAt ? new Date(quest.completedAt) : undefined
                }));
                setQuests(questsWithDates);
              }
              
              console.log('Session restored successfully on startup');
            }
          }
        } catch (error) {
          console.error('Error loading user session:', error);
        }
      }
    };

    loadUserSession();
  }, [user]);

  // Keyboard shortcuts for better PC navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when not typing in input fields
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Ctrl/Cmd + number keys for tab switching
      if ((event.ctrlKey || event.metaKey) && event.key >= '1' && event.key <= '5') {
        event.preventDefault();
        const tabIndex = parseInt(event.key) - 1;
        const tabs = ['chat', 'character', 'inventory', 'combat', 'actions'];
        if (tabs[tabIndex]) {
          setActiveTab(tabs[tabIndex] as any);
        }
      }

      // Ctrl/Cmd + S for save
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        saveAdventure();
      }

      // Escape to go back to chat
      if (event.key === 'Escape') {
        setActiveTab('chat');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveAdventure]);

  // Scroll to bottom when loading state changes
  useEffect(() => {
    if (isLoading) {
      scrollToBottom();
    }
  }, [isLoading]);

  // Check for existing authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await authService.getCurrentUser();
        if (user) {
          setUser(user);
          // Only show game mode selector if user hasn't chosen a mode yet
          if (!userHasChosenMode) {
            setShowHomePage(false);
            setShowGameModeSelector(true);
            setShowCharacterSelector(false);
            setShowCharacterCreation(false);
          }
          // If user has chosen a mode, let them stay where they are
        } else {
          setShowHomePage(true);
          setUserHasChosenMode(false); // Reset choice when logged out
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        setShowHomePage(true);
        setUserHasChosenMode(false); // Reset choice on error
      }
    };

    checkAuth();

    // Listen for auth state changes
    const { data: { subscription } } = authService.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        // Only show game mode selector if user hasn't chosen a mode yet
        if (!userHasChosenMode) {
          setShowHomePage(false);
          setShowGameModeSelector(true);
          setShowCharacterSelector(false);
          setShowCharacterCreation(false);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setShowHomePage(true);
        setShowGameModeSelector(false);
        setShowCharacterSelector(false);
        setShowCharacterCreation(false);
        setShowMultiplayerLobby(false);
        setMessages([]);
        setUserHasChosenMode(false); // Reset choice when signed out
      }
    });

    return () => subscription.unsubscribe();
  }, [userHasChosenMode]);

  const handleLogout = async () => {
    try {
      await authService.signOut();
      setUser(null);
      setSelectedCharacter(null);
      setShowHomePage(true);
      setShowGameModeSelector(false);
      setShowCharacterSelector(false);
      setShowCharacterCreation(false);
      setShowMultiplayerLobby(false);
      setShowMultiplayerGameRoom(false);
      setGameMode(null);
      setCurrentRoomId(null);
      setMessages([]);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleCharacterSelect = async (character: any) => {
    setSelectedCharacter(character);
    setCharacterStats({
      name: character.name,
      race: character.race,
      class: character.class,
      level: character.level,
      xp: character.xp,
      hp: character.hp,
      maxHp: character.max_hp,
      str: character.str,
      dex: character.dex,
      int: character.int,
      con: character.con,
      wis: character.wis,
      cha: character.cha,
      proficiencyBonus: character.proficiency_bonus,
      skills: character.skills || [],
      abilities: character.abilities || [],
      spells: character.spells || [],
      inventory: character.inventory || 'Basic equipment'
    });
    setShowCharacterSelector(false);
    setShowCharacterCreation(false);

    // Load existing adventure session
    try {
      const session = await adventureService.loadAdventureSession(character.id);
      if (session && session.session_data) {
        console.log('Loading existing adventure session:', session.session_data);
        if (session.session_data.messages) {
          // Convert timestamp strings back to Date objects
          const messagesWithDates = session.session_data.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }));
          setMessages(messagesWithDates);
        }
        if (session.session_data.characterStats) {
          setCharacterStats(prev => ({ ...prev, ...session.session_data.characterStats }));
        }
        if (session.session_data.inventory) {
          console.log('Loading saved inventory:', session.session_data.inventory);
          setInventory(session.session_data.inventory);
        }
        if (session.session_data.quests) {
          console.log('Loading saved quests:', session.session_data.quests);
          const questsWithDates = session.session_data.quests.map((quest: any) => ({
            ...quest,
            createdAt: new Date(quest.createdAt),
            completedAt: quest.completedAt ? new Date(quest.completedAt) : undefined
          }));
          setQuests(questsWithDates);
        }
      }
    } catch (error) {
      console.error('Error loading adventure session:', error);
    }
  };

  const handleNewCharacter = () => {
    setSelectedCharacter(null);
    setCharacterStats({
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
    setShowCharacterSelector(false);
    setShowCharacterCreation(true);
  };

  const handleStartGame = () => {
    console.log('Start game clicked');
    if (user) {
      // User is logged in, go directly to game mode selector
      setShowHomePage(false);
      setShowGameModeSelector(true);
      setShowCharacterSelector(false);
      setShowCharacterCreation(false);
      setShowMultiplayerLobby(false);
      setShowMultiplayerGameRoom(false);
    } else {
      // User is not logged in, this will be handled by the HomePage component's modal
      console.log('User not logged in - handled by HomePage modal');
    }
  };

  const handleHomeLogin = () => {
    // This will be handled by the HomePage component's modal
    console.log('Login clicked - handled by HomePage modal');
  };

  const handleLogin = (user: any) => {
    console.log('Login successful:', user);
    setUser(user);
    setShowAuthModal(false);
    setShowHomePage(false);
    // Only show game mode selector if user hasn't chosen a mode yet
    if (!userHasChosenMode) {
      setShowGameModeSelector(true);
    }
  };

  const handleDiceRoll = (results: any[]) => {
    const rollText = results.map(r => `${r.value}${r.isCritical ? ' (Critical!)' : r.isFumble ? ' (Fumble!)' : ''}`).join(', ');
    const total = results.reduce((sum, r) => sum + r.value, 0);
    
    const diceMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: `🎲 The Dungeon Master rolls: [${rollText}] = ${total}`,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, diceMessage]);
  };

  // AI-triggered dice rolling function
  const handleAIDiceRoll = (diceString: string) => {
    setDiceRolling(true);
    
    // Parse dice string like "1d20" or "2d6+3"
    const match = diceString.match(/(\d+)d(\d+)([+-]\d+)?/);
    if (!match) {
      setDiceRolling(false);
      return;
    }

    const numDice = parseInt(match[1]);
    const dieSize = parseInt(match[2]);
    const modifier = match[3] ? parseInt(match[3]) : 0;

    // Wait for animation to complete
    setTimeout(() => {
      const results: any[] = [];
      for (let i = 0; i < numDice; i++) {
        const value = Math.floor(Math.random() * dieSize) + 1;
        const isCritical = value === dieSize;
        const isFumble = value === 1;
        
        results.push({
          id: `${Date.now()}-${i}`,
          type: `d${dieSize}`,
          value,
          maxValue: dieSize,
          isCritical,
          isFumble
        });
      }

      const rollText = results.map(r => `${r.value}${r.isCritical ? ' (Critical!)' : r.isFumble ? ' (Fumble!)' : ''}`).join(', ');
      const total = results.reduce((sum, r) => sum + r.value, 0) + modifier;
      
      const diceMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `🎲 The Dungeon Master rolls ${diceString}: [${rollText}]${modifier !== 0 ? ` + ${modifier}` : ''} = ${total}`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, diceMessage]);
      setDiceRolling(false);
    }, 1500);
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

  const handleCharacterCreated = async (character: CharacterStats) => {
    try {
      if (!user) {
        setShowAuthModal(true);
        return;
      }

      // Save character to Supabase
      const data = await characterService.createCharacter(user.id, character);
      setCharacterStats({ ...character, id: data.id });
      setShowCharacterCreation(false);
      
      const openingMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Welcome, ${character.name}! You are a ${character.race} ${character.class} beginning your epic journey. The world stretches before you, filled with possibilities and dangers. What would you like to do first?`,
        timestamp: new Date()
      };
      
      setMessages([openingMessage]);
    } catch (error: any) {
      console.error('Error creating character:', error);
      alert(`Failed to create character: ${error.message}`);
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;

    // Check if character is dead
    if (characterStats.isDead) {
      const deathMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `${characterStats.name} is dead and cannot take any actions. The adventure has ended.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, deathMessage]);
      return;
    }

    // Check if in combat - block all text input during combat
    if (isInCombat) {
      const combatMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `You are in combat! Use the combat overlay above to choose your actions. You can only use the available combat actions: ${combatActions.join(', ')}.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, combatMessage]);
      return;
    }

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
          characterStats,
          inventory,
          onDiceRoll: 'handleAIDiceRoll', // Signal to AI that dice rolling is available
          isInCombat: isInCombat // Tell AI if we're in combat
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('AI Response:', data);
      console.log('AI Response keys:', Object.keys(data));
      console.log('AI Response.response:', data.response);
      console.log('AI Response.message:', data.message);
      
      if (data.error) {
        throw new Error(data.error);
      }

      // Check for dice rolls in AI response
      const responseText = data.response || data.message || '';
      if (responseText.includes('[DICE:')) {
        try {
          const diceMatch = responseText.match(/\[DICE:([^\]]+)\]/);
          if (diceMatch && diceMatch[1]) {
            const diceString = diceMatch[1];
            setCurrentDice(diceString);
            setDiceRolling(true);
          }
        } catch (error) {
          console.error('Error parsing dice data:', error);
        }
      }

      // Check for enemy data in AI response
      if (responseText.includes('[ENEMY:')) {
        try {
          const enemyMatch = responseText.match(/\[ENEMY:(\{.*?\})\]/);
          if (enemyMatch && enemyMatch[1]) {
            const enemyData = JSON.parse(enemyMatch[1]);
            console.log('Enemy data parsed:', enemyData);
            
            // Roll initiative
            const playerInit = Math.floor(Math.random() * 20) + 1;
            const enemyInit = Math.floor(Math.random() * 20) + 1;
            
            setPlayerInitiative(playerInit);
            setEnemyInitiative(enemyInit);
            
            // Determine turn order
            const playerGoesFirst = playerInit >= enemyInit;
            
            // Set up combat
            setIsInCombat(true);
            setEnemyStats({
              ...enemyData,
              maxHp: enemyData.hp,
              currentHp: enemyData.hp
            });
            setCombatTurn(playerGoesFirst ? 'player' : 'enemy');
            setCombatActions(['Attack', 'Cast Spell', 'Dodge', 'Use Item']);
            setCombatLog(prev => [...prev, 
              `Combat begins! You encounter a ${enemyData.name}.`,
              `Initiative: You rolled ${playerInit}, ${enemyData.name} rolled ${enemyInit}.`,
              `${playerGoesFirst ? 'You' : enemyData.name} goes first!`
            ]);
            
            // Switch to combat tab
            setActiveTab('combat');
            
            // If enemy goes first, trigger their turn
            if (!playerGoesFirst) {
              setTimeout(() => {
                triggerEnemyTurn();
              }, 2000);
            }
          }
        } catch (error) {
          console.error('Error parsing enemy data:', error);
        }
      }

      // Handle items from AI response
      console.log('AI response data:', data);
      console.log('Items from AI:', data.items);
      console.log('Stat changes from AI:', data.statChanges);
      
      // AI now handles dice rolls in its responses, no need for separate dice roll handling
      // if (data.diceRoll) {
      //   handleAIDiceRoll(data.diceRoll);
      // }
      
      if (data.items && data.items.length > 0) {
        console.log('Processing items:', data.items);
        
        // Filter out items that have already been processed
        const newItems = data.items.filter((item: any) => {
          const itemKey = `${item.name}-${item.type}-${item.rarity}`;
          const isNew = !processedItems.has(itemKey);
          console.log(`Item ${item.name}: ${isNew ? 'NEW' : 'ALREADY PROCESSED'} (key: ${itemKey})`);
          return isNew;
        });
        
        console.log(`Total items from AI: ${data.items.length}, New items to process: ${newItems.length}`);
        
        if (newItems.length > 0) {
          console.log('New items to process:', newItems);
          
          // Add items to inventory with retry logic
          const addItemsToInventory = () => {
            if (inventoryRef.current) {
              console.log('Inventory ref is available, processing items');
              for (const item of newItems) {
                console.log('Processing item:', item);
                
                if (item.quantity < 0) {
                  // Remove item from inventory
                  console.log('Removing item from inventory:', item);
                  inventoryRef.current.removeItem(item.name, Math.abs(item.quantity));
                  addActionLogEntry('item', `Used ${Math.abs(item.quantity)} ${item.name}`, '⚡');
                } else {
                  // Add item to inventory
                  console.log('Adding item to inventory:', item);
                  try {
                    inventoryRef.current.addItem(item);
                    // Only add to action log if item was successfully added
                    addActionLogEntry('item', `Found ${item.name}`, '🎒');
                    console.log('✅ Item successfully added to inventory and logged:', item.name);
                  } catch (error) {
                    console.error('❌ Failed to add item to inventory:', item.name, error);
                    // Don't add to action log if item addition failed
                  }
                }
                
                // Mark item as processed
                const itemKey = `${item.name}-${item.type}-${item.rarity}`;
                setProcessedItems(prev => new Set(Array.from(prev).concat(itemKey)));
              }
            } else {
              console.log('Inventory ref not available yet, retrying in 100ms');
              setTimeout(addItemsToInventory, 100);
            }
          };
          
          // Start the retry process
          addItemsToInventory();
        } else {
          console.log('All items have already been processed, skipping');
        }
      } else {
        console.log('No items received from AI');
      }

      // Dice rolling is already handled above, no need to duplicate

      // Handle stat changes from AI response
      if (data.statChanges && Object.keys(data.statChanges).length > 0) {
        console.log('Processing stat changes:', data.statChanges);
        console.log('Current HP before change:', characterStats.hp);
        console.log('Stat changes received:', JSON.stringify(data.statChanges, null, 2));
        
        setCharacterStats(prev => {
          const updatedStats = { ...prev };
          
          // Apply each stat change and add to action log
          for (const [stat, value] of Object.entries(data.statChanges)) {
            if (typeof value === 'number') {
              if (stat === 'xp' && value > 0) {
                // For XP, add to current value
                updatedStats.xp = (updatedStats.xp || 0) + value;
                addActionLogEntry('xp', `Gained ${value} XP`, '⭐');
              } else if (stat === 'hp' && value < 0) {
                // For negative HP, subtract from current
                updatedStats.hp = Math.max(0, (updatedStats.hp || 0) + value);
                addActionLogEntry('damage', `Lost ${Math.abs(value)} HP`, '💔');
                
                // Check for death
                if (updatedStats.hp === 0 && !updatedStats.isDead) {
                  updatedStats.isDead = true;
                  addActionLogEntry('death', 'Character has died!', '💀');
                }
              } else if (stat === 'hp' && value > 0) {
                // Add HP but don't exceed maxHp
                const oldHp = updatedStats.hp || 0;
                updatedStats.hp = Math.min((updatedStats.hp || 0) + value, updatedStats.maxHp || 20);
                console.log(`HP healing: ${oldHp} + ${value} = ${updatedStats.hp} (max: ${updatedStats.maxHp || 20})`);
                addActionLogEntry('heal', `Gained ${value} HP`, '❤️');
              } else if (stat === 'maxHp') {
                updatedStats.maxHp = value;
                addActionLogEntry('stat', `Max HP increased to ${value}`, '💪');
              } else if (stat === 'level') {
                updatedStats.level = value;
                addActionLogEntry('level', `Leveled up to ${value}!`, '🎉');
              } else if (stat === 'str') {
                updatedStats.str = value;
                addActionLogEntry('stat', `Strength increased to ${value}`, '💪');
              } else if (stat === 'dex') {
                updatedStats.dex = value;
                addActionLogEntry('stat', `Dexterity increased to ${value}`, '🏃');
              } else if (stat === 'con') {
                updatedStats.con = value;
                addActionLogEntry('stat', `Constitution increased to ${value}`, '🛡️');
              } else if (stat === 'int') {
                updatedStats.int = value;
                addActionLogEntry('stat', `Intelligence increased to ${value}`, '🧠');
              } else if (stat === 'wis') {
                updatedStats.wis = value;
                addActionLogEntry('stat', `Wisdom increased to ${value}`, '👁️');
              } else if (stat === 'cha') {
                updatedStats.cha = value;
                addActionLogEntry('stat', `Charisma increased to ${value}`, '✨');
              } else if (stat === 'gold') {
                updatedStats.gold = (updatedStats.gold || 0) + value;
                if (value > 0) {
                  addActionLogEntry('gold', `Gained ${value} gold`, '🪙');
                } else {
                  addActionLogEntry('gold', `Spent ${Math.abs(value)} gold`, '💸');
                }
              }
            }
          }
          
          console.log('Updated character stats:', updatedStats);
          return updatedStats;
        });
      } else {
        console.log('No stat changes received from AI');
      }

      console.log('Creating AI message with content:', data.response || data.message);
      console.log('Available data fields:', Object.keys(data));
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || data.message,
        timestamp: new Date()
      };

      console.log('AI message created:', aiMessage);

      // Parse quest offers from AI response BEFORE adding to messages
      const questResponseText = data.response || data.message || '';
      console.log('AI Response text for quest parsing:', questResponseText);
      const questMatches = questResponseText.match(/\[QUEST:(\{.*?\})\]/g);
      console.log('Quest matches found:', questMatches);
      if (questMatches) {
        questMatches.forEach((questMatch: string) => {
          const questJson = questMatch.replace(/\[QUEST:|\]/g, '');
          console.log('Raw quest JSON:', questJson);
          
          try {
            // Clean up common JSON issues
            let cleanedJson = questJson
              .replace(/,\s*}/g, '}')  // Remove trailing commas before }
              .replace(/,\s*]/g, ']')  // Remove trailing commas before ]
              .replace(/'/g, '"')      // Replace single quotes with double quotes
              .replace(/(\w+):/g, '"$1":') // Add quotes around unquoted keys
              .replace(/\n/g, ' ')     // Remove line breaks
              .replace(/\s+/g, ' ')    // Normalize whitespace
              .replace(/:\s*"/g, ':"') // Fix spacing around colons
              .replace(/"\s*:/g, '":') // Fix spacing around colons
              .replace(/,\s*"/g, ',"') // Fix spacing around commas
              .replace(/"\s*,/g, '",') // Fix spacing around commas
              .trim();                 // Remove leading/trailing spaces
            
            // Try to fix common JSON structure issues
            if (!cleanedJson.startsWith('{')) {
              cleanedJson = '{' + cleanedJson;
            }
            if (!cleanedJson.endsWith('}')) {
              cleanedJson = cleanedJson + '}';
            }
            
            console.log('Cleaned quest JSON:', cleanedJson);
            const questData = JSON.parse(cleanedJson);
            const quest: Quest = {
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
              title: questData.title || 'Untitled Quest',
              description: questData.description || 'No description provided',
              questGiver: questData.questGiver || 'Unknown NPC',
              xpReward: questData.xpReward || 100,
              goldReward: questData.goldReward || 0,
              status: 'active',
              createdAt: new Date(),
              type: questData.type || 'side',
              objectives: questData.objectives || []
            };
            console.log('Quest generated:', quest);
            showQuestOffer(quest);
            
            // Fallback: Always auto-add the quest after a short delay
            setTimeout(() => {
              console.log('Auto-adding quest to state:', quest.title);
              handleAcceptQuest(quest);
            }, 100);
            
            // Trigger glow effect on quest tab
            setTimeout(() => {
              triggerGlowEffect('quest-tab');
              triggerGlowEffect('quest-tab-mobile');
            }, 100);
          } catch (error) {
            console.error('Error parsing quest:', error);
            console.error('Raw quest match:', questMatch);
            console.error('Cleaned JSON:', questJson);
            
            // Try to extract information from the raw JSON even if parsing fails
            const extractValue = (text: string, key: string): string => {
              const regex = new RegExp(`"${key}"\\s*:\\s*"([^"]*)"`, 'i');
              const match = text.match(regex);
              return match ? match[1] : '';
            };
            
            const extractNumber = (text: string, key: string): number => {
              const regex = new RegExp(`"${key}"\\s*:\\s*(\\d+)`, 'i');
              const match = text.match(regex);
              return match ? parseInt(match[1]) : 0;
            };
            
            const extractArray = (text: string, key: string): string[] => {
              const regex = new RegExp(`"${key}"\\s*:\\s*\\[([^\\]]*)\\]`, 'i');
              const match = text.match(regex);
              if (match) {
                // Extract individual objectives from the array
                const objectivesText = match[1];
                const objectives = objectivesText.match(/"([^"]*)"/g);
                return objectives ? objectives.map(obj => obj.replace(/"/g, '')) : ['Complete the quest'];
              }
              return ['Complete the quest'];
            };
            
            const basicQuest: Quest = {
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
              title: extractValue(questJson, 'title') || 'Quest from AI',
              description: extractValue(questJson, 'description') || 'AI generated quest (parsing failed)',
              questGiver: extractValue(questJson, 'questGiver') || 'Unknown NPC',
              xpReward: extractNumber(questJson, 'xpReward') || 100,
              goldReward: extractNumber(questJson, 'goldReward') || 50,
              status: 'active',
              createdAt: new Date(),
              type: (extractValue(questJson, 'type') as 'main' | 'side' | 'daily') || 'side',
              objectives: extractArray(questJson, 'objectives')
            };
            console.log('Creating fallback quest:', basicQuest);
            handleAcceptQuest(basicQuest);
          }
        });
      }

      // Parse combat triggers and enemy data from AI response - only if not already in combat
      if (!isInCombat) {
        const combatTriggers = ['combat begins', 'battle starts', 'you are attacked', 'a fight breaks out', 'combat starts'];
        const responseLower = responseText.toLowerCase();
        const isCombatTriggered = combatTriggers.some(trigger => responseLower.includes(trigger));
        
        if (isCombatTriggered) {
          // Try to parse enemy data from [ENEMY:...] tag
          const enemyMatch = responseText.match(/\[ENEMY:(\{.*?\})\]/);
          if (enemyMatch) {
            try {
              const enemyData = JSON.parse(enemyMatch[1]);
              console.log('Parsed enemy data:', enemyData);
              startCombatWithEnemy(enemyData);
            } catch (error) {
              console.error('Error parsing enemy data:', error);
              // No fallback - AI must provide proper [ENEMY:] tags
            }
          }
        }
      }

      setMessages(prev => [...prev, aiMessage]);
      
      // Handle combat turn progression
      if (isInCombat && combatTurn === 'enemy' && enemyStats) {
        // Check if this is a player action response (contains dice rolls or combat actions)
        if (responseText.toLowerCase().includes('dice:1d20') || responseText.toLowerCase().includes('attack roll') || responseText.toLowerCase().includes('spell attack') || responseText.toLowerCase().includes('swing your weapon') || responseText.toLowerCase().includes('channel magical energy') || responseText.toLowerCase().includes('takes') || responseText.toLowerCase().includes('damage')) {
          // After AI responds to player action, trigger enemy turn
          setTimeout(() => {
            const enemyTurnMessage = `The ${enemyStats.name} attacks you!`;
            handleSendMessage(enemyTurnMessage);
          }, 2000);
        }
        // Check if this is an enemy turn response
        else if (responseText.toLowerCase().includes('enemy') || responseText.toLowerCase().includes('attacks you') || responseText.toLowerCase().includes('enemy attack roll') || responseText.toLowerCase().includes('you take')) {
          // After AI responds to enemy turn, switch back to player turn
          setTimeout(() => {
            setCombatTurn('player');
            setCombatLog(prev => [...prev, `The ${enemyStats.name} has finished their turn. It's your turn now.`]);
          }, 1000);
        }
      }

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

  // Multiplayer handlers
  const handleShowMultiplayerLobby = () => {
    setShowMultiplayerLobby(true);
    setShowHomePage(false);
  };

  const handleBackFromMultiplayer = () => {
    setShowMultiplayerLobby(false);
    setShowHomePage(true);
  };

  const handleCreateRoom = (roomId: string, characterId?: string) => {
    setCurrentRoomId(roomId);
    setShowMultiplayerLobby(false);
    setShowMultiplayerGameRoom(true);
  };

  const handleJoinRoom = (roomId: string, characterId?: string) => {
    setCurrentRoomId(roomId);
    setShowMultiplayerLobby(false);
    setShowMultiplayerGameRoom(true);
  };

  const handleLeaveMultiplayerRoom = () => {
    setShowMultiplayerGameRoom(false);
    setCurrentRoomId(null);
    setShowMultiplayerLobby(true);
  };

  // Game mode handlers
  const handleSinglePlayer = () => {
    setGameMode('single');
    setShowGameModeSelector(false);
    setShowCharacterSelector(true);
    setUserHasChosenMode(true); // Mark that user has chosen a mode
  };

  const handleMultiplayer = () => {
    setGameMode('multiplayer');
    setShowGameModeSelector(false);
    setShowMultiplayerLobby(true);
    setUserHasChosenMode(true); // Mark that user has chosen a mode
  };

  const handleBackFromGameMode = () => {
    setShowGameModeSelector(false);
    setShowHomePage(true);
    setUserHasChosenMode(false); // Reset choice when going back
  };


  const handleAICharacterComplete = async (characterData: any) => {
    try {
      // Convert AI character data to our character stats format
      const newCharacterStats: CharacterStats = {
        name: characterData.name || 'Unknown',
        race: characterData.race || 'Human',
        class: characterData.class || 'Adventurer',
        level: 1,
        hp: 10,
        maxHp: 10,
        xp: 0,
        str: 10,
        dex: 10,
        con: 10,
        int: 10,
        wis: 10,
        cha: 10,
        background: characterData.background || 'Adventurer',
        alignment: characterData.alignment || 'Neutral',
        personality: characterData.personality || '',
        backstory: characterData.backstory || '',
        appearance: characterData.appearance || '',
        goals: characterData.goals || '',
        fears: characterData.fears || '',
        imageUrl: characterData.imageUrl || null,
        inventory: '[]' // Initialize with empty inventory
      };

      // Save character to database
      if (user) {
        const savedCharacter = await characterService.createCharacter(user.id, newCharacterStats);
        setSelectedCharacter(savedCharacter);
      } else {
        setCharacterStats(newCharacterStats);
      }

      // Navigate to game
      setShowAICharacterCreation(false);
      setShowCharacterCreation(false);
      setShowGameModeSelector(false);
      setShowHomePage(false);
      setShowCharacterSelector(false);
      setShowMultiplayerLobby(false);
      setShowMultiplayerGameRoom(false);

    } catch (error) {
      console.error('Error completing AI character creation:', error);
    }
  };

  // Show homepage
  if (showHomePage) {
    return (
      <HomePage 
        onStartGame={handleStartGame} 
        onLogin={handleHomeLogin}
        onContinueGame={async () => {
          // Return to the current game state
          if (selectedCharacter) {
            setShowHomePage(false);
            setShowGameModeSelector(false);
            setShowCharacterSelector(false);
            setShowCharacterCreation(false);
            setShowMultiplayerLobby(false);
            setShowMultiplayerGameRoom(false);
            
            // Load the adventure session
            try {
              const session = await adventureService.loadAdventureSession(selectedCharacter.id);
              if (session && session.session_data) {
                console.log('Loading existing adventure session on continue:', session.session_data);
                
                // Restore messages
                if (session.session_data.messages) {
                  const messagesWithDates = session.session_data.messages.map((msg: any) => ({
                    ...msg,
                    timestamp: new Date(msg.timestamp)
                  }));
                  setMessages(messagesWithDates);
                }
                
                // Restore character stats
                if (session.session_data.characterStats) {
                  setCharacterStats(session.session_data.characterStats);
                }
                
                // Restore inventory
                if (session.session_data.inventory) {
                  setInventory(session.session_data.inventory);
                }
                
                // Restore quests
                if (session.session_data.quests) {
                  console.log('Loading saved quests on continue:', session.session_data.quests);
                  const questsWithDates = session.session_data.quests.map((quest: any) => ({
                    ...quest,
                    createdAt: new Date(quest.createdAt),
                    completedAt: quest.completedAt ? new Date(quest.completedAt) : undefined
                  }));
                  setQuests(questsWithDates);
                }
                
                console.log('Session restored successfully on continue');
              }
            } catch (error) {
              console.error('Error loading session on continue:', error);
            }
          }
        }}
        hasActiveGame={!!selectedCharacter}
        currentCharacter={selectedCharacter}
      />
    );
  }

  // Show game mode selector
  if (showGameModeSelector && user) {
    return (
      <GameModeSelector
        onSinglePlayer={handleSinglePlayer}
        onMultiplayer={handleMultiplayer}
        onBack={handleBackFromGameMode}
        username={user.user_metadata?.username || user.email}
      />
    );
  }

  // Show multiplayer lobby
  if (showMultiplayerLobby) {
    return (
      <MultiplayerLobby
        onJoinRoom={handleJoinRoom}
        onCreateRoom={handleCreateRoom}
        onBack={handleBackFromMultiplayer}
        currentUserId={user?.id}
      />
    );
  }

    // Show multiplayer game room
    if (showMultiplayerGameRoom && currentRoomId && user) {
      return (
        <MultiplayerGameWithAI
          roomId={currentRoomId}
          userId={user.id}
          onLeaveRoom={handleLeaveMultiplayerRoom}
        />
      );
    }

  // Show authentication modal
  if (showAuthModal) {
    return <SupabaseAuthModal isOpen={true} onClose={() => setShowAuthModal(false)} onLogin={handleLogin} />;
  }

  // Show character selector
  if (showCharacterSelector && user) {
    return (
      <SupabaseCharacterSelector
        userId={user.id}
        onCharacterSelect={handleCharacterSelect}
        onNewCharacter={handleNewCharacter}
        onAICreateCharacter={() => setShowAICharacterCreation(true)}
        onLogout={handleLogout}
      />
    );
  }

  // Show AI Character Creation
  if (showAICharacterCreation) {
    return (
      <AICharacterCreation
        onComplete={handleAICharacterComplete}
        onCancel={() => setShowAICharacterCreation(false)}
      />
    );
  }

  if (showCharacterCreation) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
        color: '#e2e8f0',
        fontFamily: 'sans-serif',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background Effects */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          <div style={{
            position: 'absolute',
            top: '-20%',
            right: '-20%',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%)',
            animation: 'float1 15s infinite ease-in-out'
          }}></div>
          <div style={{
            position: 'absolute',
            bottom: '-20%',
            left: '-20%',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(236, 72, 153, 0.2) 0%, transparent 70%)',
            animation: 'float2 20s infinite ease-in-out'
          }}></div>
        </div>

        <style jsx global>{`
          @keyframes float1 {
            0% { transform: translate(0, 0) scale(1); }
            50% { transform: translate(-20px, 30px) scale(1.05); }
            100% { transform: translate(0, 0) scale(1); }
          }
          @keyframes float2 {
            0% { transform: translate(0, 0) scale(1); }
            50% { transform: translate(30px, -20px) scale(1.1); }
            100% { transform: translate(0, 0) scale(1); }
          }
        `}</style>

        <div style={{ position: 'relative', zIndex: 10, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div style={{
            background: 'rgba(26, 26, 46, 0.8)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: '24px',
            maxWidth: '600px',
            width: '100%',
            padding: '3rem',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <h1 style={{
                fontSize: '2.5rem',
                fontWeight: 'bold',
                marginBottom: '1rem',
                background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                ⚔️ Create Your Character
              </h1>
              <p style={{ color: '#94a3b8', fontSize: '1.125rem' }}>
                Choose your race and class to begin your epic adventure
              </p>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Character Name */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  marginBottom: '0.75rem',
                  color: '#94a3b8'
                }}>
                  Character Name
                </label>
                <input
                  type="text"
                  value={characterStats.name}
                  onChange={(e) => setCharacterStats(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter your character's name"
                  maxLength={20}
                  style={{
                    width: '100%',
                    padding: '1rem 1.25rem',
                    background: 'rgba(15, 15, 35, 0.6)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: '12px',
                    color: '#e2e8f0',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'all 0.3s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'rgba(139, 92, 246, 0.5)';
                    e.target.style.background = 'rgba(15, 15, 35, 0.8)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(139, 92, 246, 0.3)';
                    e.target.style.background = 'rgba(15, 15, 35, 0.6)';
                  }}
                />
              </div>
              
              {/* Race and Class Selection */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    marginBottom: '0.75rem',
                    color: '#94a3b8'
                  }}>
                    Race
                  </label>
                  <select
                    value={characterStats.race || ''}
                    onChange={(e) => setCharacterStats(prev => ({ ...prev, race: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '1rem 1.25rem',
                      background: 'rgba(15, 15, 35, 0.6)',
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                      borderRadius: '12px',
                      color: '#e2e8f0',
                      fontSize: '1rem',
                      outline: 'none',
                      transition: 'all 0.3s ease'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'rgba(139, 92, 246, 0.5)';
                      e.target.style.background = 'rgba(15, 15, 35, 0.8)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(139, 92, 246, 0.3)';
                      e.target.style.background = 'rgba(15, 15, 35, 0.6)';
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
                
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    marginBottom: '0.75rem',
                    color: '#94a3b8'
                  }}>
                    Class
                  </label>
                  <select
                    value={characterStats.class || ''}
                    onChange={(e) => {
                      const selectedClass = e.target.value;
                      const startingEquipment = getClassStartingEquipment(selectedClass);
                      setCharacterStats(prev => ({ 
                        ...prev, 
                        class: selectedClass,
                        inventory: startingEquipment
                      }));
                    }}
                    style={{
                      width: '100%',
                      padding: '1rem 1.25rem',
                      background: 'rgba(15, 15, 35, 0.6)',
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                      borderRadius: '12px',
                      color: '#e2e8f0',
                      fontSize: '1rem',
                      outline: 'none',
                      transition: 'all 0.3s ease'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'rgba(139, 92, 246, 0.5)';
                      e.target.style.background = 'rgba(15, 15, 35, 0.8)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(139, 92, 246, 0.3)';
                      e.target.style.background = 'rgba(15, 15, 35, 0.6)';
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
                    <option value="Sorcerer">Sorcerer</option>
                    <option value="Warlock">Warlock</option>
                    <option value="Druid">Druid</option>
                    <option value="Monk">Monk</option>
                    <option value="Artificer">Artificer</option>
                  </select>
                </div>
              </div>
              
              {/* Character Preview */}
              {(characterStats.name || characterStats.race || characterStats.class) && (
                <div style={{
                  background: 'rgba(15, 15, 35, 0.6)',
                  border: '1px solid rgba(139, 92, 246, 0.2)',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  marginTop: '1rem'
                }}>
                  <h3 style={{
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    marginBottom: '1rem',
                    color: '#94a3b8'
                  }}>
                    Character Preview
                  </h3>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                      color: '#e2e8f0',
                      marginBottom: '0.5rem'
                    }}>
                      {characterStats.name || 'Unnamed Hero'}
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: '1rem', marginBottom: '1rem' }}>
                      {characterStats.race || 'Unknown'} {characterStats.class || 'Adventurer'}
                    </div>
                    
                    {/* Starting Equipment Preview */}
                    {characterStats.class && (
                      <div style={{ textAlign: 'left' }}>
                        <div style={{
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          color: '#a78bfa',
                          marginBottom: '0.5rem',
                          textAlign: 'center'
                        }}>
                          Starting Equipment:
                        </div>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                          gap: '0.5rem',
                          fontSize: '0.75rem'
                        }}>
                          {getClassStartingEquipment(characterStats.class).map((item, index) => (
                            <div key={index} style={{
                              background: 'rgba(139, 92, 246, 0.1)',
                              border: '1px solid rgba(139, 92, 246, 0.2)',
                              borderRadius: '8px',
                              padding: '0.5rem',
                              textAlign: 'center'
                            }}>
                              <div style={{ color: '#e2e8f0', fontWeight: '600' }}>
                                {item.name}
                              </div>
                              <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                                {item.type} • {item.quantity}x
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                <button
                  onClick={() => handleCharacterCreated(characterStats)}
                  disabled={!characterStats.name || !characterStats.race || !characterStats.class}
                  style={{
                    width: '100%',
                    padding: '1.25rem 2rem',
                    background: (!characterStats.name || !characterStats.race || !characterStats.class)
                      ? 'rgba(55, 65, 81, 0.5)'
                      : 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                    border: 'none',
                    borderRadius: '12px',
                    color: 'white',
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    cursor: (!characterStats.name || !characterStats.race || !characterStats.class) ? 'not-allowed' : 'pointer',
                    opacity: (!characterStats.name || !characterStats.race || !characterStats.class) ? 0.5 : 1,
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <span>🎭</span>
                  Create Character & Start Adventure
                </button>
                
                <button
                  onClick={() => {
                    setShowCharacterCreation(false);
                    setShowCharacterSelector(true);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1.5rem',
                    background: 'rgba(139, 92, 246, 0.1)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: '8px',
                    color: '#a78bfa',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)';
                    e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.5)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)';
                  }}
                >
                  ← Back to Character Selection
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
      color: '#e2e8f0',
      fontFamily: 'sans-serif',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Effects */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <div style={{
          position: 'absolute',
          top: '-20%',
          right: '-20%',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%)',
          animation: 'float1 15s infinite ease-in-out'
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: '-20%',
          left: '-20%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(236, 72, 153, 0.2) 0%, transparent 70%)',
          animation: 'float2 20s infinite ease-in-out'
        }}></div>
      </div>

      <style jsx global>{`
        @keyframes float1 {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-20px, 30px) scale(1.05); }
          100% { transform: translate(0, 0) scale(1); }
        }
        @keyframes float2 {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, -20px) scale(1.1); }
          100% { transform: translate(0, 0) scale(1); }
        }
        @keyframes diceRoll {
          0% { transform: scale(0.8) rotate(0deg); opacity: 0; }
          50% { transform: scale(1.1) rotate(180deg); opacity: 1; }
          100% { transform: scale(1) rotate(360deg); opacity: 1; }
        }
        @keyframes diceSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>

      <div style={{ position: 'relative', zIndex: 10, minHeight: '100vh' }}>
        {/* Global Header - Appears on all pages */}
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          background: 'rgba(15, 15, 35, 0.9)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(139, 92, 246, 0.2)',
          padding: '1rem'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            maxWidth: '1200px',
            margin: '0 auto'
          }}>
            <button
              onClick={() => setShowHomePage(true)}
              style={{
                padding: '0.75rem',
                background: 'rgba(139, 92, 246, 0.1)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '12px',
                color: '#a78bfa',
                fontSize: '1.25rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '48px',
                height: '48px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)';
                e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.5)';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
              title="Return to Homepage"
            >
              🏠
            </button>
            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: 0
            }}>
              ⚔️ AI D&D Adventure
            </h1>
            <div style={{ width: '48px' }}></div> {/* Spacer for centering */}
          </div>
        </div>

        {/* Add top padding to account for fixed header */}
        <div style={{ 
          paddingTop: '80px',
          width: '100%',
          maxWidth: '100vw',
          boxSizing: 'border-box',
          overflow: 'hidden'
        }}>
        {/* Mobile Header */}
        <div style={{
          display: window.innerWidth < 1024 ? 'block' : 'none',
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(236, 72, 153, 0.1) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(139, 92, 246, 0.2)',
          borderRadius: '24px',
          margin: '0.75rem',
          padding: '1.25rem',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4), 0 8px 16px rgba(139, 92, 246, 0.1)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Enhanced Decorative background elements */}
          <div style={{
            position: 'absolute',
            top: '-50%',
            right: '-20%',
            width: '200px',
            height: '200px',
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)',
            borderRadius: '50%',
            zIndex: 0,
            animation: 'pulse 5s ease-in-out infinite'
          }}></div>
          <div style={{
            position: 'absolute',
            bottom: '-30%',
            left: '-10%',
            width: '150px',
            height: '150px',
            background: 'radial-gradient(circle, rgba(236, 72, 153, 0.08) 0%, transparent 70%)',
            borderRadius: '50%',
            zIndex: 0,
            animation: 'pulse 7s ease-in-out infinite reverse'
          }}></div>
          
      {/* Mobile Floating Particles */}
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="floating-particle"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 8}s`,
            animationDuration: `${6 + Math.random() * 4}s`,
            width: '2px',
            height: '2px'
          }}
        />
      ))}
          
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '1.5rem',
            position: 'relative',
            zIndex: 1
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              boxShadow: '0 8px 20px rgba(139, 92, 246, 0.3)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <span style={{ position: 'relative', zIndex: 1 }}>⚔️</span>
            </div>
              <div>
                <h1 style={{
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  background: 'linear-gradient(135deg, #ffffff, #e2e8f0)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  margin: 0,
                  lineHeight: 1.2
                }}>
                  AI D&D Adventure
                </h1>
                <p style={{
                  fontSize: '0.75rem',
                  color: 'rgba(226, 232, 240, 0.7)',
                  margin: 0,
                  fontWeight: '500'
                }}>
                  Epic Fantasy RPG
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={saveAdventure}
                style={{
                  padding: '0.75rem 1rem',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  border: 'none',
                  borderRadius: '12px',
                  color: 'white',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLButtonElement).style.transform = 'translateY(-2px)';
                  (e.target as HTMLButtonElement).style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)';
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLButtonElement).style.transform = 'translateY(0)';
                  (e.target as HTMLButtonElement).style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                }}
              >
                💾 Save
              </button>
              <button
                onClick={() => setShowCharacterCreation(true)}
                style={{
                  padding: '0.75rem 1rem',
                  background: 'rgba(139, 92, 246, 0.15)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  borderRadius: '12px',
                  color: '#a78bfa',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLButtonElement).style.background = 'rgba(139, 92, 246, 0.25)';
                  (e.target as HTMLButtonElement).style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLButtonElement).style.background = 'rgba(139, 92, 246, 0.15)';
                  (e.target as HTMLButtonElement).style.transform = 'translateY(0)';
                }}
              >
                ✏️ Edit
              </button>
            </div>
          </div>
          
          {/* Character Info Mobile */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(236, 72, 153, 0.05) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(139, 92, 246, 0.15)',
            borderRadius: '24px',
            padding: '1.25rem',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4), 0 8px 16px rgba(139, 92, 246, 0.1)',
            position: 'relative',
            overflow: 'hidden',
            margin: '0.75rem',
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box'
          }}>
            <h3 style={{
              fontSize: '1.1rem',
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '0.75rem'
            }}>
              📋 {characterStats.name}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem' }}>
              <div style={{ color: '#94a3b8' }}>
                Level {characterStats.level || 1} {characterStats.race} {characterStats.class}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>HP:</span>
                <span style={{ color: '#e2e8f0' }}>{characterStats.hp}/{characterStats.maxHp || characterStats.hp}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>XP:</span>
                <span style={{ color: '#e2e8f0' }}>{characterStats.xp || 0}</span>
              </div>
            </div>
            
            <button
              onClick={() => setShowCharacterCreation(true)}
              style={{
                width: '100%',
                marginTop: '0.75rem',
                padding: '0.5rem',
                background: 'rgba(139, 92, 246, 0.1)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '8px',
                color: '#a78bfa',
                fontSize: '0.8rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              ✏️ Edit Character
            </button>
          </div>
        </div>

    <div style={{ 
      display: window.innerWidth < 1024 ? 'flex' : 'flex', 
      flexDirection: window.innerWidth < 1024 ? 'column' : 'row', 
      minHeight: '100vh',
      width: '100%',
      maxWidth: '100vw',
      boxSizing: 'border-box',
      overflow: 'hidden',
      background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
      position: 'relative'
    }}>
      {/* Global Background Particles */}
      {[...Array(30)].map((_, i) => (
        <div
          key={`global-${i}`}
          className="floating-particle"
          style={{
            position: 'fixed',
            top: `${Math.random() * 100}vh`,
            left: `${Math.random() * 100}vw`,
            animationDelay: `${Math.random() * 10}s`,
            animationDuration: `${8 + Math.random() * 6}s`,
            width: '1px',
            height: '1px',
            opacity: 0.3,
            zIndex: 0,
            pointerEvents: 'none'
          }}
        />
      ))}
          {/* Desktop Sidebar */}
          <div style={{
            display: window.innerWidth >= 1024 ? 'flex' : 'none',
            width: '320px',
            margin: '1rem',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            {/* Character Info */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(236, 72, 153, 0.05) 100%)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(139, 92, 246, 0.15)',
              borderRadius: '24px',
              padding: '1.5rem',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4), 0 8px 16px rgba(139, 92, 246, 0.1)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '1rem'
              }}>
                📋 {characterStats.name}
              </h3>
              <div style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '1rem' }}>
                Level {characterStats.level || 1} {characterStats.race} {characterStats.class}
              </div>
              
              {/* Individual Stat Cards */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(3, 1fr)', 
                gap: '0.75rem',
                marginBottom: '1rem'
              }}>
                <div style={{
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(236, 72, 153, 0.05) 100%)',
                  border: '1px solid rgba(139, 92, 246, 0.2)',
                  borderRadius: '16px',
                  padding: '1rem',
                  textAlign: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                  backdropFilter: 'blur(10px)'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '-20%',
                    right: '-20%',
                    width: '60px',
                    height: '60px',
                    background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)',
                    borderRadius: '50%'
                  }}></div>
                  <div style={{ 
                    color: 'rgba(226, 232, 240, 0.8)', 
                    fontSize: '0.7rem', 
                    fontWeight: '600',
                    marginBottom: '0.25rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>Level</div>
                  <div style={{ 
                    color: '#ffffff', 
                    fontWeight: '700', 
                    fontSize: '1.25rem',
                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
                  }}>{characterStats.level || 1}</div>
                </div>
                <div style={{
                  background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  borderRadius: '16px',
                  padding: '1rem',
                  textAlign: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                  backdropFilter: 'blur(10px)'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '-20%',
                    right: '-20%',
                    width: '60px',
                    height: '60px',
                    background: 'radial-gradient(circle, rgba(239, 68, 68, 0.1) 0%, transparent 70%)',
                    borderRadius: '50%'
                  }}></div>
                  <div style={{ 
                    color: 'rgba(226, 232, 240, 0.8)', 
                    fontSize: '0.7rem', 
                    fontWeight: '600',
                    marginBottom: '0.25rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>Health</div>
                  <div style={{ 
                    color: '#ffffff', 
                    fontWeight: '700', 
                    fontSize: '1.1rem',
                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
                  }}>{characterStats.hp}/{characterStats.maxHp || characterStats.hp}</div>
                </div>
                <div style={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  borderRadius: '16px',
                  padding: '1rem',
                  textAlign: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                  backdropFilter: 'blur(10px)'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '-20%',
                    right: '-20%',
                    width: '60px',
                    height: '60px',
                    background: 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%)',
                    borderRadius: '50%'
                  }}></div>
                  <div style={{ 
                    color: 'rgba(226, 232, 240, 0.8)', 
                    fontSize: '0.7rem', 
                    fontWeight: '600',
                    marginBottom: '0.25rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>Experience</div>
                  <div style={{ 
                    color: '#ffffff', 
                    fontWeight: '700', 
                    fontSize: '1.1rem',
                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
                  }}>{characterStats.xp || 0}</div>
                </div>
              </div>
              
              <button
                onClick={() => setShowCharacterCreation(true)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(139, 92, 246, 0.1)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  borderRadius: '8px',
                  color: '#a78bfa',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                ✏️ Edit Character
              </button>
            </div>

            {/* Character Stats - Always Visible */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(236, 72, 153, 0.05) 100%)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(139, 92, 246, 0.15)',
              borderRadius: '24px',
              padding: '1.5rem',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4), 0 8px 16px rgba(139, 92, 246, 0.1)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <CharacterProgression
                characterStats={characterStats}
                onStatsUpdate={(stats) => setCharacterStats(prev => ({ ...prev, ...stats }))}
              />
            </div>


            {/* Active Tab Content */}
            <div style={{
              background: 'rgba(26, 26, 46, 0.8)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(139, 92, 246, 0.2)',
              borderRadius: '16px',
              padding: '1.5rem',
              flex: 1
            }}>
              {activeTab === 'character' && (
                <CharacterProgression
                  characterStats={characterStats}
                  onStatsUpdate={(stats) => setCharacterStats(prev => ({ ...prev, ...stats }))}
                />
              )}
              {activeTab === 'quests' && (
                <div>
                  <QuestSystem
                    quests={quests}
                    onUpdateQuest={handleUpdateQuest}
                    onCompleteQuest={handleCompleteQuest}
                    onAcceptQuest={handleAcceptQuest}
                    onDeclineQuest={handleDeclineQuest}
                  />
                  {/* Test button to add a quest */}
                  <button
                    onClick={() => {
                      const testQuest: Quest = {
                        id: Date.now().toString(),
                        title: 'Test Quest',
                        description: 'This is a test quest to verify the quest system is working.',
                        questGiver: 'Test NPC',
                        xpReward: 100,
                        goldReward: 50,
                        status: 'active',
                        createdAt: new Date(),
                        type: 'side',
                        objectives: ['Complete the test', 'Return to NPC']
                      };
                      handleAcceptQuest(testQuest);
                    }}
                    style={{
                      marginTop: '1rem',
                      padding: '0.5rem 1rem',
                      background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                      border: 'none',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '0.875rem',
                      cursor: 'pointer'
                    }}
                  >
                    Add Test Quest
                  </button>
                </div>
              )}
              {activeTab === 'inventory' && (
                <InventorySystem
                  ref={inventoryRef}
                  characterStats={characterStats}
                  onInventoryChange={(newInventory) => {
                    console.log('Parent inventory changed (desktop), new count:', newInventory.length, 'items:', newInventory.map(i => i.name));
                    setInventory(newInventory);
                  }}
                  initialInventory={inventory}
                />
              )}
              {activeTab === 'combat' && (
                <CombatSystem
                  characterStats={characterStats}
                  onCombatEnd={handleCombatEnd}
                />
              )}
            </div>
          </div>

          {/* Main Chat Area */}
          <div style={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column',
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box',
            overflow: 'hidden'
          }}>
            {/* Chat and Action Log Container */}
            <div style={{ 
              flex: 1, 
              display: 'flex', 
              gap: window.innerWidth < 1024 ? '0.5rem' : '1rem', 
              margin: window.innerWidth < 1024 ? '0.5rem' : '1rem',
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box',
              overflow: 'hidden'
            }}>
              {/* Chat Area */}
              <div style={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column',
                width: '100%',
                maxWidth: '100%',
                boxSizing: 'border-box',
                overflow: 'hidden'
              }}>
            {/* Desktop Header */}
            <div style={{
              display: window.innerWidth >= 1024 ? 'block' : 'none',
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(236, 72, 153, 0.05) 100%)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(139, 92, 246, 0.15)',
              borderRadius: '24px',
              margin: '1rem',
              padding: '2rem',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4), 0 8px 16px rgba(139, 92, 246, 0.1)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Enhanced Decorative background elements */}
              <div style={{
                position: 'absolute',
                top: '-30%',
                right: '-10%',
                width: '200px',
                height: '200px',
                background: 'radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 70%)',
                borderRadius: '50%',
                zIndex: 0,
                animation: 'pulse 4s ease-in-out infinite'
              }}></div>
              <div style={{
                position: 'absolute',
                bottom: '-20%',
                left: '-5%',
                width: '150px',
                height: '150px',
                background: 'radial-gradient(circle, rgba(236, 72, 153, 0.05) 0%, transparent 70%)',
                borderRadius: '50%',
                zIndex: 0,
                animation: 'pulse 6s ease-in-out infinite reverse'
              }}></div>
              
      {/* Floating Particles */}
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="floating-particle"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 8}s`,
            animationDuration: `${6 + Math.random() * 4}s`,
            width: '2px',
            height: '2px'
          }}
        />
      ))}
              
              <div style={{ 
                textAlign: 'center', 
                marginBottom: '1.5rem',
                position: 'relative',
                zIndex: 1
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '1rem',
                  marginBottom: '1rem'
                }}>
          <div style={{
            width: '64px',
            height: '64px',
            background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            boxShadow: '0 12px 24px rgba(139, 92, 246, 0.3)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <span style={{ position: 'relative', zIndex: 1 }}>⚔️</span>
          </div>
                  <div>
                    <h1 style={{
                      fontSize: '2.5rem',
                      fontWeight: '700',
                      background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      margin: 0,
                      lineHeight: 1.2
                    }}>
                      ✨ AI D&D Adventure ✨
                    </h1>
                    <p style={{
                      fontSize: '0.9rem',
                      color: 'rgba(226, 232, 240, 0.7)',
                      margin: 0,
                      fontWeight: '500'
                    }}>
                      Epic Fantasy RPG Experience
                    </p>
                  </div>
                </div>
                <div style={{
                  background: 'rgba(15, 15, 35, 0.6)',
                  border: '1px solid rgba(139, 92, 246, 0.2)',
                  borderRadius: '16px',
                  padding: '1rem 2rem',
                  display: 'inline-block'
                }}>
                  <p style={{ 
                    color: '#94a3b8', 
                    margin: 0,
                    fontSize: '1.1rem',
                    fontWeight: '500'
                  }}>
                    {characterStats.isDead ? (
                      <span style={{ color: '#ef4444', fontWeight: 'bold' }}>
                        💀 {characterStats.name} is DEAD 💀
                      </span>
                    ) : (
                      `Playing as ${characterStats.name} the ${characterStats.race} ${characterStats.class}`
                    )}
                  </p>
                </div>
              </div>
              
              {/* Save Button and Keyboard Shortcuts */}
              <div style={{ textAlign: 'center' }}>
                <button
                  onClick={saveAdventure}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    color: 'white',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    margin: '0 auto'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #059669, #047857)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #10b981, #059669)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  💾 Save Adventure
                </button>
                
                {/* Keyboard Shortcuts Help */}
                <div style={{ 
                  marginTop: '0.5rem', 
                  fontSize: '0.7rem', 
                  color: '#64748b',
                  lineHeight: '1.2'
                }}>
                  <div>⌨️ Shortcuts: Ctrl+1-5 (tabs), Ctrl+S (save), Esc (chat)</div>
                </div>
              </div>
            </div>

            {/* Desktop Tab Navigation */}
            <div style={{
              display: window.innerWidth >= 1024 ? 'block' : 'none',
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(236, 72, 153, 0.05) 100%)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(139, 92, 246, 0.15)',
              borderRadius: '24px',
              margin: '0 1rem 1rem 1rem',
              padding: '1.5rem',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4), 0 8px 16px rgba(139, 92, 246, 0.1)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Decorative background elements */}
              <div style={{
                position: 'absolute',
                top: '-20%',
                right: '-5%',
                width: '120px',
                height: '120px',
                background: 'radial-gradient(circle, rgba(139, 92, 246, 0.05) 0%, transparent 70%)',
                borderRadius: '50%',
                zIndex: 0
              }}></div>
              
              <div style={{ 
                display: 'flex', 
                gap: '1rem', 
                justifyContent: 'center',
                position: 'relative',
                zIndex: 1
              }}>
                {[
                  { id: 'chat', label: 'Chat' },
                  { id: 'character', label: 'Stats' },
                  { id: 'inventory', label: 'Items' },
                  { id: 'combat', label: 'Combat' },
                  { id: 'quests', label: 'Quests' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    id={tab.id === 'quests' ? 'quest-tab' : undefined}
                    onClick={() => setActiveTab(tab.id as any)}
                    style={{
                      padding: '0.875rem 1.75rem',
                      borderRadius: '12px',
                      fontWeight: '600',
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      background: activeTab === tab.id 
                        ? 'linear-gradient(135deg, #8b5cf6, #ec4899)' 
                        : 'linear-gradient(135deg, rgba(55, 65, 81, 0.8), rgba(75, 85, 99, 0.6))',
                      color: activeTab === tab.id ? 'white' : '#e2e8f0',
                      border: activeTab === tab.id 
                        ? 'none' 
                        : '1px solid rgba(139, 92, 246, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      boxShadow: activeTab === tab.id 
                        ? '0 8px 25px rgba(139, 92, 246, 0.4), 0 4px 12px rgba(236, 72, 153, 0.3)' 
                        : '0 4px 15px rgba(0, 0, 0, 0.2)',
                      transform: activeTab === tab.id ? 'translateY(-2px)' : 'translateY(0)',
                      backdropFilter: 'blur(10px)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
        onMouseEnter={(e) => {
          if (activeTab !== tab.id) {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(75, 85, 99, 0.9), rgba(95, 105, 119, 0.7))';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.3), 0 4px 12px rgba(139, 92, 246, 0.2)';
          }
        }}
        onMouseLeave={(e) => {
          if (activeTab !== tab.id) {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(55, 65, 81, 0.8), rgba(75, 85, 99, 0.6))';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)';
          }
        }}
                  >
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Tab Navigation */}
            <div style={{
              display: window.innerWidth < 1024 ? 'block' : 'none',
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(236, 72, 153, 0.05) 100%)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(139, 92, 246, 0.15)',
              borderRadius: '24px',
              margin: '0.75rem',
              padding: '1rem',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4), 0 8px 16px rgba(139, 92, 246, 0.1)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Decorative background elements */}
              <div style={{
                position: 'absolute',
                top: '-30%',
                right: '-10%',
                width: '120px',
                height: '120px',
                background: 'radial-gradient(circle, rgba(139, 92, 246, 0.05) 0%, transparent 70%)',
                borderRadius: '50%',
                zIndex: 0
              }}></div>
              
              <div style={{ 
                display: 'flex', 
                overflowX: 'auto', 
                gap: '0.75rem',
                padding: '0.25rem',
                position: 'relative',
                zIndex: 1,
                WebkitOverflowScrolling: 'touch'
              }}>
                {[
                  { id: 'chat', label: 'Chat', color: 'rgba(139, 92, 246, 0.1)' },
                  { id: 'character', label: 'Stats', color: 'rgba(16, 185, 129, 0.1)' },
                  { id: 'inventory', label: 'Items', color: 'rgba(245, 158, 11, 0.1)' },
                  { id: 'combat', label: 'Combat', color: 'rgba(239, 68, 68, 0.1)' },
                  { id: 'quests', label: 'Quests', color: 'rgba(168, 85, 247, 0.1)' },
                  { id: 'actions', label: 'Actions', color: 'rgba(99, 102, 241, 0.1)' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    id={tab.id === 'quests' ? 'quest-tab-mobile' : undefined}
                    onClick={() => setActiveTab(tab.id as any)}
                    style={{
                      padding: '1rem 1.5rem',
                      borderRadius: '20px',
                      fontWeight: '600',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      background: activeTab === tab.id 
                        ? 'linear-gradient(135deg, #8b5cf6, #ec4899)' 
                        : `linear-gradient(135deg, ${tab.color}, rgba(55, 65, 81, 0.3))`,
                      color: activeTab === tab.id ? 'white' : '#e2e8f0',
                      border: activeTab === tab.id 
                        ? 'none' 
                        : '1px solid rgba(139, 92, 246, 0.2)',
                      whiteSpace: 'nowrap',
                      boxShadow: activeTab === tab.id 
                        ? '0 8px 25px rgba(139, 92, 246, 0.4), 0 4px 12px rgba(236, 72, 153, 0.3)' 
                        : '0 4px 12px rgba(0, 0, 0, 0.2)',
                      transform: activeTab === tab.id ? 'translateY(-2px)' : 'translateY(0)',
                      backdropFilter: 'blur(10px)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: '80px',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    onMouseEnter={(e) => {
                      if (activeTab !== tab.id) {
                        (e.target as HTMLButtonElement).style.transform = 'translateY(-1px)';
                        (e.target as HTMLButtonElement).style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.3)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeTab !== tab.id) {
                        (e.target as HTMLButtonElement).style.transform = 'translateY(0)';
                        (e.target as HTMLButtonElement).style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
                      }
                    }}
                  >
                    <span>{tab.label}</span>
                    {activeTab === tab.id && (
                      <div style={{
                        position: 'absolute',
                        bottom: '0',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '20px',
                        height: '3px',
                        background: 'rgba(255, 255, 255, 0.8)',
                        borderRadius: '2px'
                      }}></div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Tab Content */}
            <div style={{
              display: window.innerWidth < 1024 ? 'block' : 'none',
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(236, 72, 153, 0.05) 100%)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(139, 92, 246, 0.15)',
              borderRadius: '24px',
              margin: '0.75rem',
              padding: '1.5rem',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4), 0 8px 16px rgba(139, 92, 246, 0.1)',
              minHeight: '200px',
              maxHeight: '300px',
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch',
              position: 'relative',
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box'
            }}>
              {activeTab === 'character' && (
                <CharacterProgression
                  characterStats={characterStats}
                  onStatsUpdate={(stats) => setCharacterStats(prev => ({ ...prev, ...stats }))}
                />
              )}
              {activeTab === 'quests' && (
                <div>
                  <QuestSystem
                    quests={quests}
                    onUpdateQuest={handleUpdateQuest}
                    onCompleteQuest={handleCompleteQuest}
                    onAcceptQuest={handleAcceptQuest}
                    onDeclineQuest={handleDeclineQuest}
                  />
                  {/* Test button to add a quest */}
                  <button
                    onClick={() => {
                      const testQuest: Quest = {
                        id: Date.now().toString(),
                        title: 'Test Quest',
                        description: 'This is a test quest to verify the quest system is working.',
                        questGiver: 'Test NPC',
                        xpReward: 100,
                        goldReward: 50,
                        status: 'active',
                        createdAt: new Date(),
                        type: 'side',
                        objectives: ['Complete the test', 'Return to NPC']
                      };
                      handleAcceptQuest(testQuest);
                    }}
                    style={{
                      marginTop: '1rem',
                      padding: '0.5rem 1rem',
                      background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                      border: 'none',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '0.875rem',
                      cursor: 'pointer'
                    }}
                  >
                    Add Test Quest
                  </button>
                </div>
              )}
              {activeTab === 'combat' && (
                <CombatSystem
                  characterStats={characterStats}
                  onCombatEnd={handleCombatEnd}
                />
              )}
              
              {/* Action Log for Mobile */}
              {activeTab === 'actions' && (
                <ActionLog 
                  entries={actionLog} 
                  onClear={() => setActionLog([])}
                />
              )}
            </div>

            {/* Messages */}
            <div 
              ref={messagesContainerRef}
              style={{ 
                flex: 1,
                padding: '1rem',
                overflowY: 'auto',
                overflowX: 'hidden',
                maxHeight: window.innerWidth < 1024 ? 'calc(100vh - 600px)' : 'calc(100vh - 300px)',
                WebkitOverflowScrolling: 'touch',
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(236, 72, 153, 0.03) 100%)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(139, 92, 246, 0.15)',
                borderRadius: '24px',
                margin: '0.75rem',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4), 0 8px 16px rgba(139, 92, 246, 0.1)',
                width: '100%',
                maxWidth: '100%',
                boxSizing: 'border-box',
                position: 'relative'
              }}
              onScroll={handleScroll}
            >
              {/* Show inventory content when inventory tab is selected */}
              {activeTab === 'inventory' && (
                <div style={{
                  background: 'rgba(26, 26, 46, 0.8)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(139, 92, 246, 0.2)',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  marginBottom: '1rem'
                }}>
                  <InventorySystem
                    ref={inventoryRef}
                    characterStats={characterStats}
                    onInventoryChange={(newInventory) => {
                      console.log('Parent inventory changed (main area), new count:', newInventory.length, 'items:', newInventory.map(i => i.name));
                      setInventory(newInventory);
                    }}
                    initialInventory={inventory}
                  />
                </div>
              )}
              
              {/* Show character stats when character tab is selected */}
              {activeTab === 'character' && (
                <div style={{
                  background: 'rgba(26, 26, 46, 0.8)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(139, 92, 246, 0.2)',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  marginBottom: '1rem'
                }}>
                  <CharacterProgression
                    characterStats={characterStats}
                    onStatsUpdate={(stats) => setCharacterStats(prev => ({ ...prev, ...stats }))}
                  />
                </div>
              )}
              
              {/* Show combat system when combat tab is selected */}
        {activeTab === 'combat' && (
          <div style={{
            background: 'rgba(26, 26, 46, 0.8)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(139, 92, 246, 0.2)',
            borderRadius: '16px',
            padding: '1.5rem',
            marginBottom: '1rem'
          }}>
            <CombatSystem
              characterStats={characterStats}
              onCombatEnd={handleCombatEnd}
            />
          </div>
        )}
              
              {/* Combat Popup - shows above chat when in combat */}
              {isInCombat && enemyStats && activeTab === 'chat' && (
                <div style={{
                  position: 'sticky',
                  top: '0',
                  zIndex: 10,
                  background: 'rgba(0, 0, 0, 0.9)',
                  border: '2px solid #8b5cf6',
                  borderRadius: '12px',
                  padding: '1rem',
                  marginBottom: '1rem',
                  backdropFilter: 'blur(10px)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ color: '#8b5cf6', margin: 0, fontSize: '16px' }}>
                      ⚔️ Combat in Progress
                    </h3>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <span style={{ color: '#e2e8f0', fontSize: '12px' }}>
                        Round {combatRound}
                      </span>
                      <div style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        background: combatTurn === 'player' ? '#10b981' : '#ef4444',
                        color: 'white',
                        fontSize: '11px',
                        fontWeight: 'bold'
                      }}>
                        {combatTurn === 'player' ? 'Your Turn' : `${enemyStats.name}'s Turn`}
                      </div>
                    </div>
                  </div>
                  
                  {/* Player Health Bar */}
                  <div style={{ marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '12px' }}>
                        {characterStats.name || 'Player'}
                      </span>
                      <span style={{ color: '#10b981', fontSize: '12px' }}>
                        {characterStats.hp || 10}/{characterStats.maxHp || 10} HP
                      </span>
                    </div>
                    <div style={{
                      width: '100%',
                      height: '12px',
                      background: 'rgba(0, 0, 0, 0.3)',
                      borderRadius: '6px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${((characterStats.hp || 10) / (characterStats.maxHp || 10)) * 100}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #10b981, #34d399)',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>

                  {/* Enemy Health Bar */}
                  <div style={{ marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '12px' }}>
                        {enemyStats.name}
                      </span>
                      <span style={{ color: '#ef4444', fontSize: '12px' }}>
                        {enemyStats.currentHp || enemyStats.hp}/{enemyStats.maxHp || enemyStats.hp} HP
                      </span>
                    </div>
                    <div style={{
                      width: '100%',
                      height: '12px',
                      background: 'rgba(0, 0, 0, 0.3)',
                      borderRadius: '6px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${((enemyStats.currentHp || enemyStats.hp) / (enemyStats.maxHp || enemyStats.hp)) * 100}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #ef4444, #f87171)',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>

                  {/* Combat Log */}
                  {combatLog.length > 0 && (
                    <div style={{
                      maxHeight: '60px',
                      overflowY: 'auto',
                      background: 'rgba(0, 0, 0, 0.3)',
                      padding: '0.5rem',
                      borderRadius: '6px'
                    }}>
                      {combatLog.slice(-3).map((log, index) => (
                        <div key={index} style={{ color: '#e2e8f0', fontSize: '11px', marginBottom: '0.25rem' }}>
                          {log}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Show chat messages when chat tab is selected */}
              {activeTab === 'chat' && messages.map((message) => (
                <div
                  key={message.id}
                  style={{
                    background: message.role === 'user' 
                      ? 'rgba(139, 92, 246, 0.1)' 
                      : 'rgba(26, 26, 46, 0.8)',
                    backdropFilter: 'blur(10px)',
                    border: message.role === 'user' 
                      ? '1px solid rgba(139, 92, 246, 0.3)' 
                      : '1px solid rgba(139, 92, 246, 0.2)',
                    borderRadius: '16px',
                    padding: window.innerWidth < 1024 ? '1rem' : '1.5rem',
                    marginBottom: '1rem',
                    transition: 'all 0.3s ease',
                    width: '100%',
                    maxWidth: '100%',
                    boxSizing: 'border-box',
                    overflow: 'hidden',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word'
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: window.innerWidth < 1024 ? '0.5rem' : '0.75rem', 
                    marginBottom: '1rem',
                    width: '100%',
                    maxWidth: '100%',
                    boxSizing: 'border-box'
                  }}>
                    <div style={{
                      width: window.innerWidth < 1024 ? '32px' : '40px',
                      height: window.innerWidth < 1024 ? '32px' : '40px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: window.innerWidth < 1024 ? '1rem' : '1.25rem',
                      background: message.role === 'user' 
                        ? 'linear-gradient(135deg, #8b5cf6, #ec4899)' 
                        : 'linear-gradient(135deg, #1e40af, #3b82f6)',
                      color: 'white',
                      flexShrink: 0
                    }}>
                      {message.role === 'user' ? '👤' : '🧙‍♂️'}
                    </div>
                    <div style={{ 
                      fontSize: window.innerWidth < 1024 ? '0.75rem' : '0.875rem', 
                      color: '#94a3b8',
                      flex: 1,
                      minWidth: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {message.role === 'user' ? 'You' : 'Dungeon Master'} • {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                  <div style={{ 
                    color: '#e2e8f0', 
                    lineHeight: '1.6',
                    fontSize: window.innerWidth < 1024 ? '0.9rem' : '1rem',
                    width: '100%',
                    maxWidth: '100%',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-wrap',
                    hyphens: 'auto',
                    WebkitHyphens: 'auto',
                    msHyphens: 'auto'
                  }}>
                    {message.content}
                  </div>
                </div>
              ))}

              {diceRolling && (
                <div
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    borderRadius: '16px',
                    padding: '1.5rem',
                    marginBottom: '1rem',
                    animation: 'diceRoll 1.5s ease-in-out',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '1rem'
                  }}
                >
                  <div style={{
                    fontSize: '2rem',
                    animation: 'diceSpin 0.5s linear infinite'
                  }}>
                    🎲
                  </div>
                  <div style={{ 
                    color: 'white', 
                    fontSize: '1.2rem',
                    fontWeight: 'bold'
                  }}>
                    The Dungeon Master is rolling dice...
                  </div>
                </div>
              )}

              {isLoading && (
                <div style={{
                  background: 'rgba(26, 26, 46, 0.8)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(139, 92, 246, 0.2)',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.25rem',
                      background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
                      color: 'white'
                    }}>
                      🧙‍♂️
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
                      Dungeon Master • thinking...
                    </div>
                  </div>
                  <div style={{ 
                    color: '#e2e8f0', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.75rem' 
                  }}>
                    The AI is crafting your adventure...
                  </div>
                </div>
              )}
              
              {/* Invisible element to scroll to */}
              <div ref={messagesEndRef} />
              
              {/* Scroll to bottom button */}
              {showScrollButton && (
                <button
                  onClick={scrollToBottom}
                  style={{
                    position: 'fixed',
                    bottom: '5rem',
                    right: '1.5rem',
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                    color: 'white',
                    border: 'none',
                    fontSize: '1.25rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)',
                    zIndex: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(139, 92, 246, 0.5)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(139, 92, 246, 0.4)';
                  }}
                  title="Scroll to bottom"
                >
                  ↓
                </button>
              )}
            </div>

            {/* Input */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(236, 72, 153, 0.05) 100%)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(139, 92, 246, 0.15)',
              borderRadius: '24px',
              margin: '0.75rem',
              padding: '1.25rem',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4), 0 8px 16px rgba(139, 92, 246, 0.1)',
              position: 'relative',
              overflow: 'hidden',
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box'
            }}>
              {/* Decorative background elements */}
              <div style={{
                position: 'absolute',
                top: '-40%',
                right: '-20%',
                width: '150px',
                height: '150px',
                background: 'radial-gradient(circle, rgba(139, 92, 246, 0.05) 0%, transparent 70%)',
                borderRadius: '50%',
                zIndex: 0
              }}></div>
              <div style={{
                position: 'absolute',
                bottom: '-30%',
                left: '-10%',
                width: '100px',
                height: '100px',
                background: 'radial-gradient(circle, rgba(236, 72, 153, 0.03) 0%, transparent 70%)',
                borderRadius: '50%',
                zIndex: 0
              }}></div>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                if (inputMessage.trim() && !isLoading) {
                  handleSendMessage(inputMessage.trim());
                  setInputMessage('');
                }
              }}>
                <div style={{ 
                  display: 'flex', 
                  gap: window.innerWidth < 1024 ? '0.75rem' : '1rem',
                  alignItems: 'center',
                  position: 'relative',
                  zIndex: 1
                }}>
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={isInCombat ? "Combat in progress - use the combat overlay above" : "What would you like to do, adventurer?"}
                  disabled={isLoading || characterStats.isDead || isInCombat}
                  style={{
                    flex: 1,
                    padding: '1.25rem 1.5rem',
                    background: 'rgba(15, 15, 35, 0.9)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: '20px',
                    color: '#e2e8f0',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    minHeight: '56px',
                    WebkitAppearance: 'none',
                    boxShadow: 'inset 0 4px 8px rgba(0, 0, 0, 0.2), 0 2px 4px rgba(139, 92, 246, 0.1)',
                    backdropFilter: 'blur(10px)',
                    width: '100%',
                    maxWidth: '100%',
                    boxSizing: 'border-box'
                  }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'rgba(139, 92, 246, 0.5)';
                      e.target.style.background = 'rgba(15, 15, 35, 0.8)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(139, 92, 246, 0.3)';
                      e.target.style.background = 'rgba(15, 15, 35, 0.6)';
                    }}
                  />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isLoading || characterStats.isDead}
                  style={{
                    padding: '1.25rem 1.75rem',
                    background: (!inputMessage.trim() || isLoading || characterStats.isDead) 
                      ? 'rgba(55, 65, 81, 0.5)' 
                      : 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                    border: 'none',
                    borderRadius: '20px',
                    color: 'white',
                    fontSize: '1.25rem',
                    cursor: (!inputMessage.trim() || isLoading || characterStats.isDead) ? 'not-allowed' : 'pointer',
                    opacity: (!inputMessage.trim() || isLoading || characterStats.isDead) ? 0.5 : 1,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '70px',
                    minHeight: '56px',
                    boxShadow: (!inputMessage.trim() || isLoading || characterStats.isDead) 
                      ? 'none' 
                      : '0 8px 25px rgba(139, 92, 246, 0.4), 0 4px 12px rgba(236, 72, 153, 0.3)',
                    WebkitAppearance: 'none',
                    touchAction: 'manipulation',
                    backdropFilter: 'blur(10px)',
                    flexShrink: 0,
                    position: 'relative',
                    overflow: 'hidden'
                  }}
      onMouseEnter={(e) => {
        if (!(!inputMessage.trim() || isLoading || characterStats.isDead)) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 12px 30px rgba(139, 92, 246, 0.5), 0 6px 15px rgba(236, 72, 153, 0.3)';
        }
      }}
      onMouseLeave={(e) => {
        if (!(!inputMessage.trim() || isLoading || characterStats.isDead)) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 8px 25px rgba(139, 92, 246, 0.4), 0 4px 12px rgba(236, 72, 153, 0.3)';
        }
      }}
                >
                  <span>
                    {isLoading ? '⏳' : '🚀'}
                  </span>
                </button>
                </div>
              </form>
            </div>
              </div>

              {/* Action Log - Desktop */}
              <div style={{ 
                width: '300px', 
                display: window.innerWidth >= 1024 ? 'block' : 'none',
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(236, 72, 153, 0.05) 100%)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(139, 92, 246, 0.15)',
                borderRadius: '24px',
                padding: '1.5rem',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4), 0 8px 16px rgba(139, 92, 246, 0.1)',
                position: 'relative',
                overflow: 'hidden',
                margin: '1rem'
              }}>
                <ActionLog 
                  entries={actionLog} 
                  onClear={() => setActionLog([])}
                />
              </div>
            </div>
          </div>
        </div>
        </div> {/* Close padding div for fixed header */}
      </div>

      {/* Floating Quest Window */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: isQuestWindowMinimized ? '200px' : '350px',
          height: isQuestWindowMinimized ? '50px' : '400px',
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(236, 72, 153, 0.05) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          borderRadius: '16px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
          transition: 'all 0.3s ease',
          overflow: 'hidden'
        }}>
          {/* Window Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            background: 'rgba(139, 92, 246, 0.1)',
            borderBottom: '1px solid rgba(139, 92, 246, 0.2)',
            cursor: 'pointer'
          }}
          onClick={() => setIsQuestWindowMinimized(!isQuestWindowMinimized)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px' }}>📜</span>
              <span style={{ 
                color: '#e2e8f0', 
                fontWeight: '600',
                fontSize: '14px'
              }}>
                Quests
              </span>
              <div style={{
                background: 'rgba(16, 185, 129, 0.2)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '12px',
                padding: '2px 8px',
                fontSize: '12px',
                color: '#10b981',
                fontWeight: '600'
              }}>
                {quests.filter(q => q.status === 'active').length} Active
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsQuestWindowMinimized(!isQuestWindowMinimized);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px',
                fontSize: '12px'
              }}
            >
              {isQuestWindowMinimized ? '⬆️' : '⬇️'}
            </button>
          </div>

          {/* Window Content */}
          {!isQuestWindowMinimized && (
            <div style={{
              height: 'calc(100% - 50px)',
              overflowY: 'auto',
              padding: '16px'
            }}>
              {quests.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  color: '#94a3b8',
                  fontSize: '14px',
                  padding: '20px'
                }}>
                  No active quests. Explore the world to find new adventures!
                  <br /><br />
                  <button
                    onClick={() => {
                      const testQuest: Quest = {
                        id: Date.now().toString(),
                        title: 'Debug Test Quest',
                        description: 'This is a test quest to verify the quest system is working.',
                        questGiver: 'Debug System',
                        xpReward: 100,
                        goldReward: 50,
                        status: 'active',
                        createdAt: new Date(),
                        type: 'side',
                        objectives: ['Test the quest system', 'Verify quest display']
                      };
                      handleAcceptQuest(testQuest);
                    }}
                    style={{
                      marginTop: '10px',
                      padding: '8px 12px',
                      background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                      border: 'none',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    Add Test Quest
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {quests.filter(q => q.status === 'active').map(quest => (
                    <div key={quest.id} style={{
                      background: 'rgba(15, 15, 35, 0.6)',
                      border: '1px solid rgba(139, 92, 246, 0.2)',
                      borderRadius: '12px',
                      padding: '12px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <h4 style={{
                          color: '#e2e8f0',
                          fontSize: '14px',
                          fontWeight: '600',
                          margin: 0
                        }}>
                          {quest.title}
                        </h4>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <div style={{
                            background: 'rgba(16, 185, 129, 0.1)',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            borderRadius: '8px',
                            padding: '2px 6px',
                            fontSize: '10px',
                            color: '#10b981',
                            fontWeight: '600'
                          }}>
                            {quest.xpReward} XP
                          </div>
                          {quest.goldReward && quest.goldReward > 0 && (
                            <div style={{
                              background: 'rgba(245, 158, 11, 0.1)',
                              border: '1px solid rgba(245, 158, 11, 0.3)',
                              borderRadius: '8px',
                              padding: '2px 6px',
                              fontSize: '10px',
                              color: '#f59e0b',
                              fontWeight: '600'
                            }}>
                              {quest.goldReward} Gold
                            </div>
                          )}
                        </div>
                      </div>
                      <p style={{
                        color: '#94a3b8',
                        fontSize: '12px',
                        margin: '0 0 8px 0',
                        lineHeight: '1.4'
                      }}>
                        {quest.description}
                      </p>
                      <div style={{
                        color: '#a78bfa',
                        fontSize: '11px',
                        fontStyle: 'italic'
                      }}>
                        From: {quest.questGiver}
                      </div>
                      {quest.objectives && quest.objectives.length > 0 && (
                        <div style={{ marginTop: '8px' }}>
                          <div style={{
                            color: '#e2e8f0',
                            fontSize: '11px',
                            fontWeight: '600',
                            marginBottom: '4px'
                          }}>
                            Objectives:
                          </div>
                          <ul style={{
                            color: '#94a3b8',
                            fontSize: '11px',
                            margin: 0,
                            paddingLeft: '16px'
                          }}>
                            {quest.objectives.map((objective, index) => (
                              <li key={index} style={{ marginBottom: '2px' }}>
                                {objective}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

      {/* Quest Popup */}
      {showQuestPopup && pendingQuest && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(236, 72, 153, 0.05) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: '24px',
            padding: '2rem',
            maxWidth: '500px',
            width: '100%',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Decorative elements */}
            <div style={{
              position: 'absolute',
              top: '-20%',
              right: '-20%',
              width: '150px',
              height: '150px',
              background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)',
              borderRadius: '50%'
            }}></div>
            
            <div style={{ position: 'relative', zIndex: 1 }}>
              {/* Quest Header */}
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{
                  fontSize: '2rem',
                  marginBottom: '0.5rem'
                }}>📜</div>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  marginBottom: '0.5rem'
                }}>
                  {pendingQuest.title}
                </h2>
                <div style={{
                  color: '#94a3b8',
                  fontSize: '0.9rem'
                }}>
                  Quest from: <span style={{ color: '#e2e8f0', fontWeight: '600' }}>{pendingQuest.questGiver}</span>
                </div>
              </div>

              {/* Quest Description */}
              <div style={{
                background: 'rgba(15, 15, 35, 0.6)',
                border: '1px solid rgba(139, 92, 246, 0.2)',
                borderRadius: '16px',
                padding: '1.5rem',
                marginBottom: '1.5rem'
              }}>
                <h3 style={{
                  color: '#e2e8f0',
                  fontSize: '1rem',
                  fontWeight: '600',
                  marginBottom: '0.75rem'
                }}>Description:</h3>
                <p style={{
                  color: '#94a3b8',
                  lineHeight: '1.6',
                  margin: 0
                }}>
                  {pendingQuest.description}
                </p>
              </div>

              {/* Quest Objectives */}
              {pendingQuest.objectives && pendingQuest.objectives.length > 0 && (
                <div style={{
                  background: 'rgba(15, 15, 35, 0.6)',
                  border: '1px solid rgba(139, 92, 246, 0.2)',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  marginBottom: '1.5rem'
                }}>
                  <h3 style={{
                    color: '#e2e8f0',
                    fontSize: '1rem',
                    fontWeight: '600',
                    marginBottom: '0.75rem'
                  }}>Objectives:</h3>
                  <ul style={{
                    color: '#94a3b8',
                    margin: 0,
                    paddingLeft: '1.5rem'
                  }}>
                    {pendingQuest.objectives.map((objective, index) => (
                      <li key={index} style={{ marginBottom: '0.5rem' }}>
                        {objective}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Rewards */}
              <div style={{
                background: 'rgba(15, 15, 35, 0.6)',
                border: '1px solid rgba(139, 92, 246, 0.2)',
                borderRadius: '16px',
                padding: '1.5rem',
                marginBottom: '2rem'
              }}>
                <h3 style={{
                  color: '#e2e8f0',
                  fontSize: '1rem',
                  fontWeight: '600',
                  marginBottom: '0.75rem'
                }}>Rewards:</h3>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '12px',
                    padding: '0.75rem 1rem'
                  }}>
                    <span style={{ fontSize: '1.2rem' }}>⭐</span>
                    <span style={{ color: '#10b981', fontWeight: '600' }}>
                      {pendingQuest.xpReward} XP
                    </span>
                  </div>
                  {pendingQuest.goldReward && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      background: 'rgba(245, 158, 11, 0.1)',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      borderRadius: '12px',
                      padding: '0.75rem 1rem'
                    }}>
                      <span style={{ fontSize: '1.2rem' }}>🪙</span>
                      <span style={{ color: '#f59e0b', fontWeight: '600' }}>
                        {pendingQuest.goldReward} Gold
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={() => {
                    handleAcceptQuest(pendingQuest);
                    setShowQuestPopup(false);
                    setPendingQuest(null);
                  }}
                  style={{
                    flex: 1,
                    padding: '1rem',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    border: 'none',
                    borderRadius: '16px',
                    color: 'white',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 8px 25px rgba(16, 185, 129, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 12px 35px rgba(16, 185, 129, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.3)';
                  }}
                >
                  ✅ Accept Quest
                </button>
                <button
                  onClick={() => {
                    handleDeclineQuest(pendingQuest.id);
                    setShowQuestPopup(false);
                    setPendingQuest(null);
                  }}
                  style={{
                    flex: 1,
                    padding: '1rem',
                    background: 'rgba(55, 65, 81, 0.6)',
                    border: '1px solid rgba(55, 65, 81, 0.3)',
                    borderRadius: '16px',
                    color: '#94a3b8',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(55, 65, 81, 0.8)';
                    e.currentTarget.style.color = '#e2e8f0';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(55, 65, 81, 0.6)';
                    e.currentTarget.style.color = '#94a3b8';
                  }}
                >
                  ❌ Decline
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Combat Suggestions Above Chat */}
      {isInCombat && combatTurn === 'player' && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.9) 0%, rgba(185, 28, 28, 0.9) 100%)',
          border: '2px solid rgba(239, 68, 68, 0.6)',
          borderRadius: '12px',
          padding: '15px',
          marginBottom: '20px',
          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '10px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span style={{ fontSize: '18px' }}>⚔️</span>
              <div>
                <h3 style={{
                  color: '#ffffff',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  margin: 0
                }}>
                  Combat in Progress
                </h3>
                <p style={{
                  color: '#fecaca',
                  fontSize: '12px',
                  margin: 0
                }}>
                  Your Turn - {characterStats.name}: {characterStats.hp}/{characterStats.maxHp} HP | {enemyStats?.name}: {enemyStats?.hp || 0}/{enemyStats?.maxHp || 0} HP
                </p>
              </div>
            </div>
            <button
              onClick={() => endCombat(false)}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '6px',
                padding: '6px 10px',
                color: '#ffffff',
                fontSize: '11px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Flee
            </button>
          </div>

          <div style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap'
          }}>
            {combatActions.slice(0, 4).map((action, index) => (
              <button
                key={index}
                onClick={() => performCombatAction(action)}
                style={{
                  background: 'rgba(59, 130, 246, 0.8)',
                  border: '1px solid rgba(59, 130, 246, 0.6)',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  color: '#ffffff',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(59, 130, 246, 1)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(59, 130, 246, 0.8)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {action}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* 3D Dice Roller Component */}
      {(diceRolling || showDiceResult) && (
        <DiceRoller3D 
          dice={currentDice}
          onRollComplete={handleDiceRollComplete}
          isRolling={diceRolling}
          onClose={handleDiceClose}
          playerName={characterStats.name || "Player"}
          enemyName={enemyStats?.name || "Enemy"}
        />
      )}
    </div>
  );
}