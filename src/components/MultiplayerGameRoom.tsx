'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { multiplayerService, RoomPlayer, RoomMessage, GameRoom } from '../lib/multiplayer-service';

interface MultiplayerGameRoomProps {
  roomId: string;
  userId: string;
  onLeaveRoom: () => void;
}

const MultiplayerGameRoom: React.FC<MultiplayerGameRoomProps> = ({
  roomId,
  userId,
  onLeaveRoom
}) => {
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [players, setPlayers] = useState<RoomPlayer[]>([]);
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadRoomData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [roomData, playersData, messagesData] = await Promise.all([
        multiplayerService.getRoom(roomId),
        multiplayerService.getRoomPlayers(roomId),
        multiplayerService.getRoomMessages(roomId, 50)
      ]);

      setRoom(roomData);
      setPlayers(playersData);
      setMessages(messagesData);
    } catch (error: any) {
      setError(error.message || 'Failed to load room data');
    } finally {
      setIsLoading(false);
    }
  }, [roomId]);

  const setupRealtimeSubscriptions = useCallback(() => {
    const subscription = multiplayerService.subscribeToRoom(roomId, {
      onMessage: (message) => {
        setMessages(prev => [...prev, message]);
      },
      onPlayerJoin: (player) => {
        setPlayers(prev => [...prev, player]);
      },
      onPlayerLeave: (player) => {
        setPlayers(prev => prev.filter(p => p.id !== player.id));
      },
      onRoomUpdate: (roomData) => {
        setRoom(roomData);
      }
    });

    return () => subscription.unsubscribe();
  }, [roomId]);

  useEffect(() => {
    loadRoomData();
    const unsubscribe = setupRealtimeSubscriptions();
    return unsubscribe;
  }, [loadRoomData, setupRealtimeSubscriptions]);


  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      await multiplayerService.sendMessage(roomId, {
        userId,
        content: newMessage.trim(),
        messageType: 'chat'
      });
      setNewMessage('');
    } catch (error: any) {
      setError(error.message || 'Failed to send message');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const leaveRoom = async () => {
    try {
      await multiplayerService.leaveRoom(roomId, userId);
      onLeaveRoom();
    } catch (error: any) {
      setError(error.message || 'Failed to leave room');
    }
  };

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
        color: '#e2e8f0',
        fontFamily: 'sans-serif',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          background: 'rgba(26, 26, 46, 0.8)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          borderRadius: '24px',
          padding: '3rem',
          textAlign: 'center'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid rgba(139, 92, 246, 0.3)',
            borderTop: '4px solid #8b5cf6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1.5rem auto'
          }}></div>
          <p style={{ color: '#94a3b8', fontSize: '1.125rem' }}>Loading game room...</p>
        </div>
        <style jsx global>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!room) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
        color: '#e2e8f0',
        fontFamily: 'sans-serif',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          background: 'rgba(26, 26, 46, 0.8)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '24px',
          padding: '3rem',
          textAlign: 'center'
        }}>
          <p style={{ color: '#fca5a5', fontSize: '1.125rem' }}>Room not found</p>
          <button
            onClick={onLeaveRoom}
            style={{
              marginTop: '1rem',
              padding: '0.75rem 1.5rem',
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              color: '#fca5a5',
              cursor: 'pointer'
            }}
          >
            Go Back
          </button>
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
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <header style={{
        background: 'rgba(15, 15, 35, 0.8)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(139, 92, 246, 0.2)',
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: 0
          }}>
            🎮 {room.name}
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: 0 }}>
            {room.description || 'Multiplayer Adventure'}
          </p>
        </div>
        <button
          onClick={leaveRoom}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            color: '#fca5a5',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)';
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
          }}
        >
          🚪 Leave Room
        </button>
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Player List Sidebar */}
        <div style={{
          width: '300px',
          background: 'rgba(15, 15, 35, 0.6)',
          borderRight: '1px solid rgba(139, 92, 246, 0.2)',
          padding: '1.5rem',
          overflowY: 'auto'
        }}>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: 'bold',
            color: '#e2e8f0',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            👥 Players ({players.length}/{room.max_players})
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {players.map((player) => (
              <div
                key={player.id}
                style={{
                  background: player.user_id === userId 
                    ? 'rgba(139, 92, 246, 0.2)' 
                    : 'rgba(15, 15, 35, 0.4)',
                  border: player.user_id === userId 
                    ? '1px solid rgba(139, 92, 246, 0.3)' 
                    : '1px solid rgba(139, 92, 246, 0.1)',
                  borderRadius: '12px',
                  padding: '1rem',
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: player.is_dm 
                      ? 'linear-gradient(135deg, #f59e0b, #d97706)' 
                      : 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem'
                  }}>
                    {player.is_dm ? '👑' : '🎭'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: '#e2e8f0',
                      marginBottom: '0.25rem'
                    }}>
                      {player.user?.username || 'Unknown Player'}
                      {player.user_id === userId && ' (You)'}
                    </div>
                    {player.character && (
                      <div style={{
                        fontSize: '0.875rem',
                        color: '#94a3b8'
                      }}>
                        {player.character.name} - {player.character.race} {player.character.class}
                      </div>
                    )}
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#6b7280',
                      marginTop: '0.25rem'
                    }}>
                      Joined {new Date(player.joined_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Messages */}
          <div style={{
            flex: 1,
            padding: '1.5rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            {error && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '12px',
                padding: '1rem',
                color: '#fca5a5',
                fontSize: '0.875rem'
              }}>
                {error}
              </div>
            )}

            {messages.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '3rem',
                color: '#94a3b8'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💬</div>
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  style={{
                    display: 'flex',
                    gap: '0.75rem',
                    alignItems: 'flex-start'
                  }}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: message.user_id === userId 
                      ? 'linear-gradient(135deg, #8b5cf6, #ec4899)' 
                      : 'linear-gradient(135deg, #10b981, #059669)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                    flexShrink: 0
                  }}>
                    {message.character?.name ? '🎭' : '👤'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.25rem'
                    }}>
                      <span style={{
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#e2e8f0'
                      }}>
                        {message.character?.name || message.user?.username || 'Unknown'}
                      </span>
                      <span style={{
                        fontSize: '0.75rem',
                        color: '#6b7280'
                      }}>
                        {new Date(message.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <div style={{
                      background: message.user_id === userId 
                        ? 'rgba(139, 92, 246, 0.1)' 
                        : 'rgba(15, 15, 35, 0.4)',
                      border: message.user_id === userId 
                        ? '1px solid rgba(139, 92, 246, 0.2)' 
                        : '1px solid rgba(139, 92, 246, 0.1)',
                      borderRadius: '12px',
                      padding: '0.75rem 1rem',
                      color: '#e2e8f0',
                      lineHeight: '1.5'
                    }}>
                      {message.content}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div style={{
            padding: '1.5rem',
            borderTop: '1px solid rgba(139, 92, 246, 0.2)',
            background: 'rgba(15, 15, 35, 0.6)'
          }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
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
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: newMessage.trim() 
                    ? 'linear-gradient(135deg, #8b5cf6, #ec4899)' 
                    : 'rgba(55, 65, 81, 0.5)',
                  border: 'none',
                  borderRadius: '12px',
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
                  opacity: newMessage.trim() ? 1 : 0.5,
                  transition: 'all 0.3s ease'
                }}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiplayerGameRoom;
