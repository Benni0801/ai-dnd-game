'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { multiplayerService, RoomPlayer, RoomMessage, GameRoom, Friend, FriendInvitation, AdventureQueueEntry, TeamChatMessage } from '../lib/multiplayer-service';

interface EnhancedMultiplayerGameRoomProps {
  roomId: string;
  userId: string;
  onLeaveRoom: () => void;
}

const EnhancedMultiplayerGameRoom: React.FC<EnhancedMultiplayerGameRoomProps> = ({
  roomId,
  userId,
  onLeaveRoom
}) => {
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [players, setPlayers] = useState<RoomPlayer[]>([]);
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [teamMessages, setTeamMessages] = useState<TeamChatMessage[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [invitations, setInvitations] = useState<FriendInvitation[]>([]);
  const [adventureQueue, setAdventureQueue] = useState<AdventureQueueEntry[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [newTeamMessage, setNewTeamMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'game' | 'team-chat' | 'friends' | 'queue'>('game');
  const [isDm, setIsDm] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteMessage, setInviteMessage] = useState('');
  const [selectedFriend, setSelectedFriend] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const teamMessagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollTeamChatToBottom = () => {
    teamMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    scrollTeamChatToBottom();
  }, [teamMessages]);

  const loadRoomData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [roomData, playersData, messagesData, teamMessagesData, friendsData, invitationsData, queueData] = await Promise.all([
        multiplayerService.getRoom(roomId),
        multiplayerService.getRoomPlayers(roomId),
        multiplayerService.getRoomMessages(roomId, 50),
        multiplayerService.getTeamMessages(roomId, 50),
        multiplayerService.getFriends(userId),
        multiplayerService.getFriendInvitations(userId),
        multiplayerService.getAdventureQueue(roomId)
      ]);

      setRoom(roomData);
      setPlayers(playersData);
      setMessages(messagesData);
      setTeamMessages(teamMessagesData);
      setFriends(friendsData);
      setInvitations(invitationsData);
      setAdventureQueue(queueData);
      
      // Check if current user is DM
      const currentPlayer = playersData.find(p => p.user_id === userId);
      setIsDm(currentPlayer?.is_dm || false);
    } catch (error: any) {
      setError(error.message || 'Failed to load room data');
    } finally {
      setIsLoading(false);
    }
  }, [roomId, userId]);

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

  const sendTeamMessage = async () => {
    if (!newTeamMessage.trim()) return;

    try {
      await multiplayerService.sendTeamMessage(roomId, {
        userId,
        content: newTeamMessage.trim(),
        messageType: 'chat'
      });
      setNewTeamMessage('');
    } catch (error: any) {
      setError(error.message || 'Failed to send team message');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleTeamKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendTeamMessage();
    }
  };

  const inviteFriendToRoom = async () => {
    if (!selectedFriend || !inviteMessage.trim()) return;

    try {
      await multiplayerService.inviteFriendToRoom(userId, selectedFriend, roomId, inviteMessage);
      setShowInviteModal(false);
      setInviteMessage('');
      setSelectedFriend('');
      // Refresh invitations
      const invitationsData = await multiplayerService.getFriendInvitations(userId);
      setInvitations(invitationsData);
    } catch (error: any) {
      setError(error.message || 'Failed to send invitation');
    }
  };

  const respondToInvitation = async (invitationId: string, accepted: boolean) => {
    try {
      await multiplayerService.respondToInvitation(invitationId, accepted);
      // Refresh invitations
      const invitationsData = await multiplayerService.getFriendInvitations(userId);
      setInvitations(invitationsData);
    } catch (error: any) {
      setError(error.message || 'Failed to respond to invitation');
    }
  };

  const joinAdventureQueue = async () => {
    try {
      const currentPlayer = players.find(p => p.user_id === userId);
      await multiplayerService.joinAdventureQueue(roomId, userId, currentPlayer?.character_id, 'general');
      // Refresh queue
      const queueData = await multiplayerService.getAdventureQueue(roomId);
      setAdventureQueue(queueData);
    } catch (error: any) {
      setError(error.message || 'Failed to join adventure queue');
    }
  };

  const leaveAdventureQueue = async () => {
    try {
      await multiplayerService.leaveAdventureQueue(roomId, userId);
      // Refresh queue
      const queueData = await multiplayerService.getAdventureQueue(roomId);
      setAdventureQueue(queueData);
    } catch (error: any) {
      setError(error.message || 'Failed to leave adventure queue');
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
          <p style={{ color: '#94a3b8', fontSize: '1.125rem' }}>Loading enhanced game room...</p>
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
            {room.description || 'Enhanced Multiplayer Adventure'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button
            onClick={() => setShowInviteModal(true)}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'rgba(34, 197, 94, 0.2)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: '8px',
              color: '#86efac',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            👥 Invite Friends
          </button>
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
          >
            🚪 Leave Room
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Sidebar - Players & Queue */}
        <div style={{
          width: '320px',
          background: 'rgba(15, 15, 35, 0.6)',
          borderRight: '1px solid rgba(139, 92, 246, 0.2)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Tab Navigation */}
          <div style={{
            display: 'flex',
            borderBottom: '1px solid rgba(139, 92, 246, 0.2)'
          }}>
            {[
              { id: 'game', label: '🎮 Game', icon: '🎮' },
              { id: 'team-chat', label: '💬 Team', icon: '💬' },
              { id: 'friends', label: '👥 Friends', icon: '👥' },
              { id: 'queue', label: '⚔️ Queue', icon: '⚔️' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: activeTab === tab.id ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                  border: 'none',
                  color: activeTab === tab.id ? '#e2e8f0' : '#94a3b8',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  transition: 'all 0.3s ease'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
            {activeTab === 'game' && (
              <div>
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
            )}

            {activeTab === 'team-chat' && (
              <div>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  color: '#e2e8f0',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  💬 Team Chat
                </h3>
                
                <div style={{
                  height: '300px',
                  overflowY: 'auto',
                  marginBottom: '1rem',
                  padding: '0.5rem',
                  background: 'rgba(15, 15, 35, 0.4)',
                  borderRadius: '12px',
                  border: '1px solid rgba(139, 92, 246, 0.1)'
                }}>
                  {teamMessages.length === 0 ? (
                    <div style={{
                      textAlign: 'center',
                      padding: '2rem',
                      color: '#94a3b8'
                    }}>
                      <p>No team messages yet.</p>
                      <p style={{ fontSize: '0.875rem' }}>Players can chat privately here!</p>
                    </div>
                  ) : (
                    teamMessages.map((message) => (
                      <div
                        key={message.id}
                        style={{
                          marginBottom: '0.75rem',
                          padding: '0.5rem',
                          background: message.user_id === userId ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                          borderRadius: '8px'
                        }}
                      >
                        <div style={{
                          fontSize: '0.75rem',
                          color: '#94a3b8',
                          marginBottom: '0.25rem'
                        }}>
                          {message.character?.name || message.user?.username || 'Unknown'}
                        </div>
                        <div style={{ color: '#e2e8f0', fontSize: '0.875rem' }}>
                          {message.content}
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={teamMessagesEndRef} />
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    value={newTeamMessage}
                    onChange={(e) => setNewTeamMessage(e.target.value)}
                    onKeyPress={handleTeamKeyPress}
                    placeholder="Team message..."
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      background: 'rgba(15, 15, 35, 0.6)',
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                      borderRadius: '8px',
                      color: '#e2e8f0',
                      fontSize: '0.875rem',
                      outline: 'none'
                    }}
                  />
                  <button
                    onClick={sendTeamMessage}
                    disabled={!newTeamMessage.trim()}
                    style={{
                      padding: '0.5rem 1rem',
                      background: newTeamMessage.trim() 
                        ? 'linear-gradient(135deg, #8b5cf6, #ec4899)' 
                        : 'rgba(55, 65, 81, 0.5)',
                      border: 'none',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '0.875rem',
                      cursor: newTeamMessage.trim() ? 'pointer' : 'not-allowed',
                      opacity: newTeamMessage.trim() ? 1 : 0.5
                    }}
                  >
                    Send
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'friends' && (
              <div>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  color: '#e2e8f0',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  👥 Friends ({friends.length})
                </h3>
                
                {friends.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '2rem',
                    color: '#94a3b8'
                  }}>
                    <p>No friends yet.</p>
                    <p style={{ fontSize: '0.875rem' }}>Add friends to invite them to games!</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {friends.map((friend) => (
                      <div
                        key={friend.id}
                        style={{
                          background: 'rgba(15, 15, 35, 0.4)',
                          border: '1px solid rgba(139, 92, 246, 0.1)',
                          borderRadius: '8px',
                          padding: '0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1rem'
                        }}>
                          👤
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ color: '#e2e8f0', fontSize: '0.875rem', fontWeight: '500' }}>
                            {friend.friend?.username || 'Unknown'}
                          </div>
                          <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                            {friend.friend?.email || ''}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {invitations.length > 0 && (
                  <div style={{ marginTop: '1.5rem' }}>
                    <h4 style={{
                      fontSize: '1rem',
                      fontWeight: 'bold',
                      color: '#e2e8f0',
                      marginBottom: '0.75rem'
                    }}>
                      📨 Invitations ({invitations.length})
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {invitations.map((invitation) => (
                        <div
                          key={invitation.id}
                          style={{
                            background: 'rgba(34, 197, 94, 0.1)',
                            border: '1px solid rgba(34, 197, 94, 0.2)',
                            borderRadius: '8px',
                            padding: '0.75rem'
                          }}
                        >
                          <div style={{ color: '#86efac', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>
                            {invitation.from_user?.username} invited you to {invitation.room?.name}
                          </div>
                          {invitation.message && (
                            <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                              "{invitation.message}"
                            </div>
                          )}
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              onClick={() => respondToInvitation(invitation.id, true)}
                              style={{
                                padding: '0.25rem 0.75rem',
                                background: 'rgba(34, 197, 94, 0.2)',
                                border: '1px solid rgba(34, 197, 94, 0.3)',
                                borderRadius: '4px',
                                color: '#86efac',
                                fontSize: '0.75rem',
                                cursor: 'pointer'
                              }}
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => respondToInvitation(invitation.id, false)}
                              style={{
                                padding: '0.25rem 0.75rem',
                                background: 'rgba(239, 68, 68, 0.2)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                borderRadius: '4px',
                                color: '#fca5a5',
                                fontSize: '0.75rem',
                                cursor: 'pointer'
                              }}
                            >
                              Decline
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'queue' && (
              <div>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  color: '#e2e8f0',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  ⚔️ Adventure Queue ({adventureQueue.length})
                </h3>
                
                <div style={{ marginBottom: '1rem' }}>
                  {adventureQueue.some(entry => entry.player_id === userId) ? (
                    <button
                      onClick={leaveAdventureQueue}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        background: 'rgba(239, 68, 68, 0.2)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '8px',
                        color: '#fca5a5',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      Leave Queue
                    </button>
                  ) : (
                    <button
                      onClick={joinAdventureQueue}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                        border: 'none',
                        borderRadius: '8px',
                        color: 'white',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      Join Adventure Queue
                    </button>
                  )}
                </div>

                {adventureQueue.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '2rem',
                    color: '#94a3b8'
                  }}>
                    <p>No one in queue yet.</p>
                    <p style={{ fontSize: '0.875rem' }}>Be the first to join!</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {adventureQueue.map((entry, index) => (
                      <div
                        key={entry.id}
                        style={{
                          background: entry.player_id === userId ? 'rgba(139, 92, 246, 0.2)' : 'rgba(15, 15, 35, 0.4)',
                          border: entry.player_id === userId ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid rgba(139, 92, 246, 0.1)',
                          borderRadius: '8px',
                          padding: '0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: entry.player_id === userId ? 'linear-gradient(135deg, #8b5cf6, #ec4899)' : 'linear-gradient(135deg, #10b981, #059669)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          color: 'white'
                        }}>
                          {index + 1}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ color: '#e2e8f0', fontSize: '0.875rem', fontWeight: '500' }}>
                            {entry.player?.username || 'Unknown'}
                            {entry.player_id === userId && ' (You)'}
                          </div>
                          {entry.character && (
                            <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                              {entry.character.name}
                            </div>
                          )}
                        </div>
                        <div style={{
                          padding: '0.25rem 0.5rem',
                          background: 'rgba(139, 92, 246, 0.2)',
                          border: '1px solid rgba(139, 92, 246, 0.3)',
                          borderRadius: '4px',
                          color: '#c4b5fd',
                          fontSize: '0.75rem',
                          fontWeight: '500'
                        }}>
                          {entry.adventure_type}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Main Chat Area */}
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

      {/* Invite Friends Modal */}
      {showInviteModal && (
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
          zIndex: 1000
        }}>
          <div style={{
            background: 'rgba(15, 15, 35, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: '24px',
            padding: '2rem',
            width: '400px',
            maxWidth: '90vw'
          }}>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#e2e8f0',
              marginBottom: '1.5rem',
              textAlign: 'center'
            }}>
              👥 Invite Friends
            </h3>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{
                display: 'block',
                color: '#94a3b8',
                fontSize: '0.875rem',
                marginBottom: '0.5rem'
              }}>
                Select Friend
              </label>
              <select
                value={selectedFriend}
                onChange={(e) => setSelectedFriend(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(15, 15, 35, 0.6)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  borderRadius: '8px',
                  color: '#e2e8f0',
                  fontSize: '1rem',
                  outline: 'none'
                }}
              >
                <option value="">Choose a friend...</option>
                {friends.map((friend) => (
                  <option key={friend.id} value={friend.friend_id}>
                    {friend.friend?.username || 'Unknown'}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                color: '#94a3b8',
                fontSize: '0.875rem',
                marginBottom: '0.5rem'
              }}>
                Message (Optional)
              </label>
              <textarea
                value={inviteMessage}
                onChange={(e) => setInviteMessage(e.target.value)}
                placeholder="Hey! Want to join my game?"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(15, 15, 35, 0.6)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  borderRadius: '8px',
                  color: '#e2e8f0',
                  fontSize: '1rem',
                  outline: 'none',
                  resize: 'vertical',
                  minHeight: '80px'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => setShowInviteModal(false)}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: 'rgba(55, 65, 81, 0.5)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  borderRadius: '8px',
                  color: '#94a3b8',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={inviteFriendToRoom}
                disabled={!selectedFriend || !inviteMessage.trim()}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: selectedFriend && inviteMessage.trim() 
                    ? 'linear-gradient(135deg, #8b5cf6, #ec4899)' 
                    : 'rgba(55, 65, 81, 0.5)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  cursor: selectedFriend && inviteMessage.trim() ? 'pointer' : 'not-allowed',
                  opacity: selectedFriend && inviteMessage.trim() ? 1 : 0.5
                }}
              >
                Send Invitation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedMultiplayerGameRoom;
