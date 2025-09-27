'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CharacterStats, Message } from '../types';
import AdvancedDiceRoller from './AdvancedDiceRoller';
import InventorySystem, { InventorySystemRef } from './InventorySystem';
import CombatSystem from './CombatSystem';
import CharacterProgression from './CharacterProgression';
import { multiplayerService, RoomPlayer } from '../lib/multiplayer-service';

interface MultiplayerGameWithAIProps {
  roomId: string;
  userId: string;
  onLeaveRoom: () => void;
}

export default function MultiplayerGameWithAI({ roomId, userId, onLeaveRoom }: MultiplayerGameWithAIProps) {
  // Single-player game state
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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
  
  // Multiplayer state
  const [players, setPlayers] = useState<RoomPlayer[]>([]);
  const [roomData, setRoomData] = useState<any>(null);
  const [isLoadingRoom, setIsLoadingRoom] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inventoryRef = useRef<InventorySystemRef>(null);

  // Load room data and players
  const loadRoomData = useCallback(async () => {
    try {
      setIsLoadingRoom(true);
      
      // Load room data
      const rooms = await multiplayerService.getRooms();
      const room = rooms.find(r => r.id === roomId);
      setRoomData(room);

      // Load players
      const roomPlayers = await multiplayerService.getRoomPlayers(roomId);
      setPlayers(roomPlayers);

      // Get current player's character data
      const currentPlayer = roomPlayers.find(p => p.user_id === userId);
      if (currentPlayer?.character) {
        setCharacterStats(prev => ({
          ...prev,
          name: currentPlayer.character?.name || prev.name,
          race: currentPlayer.character?.race || prev.race,
          class: currentPlayer.character?.class || prev.class,
          level: currentPlayer.character?.level || prev.level
        }));
      }

    } catch (error) {
      console.error('Error loading room data:', error);
    } finally {
      setIsLoadingRoom(false);
    }
  }, [roomId, userId]);

  // Setup real-time subscriptions
  const setupRealtimeSubscriptions = useCallback(() => {
    const subscription = multiplayerService.subscribeToRoomEnhanced(roomId, {
      onPlayerJoin: (player) => {
        console.log('Player joined:', player);
        setPlayers(prev => {
          const exists = prev.some(p => p.id === player.id);
          if (!exists) {
            return [...prev, player];
          }
          return prev;
        });
      },
      onPlayerLeave: (player) => {
        console.log('Player left:', player);
        setPlayers(prev => prev.filter(p => p.id !== player.id));
      },
      onRoomUpdate: (room) => {
        console.log('Room updated:', room);
        setRoomData(room);
      }
    });

    return subscription;
  }, [roomId]);

  useEffect(() => {
    loadRoomData();
    const subscription = setupRealtimeSubscriptions();
    
    return () => {
      subscription.unsubscribe();
    };
  }, [loadRoomData, setupRealtimeSubscriptions]);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle scroll button visibility
  useEffect(() => {
    const handleScroll = () => {
      if (chatContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
        setShowScrollButton(scrollHeight - scrollTop > clientHeight + 100);
      }
    };

    const container = chatContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Send message to AI
  const handleSendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: message,
      role: 'user',
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
          characterStats: characterStats
        }),
      });

      if (!response.ok) {
        throw new Error(`AI API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Handle items from AI response
      if (data.items && data.items.length > 0) {
        for (const item of data.items) {
          if (inventoryRef.current) {
            inventoryRef.current.addItem(item);
            console.log('Added item from AI:', item);
          }
        }
        
        // Add a notification message about received items
        const itemNames = data.items.map((item: any) => item.name).join(', ');
        const itemMessage: Message = {
          id: (Date.now() + 0.5).toString(),
          content: `🎒 You received: ${itemNames}`,
          role: 'assistant',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, itemMessage]);
      }
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response || data.message || 'AI response received',
        role: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error: any) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `Error: ${error.message}`,
        role: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingRoom) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#e2e8f0'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚔️</div>
          <div style={{ fontSize: '1.25rem', fontWeight: '600' }}>Loading Game Room...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        background: 'rgba(26, 26, 46, 0.9)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(139, 92, 246, 0.2)',
        padding: '1rem 1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#e2e8f0',
            margin: 0
          }}>
            {roomData?.name || 'Multiplayer Room'}
          </h1>
          <p style={{
            fontSize: '0.875rem',
            color: '#94a3b8',
            margin: '0.25rem 0 0 0'
          }}>
            {roomData?.description || 'A collaborative D&D adventure'}
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {/* Player Count */}
          <div style={{
            padding: '0.5rem 1rem',
            background: 'rgba(139, 92, 246, 0.1)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: '8px',
            color: '#a78bfa'
          }}>
            👥 {players.length}/{roomData?.max_players || 6}
          </div>
          
          <button
            onClick={onLeaveRoom}
            style={{
              padding: '0.625rem 1.5rem',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              color: '#fca5a5',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
            }}
          >
            🚪 Leave Room
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1 }}>
        {/* Left Sidebar - Players */}
        <div style={{
          width: '300px',
          background: 'rgba(26, 26, 46, 0.8)',
          backdropFilter: 'blur(10px)',
          borderRight: '1px solid rgba(139, 92, 246, 0.2)',
          padding: '1.5rem',
          overflowY: 'auto'
        }}>
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            color: '#e2e8f0',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            👥 Players ({players.length})
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {players.map((player) => (
              <div key={player.id} style={{
                background: 'rgba(15, 15, 35, 0.6)',
                border: '1px solid rgba(139, 92, 246, 0.2)',
                borderRadius: '12px',
                padding: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem'
                }}>
                  {player.is_dm ? '👑' : '⚔️'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#e2e8f0'
                  }}>
                    {player.user?.username || 'Unknown Player'}
                    {player.user_id === userId && ' (You)'}
                    {player.is_dm && ' (DM)'}
                  </div>
                  {player.character && (
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#94a3b8'
                    }}>
                      {player.character.name} - {player.character.race} {player.character.class}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content - Game */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Tab Navigation */}
          <div style={{
            background: 'rgba(26, 26, 46, 0.8)',
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid rgba(139, 92, 246, 0.2)',
            padding: '0 1.5rem'
          }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {[
                { key: 'chat', label: '💬 Chat', icon: '💬' },
                { key: 'character', label: '👤 Character', icon: '👤' },
                { key: 'inventory', label: '🎒 Inventory', icon: '🎒' },
                { key: 'combat', label: '⚔️ Combat', icon: '⚔️' },
                { key: 'dice', label: '🎲 Dice', icon: '🎲' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  style={{
                    padding: '0.75rem 1.25rem',
                    background: activeTab === tab.key ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                    border: 'none',
                    borderBottom: activeTab === tab.key ? '2px solid #8b5cf6' : '2px solid transparent',
                    color: activeTab === tab.key ? '#a78bfa' : '#94a3b8',
                    fontWeight: activeTab === tab.key ? '600' : '500',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    fontSize: '0.875rem'
                  }}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            {activeTab === 'chat' && (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* Messages */}
                <div
                  ref={chatContainerRef}
                  style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem'
                  }}
                >
                  {messages.length === 0 && (
                    <div style={{
                      textAlign: 'center',
                      color: '#94a3b8',
                      padding: '2rem',
                      fontSize: '1.125rem'
                    }}>
                      Welcome to your multiplayer D&D adventure! 🎲<br/>
                      Start by describing what your character would like to do.
                    </div>
                  )}
                  
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      style={{
                        alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                        maxWidth: '80%',
                        background: message.role === 'user' 
                          ? 'rgba(139, 92, 246, 0.1)' 
                          : 'rgba(15, 15, 35, 0.6)',
                        border: message.role === 'user'
                          ? '1px solid rgba(139, 92, 246, 0.3)'
                          : '1px solid rgba(139, 92, 246, 0.2)',
                        borderRadius: '16px',
                        padding: '1rem 1.25rem',
                        color: '#e2e8f0'
                      }}
                    >
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#94a3b8',
                        marginBottom: '0.5rem'
                      }}>
                        {message.role === 'user' ? characterStats.name || 'You' : 'AI Dungeon Master'} • {message.timestamp.toLocaleTimeString()}
                      </div>
                      <div style={{ lineHeight: '1.6' }}>
                        {message.content}
                      </div>
                    </div>
                  ))}
                  
                  {isLoading && (
                    <div style={{
                      alignSelf: 'flex-start',
                      background: 'rgba(15, 15, 35, 0.6)',
                      border: '1px solid rgba(139, 92, 246, 0.2)',
                      borderRadius: '16px',
                      padding: '1rem 1.25rem',
                      color: '#94a3b8'
                    }}>
                      AI Dungeon Master is thinking... ⏳
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>

                {/* Scroll to Bottom Button */}
                {showScrollButton && (
                  <button
                    onClick={scrollToBottom}
                    style={{
                      position: 'absolute',
                      bottom: '120px',
                      right: '2rem',
                      background: 'rgba(139, 92, 246, 0.8)',
                      border: 'none',
                      borderRadius: '50%',
                      width: '48px',
                      height: '48px',
                      color: 'white',
                      fontSize: '1.25rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    ⬇️
                  </button>
                )}

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
            )}

            {activeTab === 'character' && (
              <div style={{ padding: '1.5rem', height: '100%', overflowY: 'auto' }}>
                <CharacterProgression
                  characterStats={characterStats}
                  onStatsUpdate={(stats) => setCharacterStats(prev => ({ ...prev, ...stats }))}
                />
              </div>
            )}

            {activeTab === 'inventory' && (
              <div style={{ padding: '1.5rem', height: '100%', overflowY: 'auto' }}>
                <InventorySystem
                  ref={inventoryRef}
                  characterStats={characterStats}
                  onInventoryChange={setInventory}
                  initialInventory={inventory}
                />
              </div>
            )}

            {activeTab === 'combat' && (
              <div style={{ padding: '1.5rem', height: '100%', overflowY: 'auto' }}>
                <CombatSystem
                  characterStats={characterStats}
                  onCombatEnd={(victory) => {
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
                  }}
                />
              </div>
            )}

            {activeTab === 'dice' && (
              <div style={{ padding: '1.5rem', height: '100%', overflowY: 'auto' }}>
                <AdvancedDiceRoller 
                  onRollComplete={(results) => {
                    const rollText = results.map(r => `${r.value}${r.isCritical ? ' (Critical!)' : r.isFumble ? ' (Fumble!)' : ''}`).join(', ');
                    const total = results.reduce((sum, r) => sum + r.value, 0);
                    
                    const diceMessage: Message = {
                      id: Date.now().toString(),
                      role: 'assistant',
                      content: `🎲 You rolled: [${rollText}] = ${total}`,
                      timestamp: new Date()
                    };
                    
                    setMessages(prev => [...prev, diceMessage]);
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
