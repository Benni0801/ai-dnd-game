'use client';

import React, { useState, useRef, useEffect } from 'react';
import { CharacterStats, Message } from '../types';
import AdvancedDiceRoller from '../components/AdvancedDiceRoller';
import InventorySystem from '../components/InventorySystem';
import CombatSystem from '../components/CombatSystem';
import CharacterProgression from '../components/CharacterProgression';
import SupabaseAuthModal from '../components/SupabaseAuthModal';
import SupabaseCharacterSelector from '../components/SupabaseCharacterSelector';
import HomePage from '../components/HomePage';
import { authService, characterService } from '../lib/supabase-auth';
import { adventureService } from '../lib/adventure-service';

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCharacterCreation, setShowCharacterCreation] = useState(false);
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
  const [showScrollButton, setShowScrollButton] = useState(false);
  
  // Authentication state
  const [user, setUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCharacterSelector, setShowCharacterSelector] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<any>(null);
  const [showHomePage, setShowHomePage] = useState(true);
  
  // Refs for auto-scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
    if (user && selectedCharacter && messages.length > 0) {
      const saveSession = async () => {
        try {
          const sessionData = {
            messages,
            characterStats,
            lastSaved: new Date().toISOString()
          };
          
          await adventureService.saveAdventureSession(user.id, selectedCharacter.id, sessionData);
          console.log('Adventure session auto-saved');
        } catch (error) {
          console.error('Error auto-saving adventure session:', error);
        }
      };

      // Debounce auto-save to avoid too many saves
      const timeoutId = setTimeout(saveSession, 2000);
      return () => clearTimeout(timeoutId);
    }
  }, [messages, characterStats, user, selectedCharacter]);

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
          setShowHomePage(false);
          setShowCharacterSelector(true);
          setShowCharacterCreation(false);
        } else {
          setShowHomePage(true);
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        setShowHomePage(true);
      }
    };

    checkAuth();

    // Listen for auth state changes
    const { data: { subscription } } = authService.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        setShowHomePage(false);
        setShowCharacterSelector(true);
        setShowCharacterCreation(false);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setShowHomePage(true);
        setShowCharacterSelector(false);
        setShowCharacterCreation(false);
        setMessages([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Authentication handlers
  const handleLogin = (userData: any) => {
    setUser(userData);
    setShowHomePage(false);
    setShowAuthModal(false);
    setShowCharacterSelector(true);
    setShowCharacterCreation(false);
  };

  const handleLogout = async () => {
    try {
      await authService.signOut();
      setUser(null);
      setSelectedCharacter(null);
      setShowHomePage(true);
      setShowCharacterSelector(false);
      setShowCharacterCreation(false);
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
    // This will be handled by the HomePage component's modal
    console.log('Start game clicked - handled by HomePage modal');
  };

  const handleHomeLogin = () => {
    // This will be handled by the HomePage component's modal
    console.log('Login clicked - handled by HomePage modal');
  };

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

  // Show homepage
  if (showHomePage) {
    return <HomePage onStartGame={handleStartGame} onLogin={handleHomeLogin} />;
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
        onLogout={handleLogout}
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
        {/* Mobile Header */}
        <div style={{
          display: window.innerWidth < 1024 ? 'block' : 'none',
          background: 'rgba(26, 26, 46, 0.8)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(139, 92, 246, 0.2)',
          borderRadius: '16px',
          margin: '1rem',
          padding: '1.5rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: 0
            }}>
              ⚔️ AI D&D
            </h1>
            <button
              onClick={() => setShowCharacterCreation(true)}
              style={{
                padding: '0.5rem 1rem',
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
              ✏️ Edit
            </button>
          </div>
          
          {/* Character Info Mobile */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
            <div style={{
              background: 'rgba(15, 15, 35, 0.6)',
              borderRadius: '8px',
              padding: '0.75rem',
              textAlign: 'center'
            }}>
              <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Level</div>
              <div style={{ color: '#e2e8f0', fontWeight: 'bold', fontSize: '1rem' }}>{characterStats.level || 1}</div>
            </div>
            <div style={{
              background: 'rgba(15, 15, 35, 0.6)',
              borderRadius: '8px',
              padding: '0.75rem',
              textAlign: 'center'
            }}>
              <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>HP</div>
              <div style={{ color: '#e2e8f0', fontWeight: 'bold', fontSize: '1rem' }}>{characterStats.hp}/{characterStats.maxHp || characterStats.hp}</div>
            </div>
            <div style={{
              background: 'rgba(15, 15, 35, 0.6)',
              borderRadius: '8px',
              padding: '0.75rem',
              textAlign: 'center'
            }}>
              <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>XP</div>
              <div style={{ color: '#e2e8f0', fontWeight: 'bold', fontSize: '1rem' }}>{characterStats.xp || 0}</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: window.innerWidth < 1024 ? 'column' : 'row', minHeight: '100vh' }}>
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
              background: 'rgba(26, 26, 46, 0.8)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(139, 92, 246, 0.2)',
              borderRadius: '16px',
              padding: '1.5rem'
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

            {/* Tab Navigation */}
            <div style={{
              background: 'rgba(26, 26, 46, 0.8)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(139, 92, 246, 0.2)',
              borderRadius: '16px',
              padding: '1rem'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {[
                  { id: 'chat', label: '💬 Chat', icon: '💬' },
                  { id: 'character', label: '📈 Stats', icon: '📈' },
                  { id: 'inventory', label: '🎒 Items', icon: '🎒' },
                  { id: 'combat', label: '⚔️ Combat', icon: '⚔️' },
                  { id: 'dice', label: '🎲 Dice', icon: '🎲' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: '8px',
                      fontWeight: '500',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      background: activeTab === tab.id ? 'linear-gradient(135deg, #8b5cf6, #ec4899)' : 'transparent',
                      color: activeTab === tab.id ? 'white' : '#94a3b8',
                      border: activeTab === tab.id ? 'none' : '1px solid rgba(139, 92, 246, 0.2)',
                      textAlign: 'left'
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
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
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* Desktop Header */}
            <div style={{
              display: window.innerWidth >= 1024 ? 'block' : 'none',
              background: 'rgba(26, 26, 46, 0.8)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(139, 92, 246, 0.2)',
              borderRadius: '16px',
              margin: '1rem',
              padding: '2rem'
            }}>
              <h1 style={{
                fontSize: '2rem',
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '0.5rem'
              }}>
                ⚔️ AI D&D Adventure
              </h1>
              <p style={{ color: '#94a3b8', margin: 0 }}>
                Playing as {characterStats.name} the {characterStats.race} {characterStats.class}
              </p>
            </div>

            {/* Mobile Tab Navigation */}
            <div style={{
              display: window.innerWidth < 1024 ? 'block' : 'none',
              background: 'rgba(26, 26, 46, 0.8)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(139, 92, 246, 0.2)',
              borderRadius: '16px',
              margin: '1rem',
              padding: '0.5rem'
            }}>
              <div style={{ display: 'flex', overflowX: 'auto', gap: '0.5rem' }}>
                {[
                  { id: 'chat', label: '💬 Chat' },
                  { id: 'character', label: '📈 Stats' },
                  { id: 'inventory', label: '🎒 Items' },
                  { id: 'combat', label: '⚔️ Combat' },
                  { id: 'dice', label: '🎲 Dice' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      fontWeight: '500',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      background: activeTab === tab.id ? 'linear-gradient(135deg, #8b5cf6, #ec4899)' : 'transparent',
                      color: activeTab === tab.id ? 'white' : '#94a3b8',
                      border: activeTab === tab.id ? 'none' : '1px solid rgba(139, 92, 246, 0.2)',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Tab Content */}
            <div style={{
              display: window.innerWidth < 1024 ? 'block' : 'none',
              background: 'rgba(26, 26, 46, 0.8)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(139, 92, 246, 0.2)',
              borderRadius: '16px',
              margin: '1rem',
              padding: '1.5rem'
            }}>
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

            {/* Messages */}
            <div 
              ref={messagesContainerRef}
              style={{ 
                flex: 1,
                padding: '1rem',
                overflowY: 'auto',
                maxHeight: 'calc(100vh - 300px)'
              }}
              onScroll={handleScroll}
            >
              {messages.map((message) => (
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
                    padding: '1.5rem',
                    marginBottom: '1rem',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.25rem',
                      background: message.role === 'user' 
                        ? 'linear-gradient(135deg, #8b5cf6, #ec4899)' 
                        : 'linear-gradient(135deg, #1e40af, #3b82f6)',
                      color: 'white'
                    }}>
                      {message.role === 'user' ? '👤' : '🧙‍♂️'}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
                      {message.role === 'user' ? 'You' : 'Dungeon Master'} • {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                  <div style={{ 
                    color: '#e2e8f0', 
                    lineHeight: '1.6',
                    fontSize: '1rem'
                  }}>
                    {message.content}
                  </div>
                </div>
              ))}

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
              background: 'rgba(26, 26, 46, 0.8)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(139, 92, 246, 0.2)',
              borderRadius: '16px',
              margin: '1rem',
              padding: '1.5rem'
            }}>
              <form onSubmit={(e) => {
                e.preventDefault();
                if (inputMessage.trim() && !isLoading) {
                  handleSendMessage(inputMessage.trim());
                  setInputMessage('');
                }
              }}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="What would you like to do, adventurer?"
                    disabled={isLoading}
                    style={{
                      flex: 1,
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
                  <button
                    type="submit"
                    disabled={!inputMessage.trim() || isLoading}
                    style={{
                      padding: '1rem 1.5rem',
                      background: (!inputMessage.trim() || isLoading) 
                        ? 'rgba(55, 65, 81, 0.5)' 
                        : 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                      border: 'none',
                      borderRadius: '12px',
                      color: 'white',
                      fontSize: '1.25rem',
                      cursor: (!inputMessage.trim() || isLoading) ? 'not-allowed' : 'pointer',
                      opacity: (!inputMessage.trim() || isLoading) ? 0.5 : 1,
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: '60px'
                    }}
                  >
                    {isLoading ? '⏳' : '🚀'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}