'use client';

import React, { useState, useRef, useEffect } from 'react';
import { CharacterStats, Message } from '../types/index';
import AdvancedDiceRoller from '../components/AdvancedDiceRoller';
import InventorySystem, { InventorySystemRef } from '../components/InventorySystem';
import ActionLog from '../components/ActionLog';

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
import { authService, characterService, getSupabase } from '../lib/supabase-auth';
import { adventureService } from '../lib/adventure-service';
import MultiplayerLobby from '../components/MultiplayerLobby';
import MultiplayerGameWithAI from '../components/MultiplayerGameWithAI';
import GameModeSelector from '../components/GameModeSelector';

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);

  // Add global styles to prevent overflow
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      * {
        box-sizing: border-box;
      }
      html, body {
        width: 100%;
        max-width: 100vw;
        overflow-x: hidden;
        margin: 0;
        padding: 0;
      }
      #__next {
        width: 100%;
        max-width: 100vw;
        overflow-x: hidden;
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

  const [activeTab, setActiveTab] = useState<'chat' | 'character' | 'inventory' | 'combat' | 'actions'>('chat');
  const [diceRolling, setDiceRolling] = useState(false);
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

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
  }, [messages, characterStats, inventory, user, selectedCharacter]);

  // Save on page unload to prevent data loss
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (user && selectedCharacter && messages.length > 0) {
        // Use sendBeacon for reliable saving on page unload
        const sessionData = {
          messages,
          characterStats,
          inventory,
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
  }, [user, selectedCharacter, messages, characterStats, inventory]);

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
          onDiceRoll: 'handleAIDiceRoll' // Signal to AI that dice rolling is available
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      // Handle items from AI response
      console.log('AI response data:', data);
      console.log('Items from AI:', data.items);
      console.log('Stat changes from AI:', data.statChanges);
      
      // Check if AI wants to roll dice
      if (data.diceRoll) {
        handleAIDiceRoll(data.diceRoll);
      }
      
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

      // Handle dice rolling from AI response
      if (data.diceRoll) {
        console.log('AI wants to roll dice:', data.diceRoll);
        handleAIDiceRoll(data.diceRoll);
      }

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
                    onChange={(e) => setCharacterStats(prev => ({ ...prev, class: e.target.value }))}
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
                    <div style={{ color: '#94a3b8', fontSize: '1rem' }}>
                      {characterStats.race || 'Unknown'} {characterStats.class || 'Adventurer'}
                    </div>
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
          {/* Decorative background elements */}
          <div style={{
            position: 'absolute',
            top: '-50%',
            right: '-20%',
            width: '200px',
            height: '200px',
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)',
            borderRadius: '50%',
            zIndex: 0
          }}></div>
          <div style={{
            position: 'absolute',
            bottom: '-30%',
            left: '-10%',
            width: '150px',
            height: '150px',
            background: 'radial-gradient(circle, rgba(236, 72, 153, 0.08) 0%, transparent 70%)',
            borderRadius: '50%',
            zIndex: 0
          }}></div>
          
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
                boxShadow: '0 8px 20px rgba(139, 92, 246, 0.3)'
              }}>
                ⚔️
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
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)', 
            gap: '0.75rem',
            position: 'relative',
            zIndex: 1
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
        </div>

        <div style={{ 
          display: window.innerWidth < 1024 ? 'flex' : 'flex', 
          flexDirection: window.innerWidth < 1024 ? 'column' : 'row', 
          minHeight: '100vh',
          width: '100%',
          maxWidth: '100vw',
          boxSizing: 'border-box',
          overflow: 'hidden',
          background: window.innerWidth < 1024 ? 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)' : 'transparent'
        }}>
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
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
                  marginTop: '1rem',
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
              {/* Decorative background elements */}
              <div style={{
                position: 'absolute',
                top: '-30%',
                right: '-10%',
                width: '200px',
                height: '200px',
                background: 'radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 70%)',
                borderRadius: '50%',
                zIndex: 0
              }}></div>
              <div style={{
                position: 'absolute',
                bottom: '-20%',
                left: '-5%',
                width: '150px',
                height: '150px',
                background: 'radial-gradient(circle, rgba(236, 72, 153, 0.05) 0%, transparent 70%)',
                borderRadius: '50%',
                zIndex: 0
              }}></div>
              
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
                    boxShadow: '0 12px 24px rgba(139, 92, 246, 0.3)'
                  }}>
                    ⚔️
                  </div>
                  <div>
                    <h1 style={{
                      fontSize: '2.5rem',
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
                  { id: 'chat', label: '💬 Chat', icon: '💬' },
                  { id: 'character', label: '📈 Stats', icon: '📈' },
                  { id: 'inventory', label: '🎒 Items', icon: '🎒' },
                  { id: 'combat', label: '⚔️ Combat', icon: '⚔️' }
                ].map((tab) => (
                  <button
                    key={tab.id}
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
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.3)';
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
                    <span>{tab.icon}</span>
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
                  { id: 'chat', label: 'Chat', icon: '💬', color: 'rgba(139, 92, 246, 0.1)' },
                  { id: 'character', label: 'Stats', icon: '📈', color: 'rgba(16, 185, 129, 0.1)' },
                  { id: 'inventory', label: 'Items', icon: '🎒', color: 'rgba(245, 158, 11, 0.1)' },
                  { id: 'combat', label: 'Combat', icon: '⚔️', color: 'rgba(239, 68, 68, 0.1)' },
                  { id: 'actions', label: 'Actions', icon: '📋', color: 'rgba(99, 102, 241, 0.1)' }
                ].map((tab) => (
                  <button
                    key={tab.id}
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
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.25rem',
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
                    <span style={{ fontSize: '1.2rem' }}>{tab.icon}</span>
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
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(236, 72, 153, 0.03) 100%)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(139, 92, 246, 0.15)',
              borderRadius: '24px',
              margin: '0.75rem',
              padding: '1.5rem',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4), 0 8px 16px rgba(139, 92, 246, 0.1)',
              minHeight: '250px',
              maxHeight: '350px',
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {activeTab === 'character' && (
                <CharacterProgression
                  characterStats={characterStats}
                  onStatsUpdate={(stats) => setCharacterStats(prev => ({ ...prev, ...stats }))}
                />
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
                padding: window.innerWidth < 1024 ? '1rem' : '1rem',
                overflowY: 'auto',
                overflowX: 'hidden', // Prevent horizontal overflow
                maxHeight: window.innerWidth < 1024 ? 'calc(100vh - 500px)' : 'calc(100vh - 300px)',
                WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
                background: window.innerWidth < 1024 ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.03) 0%, rgba(236, 72, 153, 0.02) 100%)' : 'transparent',
                backdropFilter: window.innerWidth < 1024 ? 'blur(20px)' : 'none',
                border: window.innerWidth < 1024 ? '1px solid rgba(139, 92, 246, 0.15)' : 'none',
                borderRadius: window.innerWidth < 1024 ? '24px' : '0',
                margin: window.innerWidth < 1024 ? '0.75rem' : '0',
                boxShadow: window.innerWidth < 1024 ? '0 20px 40px rgba(0, 0, 0, 0.4), 0 8px 16px rgba(139, 92, 246, 0.1)' : 'none',
                width: '100%',
                maxWidth: '100%',
                boxSizing: 'border-box',
                position: 'relative',
                overflow: 'hidden'
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
                    <div style={{
                      width: '20px',
                      height: '20px',
                      border: '2px solid rgba(139, 92, 246, 0.3)',
                      borderTop: '2px solid #8b5cf6',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
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
              margin: '1rem',
              padding: '1.5rem',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4), 0 8px 16px rgba(139, 92, 246, 0.1)',
              position: 'relative',
              overflow: 'hidden'
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
                    placeholder="What would you like to do, adventurer?"
                    disabled={isLoading || characterStats.isDead}
                    style={{
                      flex: 1,
                      padding: window.innerWidth < 1024 ? '1.25rem 1.5rem' : '1rem 1.25rem',
                      background: 'rgba(15, 15, 35, 0.9)',
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                      borderRadius: window.innerWidth < 1024 ? '20px' : '12px',
                      color: '#e2e8f0',
                      fontSize: window.innerWidth < 1024 ? '1rem' : '1rem',
                      outline: 'none',
                      transition: 'all 0.3s ease',
                      minHeight: window.innerWidth < 1024 ? '56px' : 'auto',
                      WebkitAppearance: 'none',
                      boxShadow: 'inset 0 4px 8px rgba(0, 0, 0, 0.2), 0 2px 4px rgba(139, 92, 246, 0.1)',
                      backdropFilter: 'blur(10px)'
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
                      padding: window.innerWidth < 1024 ? '1.25rem 1.75rem' : '1rem 1.5rem',
                      background: (!inputMessage.trim() || isLoading || characterStats.isDead) 
                        ? 'rgba(55, 65, 81, 0.5)' 
                        : 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                      border: 'none',
                      borderRadius: window.innerWidth < 1024 ? '20px' : '12px',
                      color: 'white',
                      fontSize: window.innerWidth < 1024 ? '1.25rem' : '1.25rem',
                      cursor: (!inputMessage.trim() || isLoading || characterStats.isDead) ? 'not-allowed' : 'pointer',
                      opacity: (!inputMessage.trim() || isLoading || characterStats.isDead) ? 0.5 : 1,
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: window.innerWidth < 1024 ? '70px' : '60px',
                      minHeight: window.innerWidth < 1024 ? '56px' : 'auto',
                      boxShadow: (!inputMessage.trim() || isLoading || characterStats.isDead) 
                        ? 'none' 
                        : '0 8px 25px rgba(139, 92, 246, 0.4), 0 4px 12px rgba(236, 72, 153, 0.3)',
                      WebkitAppearance: 'none',
                      touchAction: 'manipulation',
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    {isLoading ? '⏳' : '🚀'}
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
    </div>
  );
}