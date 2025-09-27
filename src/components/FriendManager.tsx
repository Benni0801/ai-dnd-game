'use client';

import React, { useState, useEffect } from 'react';
import { multiplayerService, Friend } from '../lib/multiplayer-service';

interface FriendManagerProps {
  userId: string;
  onClose: () => void;
  onRequestsChange?: (requests: any[]) => void;
}

const FriendManager: React.FC<FriendManagerProps> = ({ userId, onClose, onRequestsChange }) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [searchUsername, setSearchUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState<'friends' | 'requests'>('friends');

  useEffect(() => {
    loadFriends();
    loadPendingRequests();
  }, [userId]);

  const loadFriends = async () => {
    try {
      const friendsData = await multiplayerService.getFriends(userId);
      setFriends(friendsData);
    } catch (error: any) {
      setError(error.message || 'Failed to load friends');
    }
  };

  const loadPendingRequests = async () => {
    try {
      const requests = await multiplayerService.getPendingFriendRequests(userId);
      setPendingRequests(requests);
      // Notify parent component about requests change
      if (onRequestsChange) {
        onRequestsChange(requests);
      }
    } catch (error: any) {
      console.error('Failed to load pending requests:', error);
    }
  };

  const searchAndAddFriend = async () => {
    if (!searchUsername.trim()) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await multiplayerService.sendFriendRequest(userId, searchUsername.trim());
      setSuccess(`Friend request sent to ${searchUsername}!`);
      setSearchUsername('');
    } catch (error: any) {
      setError(error.message || 'Failed to send friend request');
    } finally {
      setLoading(false);
    }
  };

  const handleFriendRequest = async (invitationId: string, accepted: boolean) => {
    try {
      await multiplayerService.respondToFriendRequest(invitationId, accepted);
      await loadPendingRequests();
      if (accepted) {
        await loadFriends();
        setSuccess('Friend request accepted!');
      } else {
        setSuccess('Friend request declined.');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to respond to friend request');
    }
  };

  const removeFriend = async (friendshipId: string) => {
    try {
      // Implementation would remove the friendship
      setFriends(prev => prev.filter(f => f.id !== friendshipId));
      setSuccess('Friend removed successfully');
    } catch (error: any) {
      setError(error.message || 'Failed to remove friend');
    }
  };

  return (
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
        width: '500px',
        maxWidth: '90vw',
        maxHeight: '80vh',
        overflowY: 'auto'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#e2e8f0',
            margin: 0
          }}>
            👥 Manage Friends
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              color: '#fca5a5',
              padding: '0.5rem 1rem',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '1.5rem',
          borderBottom: '1px solid rgba(139, 92, 246, 0.2)'
        }}>
          <button
            onClick={() => setActiveTab('friends')}
            style={{
              padding: '0.75rem 1.25rem',
              background: activeTab === 'friends' ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'friends' ? '2px solid #8b5cf6' : '2px solid transparent',
              color: activeTab === 'friends' ? '#a78bfa' : '#94a3b8',
              fontWeight: activeTab === 'friends' ? '600' : '500',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              fontSize: '0.875rem'
            }}
          >
            👥 Friends ({friends.length})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            style={{
              padding: '0.75rem 1.25rem',
              background: activeTab === 'requests' ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'requests' ? '2px solid #8b5cf6' : '2px solid transparent',
              color: activeTab === 'requests' ? '#a78bfa' : '#94a3b8',
              fontWeight: activeTab === 'requests' ? '600' : '500',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              fontSize: '0.875rem'
            }}
          >
            📨 Requests ({pendingRequests.length})
          </button>
        </div>

        {/* Add Friend Section */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            color: '#e2e8f0',
            marginBottom: '1rem'
          }}>
            Add New Friend
          </h3>
          
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <input
              type="text"
              value={searchUsername}
              onChange={(e) => setSearchUsername(e.target.value)}
              placeholder="Enter username..."
              style={{
                flex: 1,
                padding: '0.75rem',
                background: 'rgba(15, 15, 35, 0.6)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '8px',
                color: '#e2e8f0',
                fontSize: '1rem',
                outline: 'none'
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  searchAndAddFriend();
                }
              }}
            />
            <button
              onClick={searchAndAddFriend}
              disabled={loading || !searchUsername.trim()}
              style={{
                padding: '0.75rem 1.5rem',
                background: loading || !searchUsername.trim()
                  ? 'rgba(55, 65, 81, 0.5)'
                  : 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: loading || !searchUsername.trim() ? 'not-allowed' : 'pointer',
                opacity: loading || !searchUsername.trim() ? 0.5 : 1
              }}
            >
              {loading ? 'Adding...' : 'Add Friend'}
            </button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            padding: '0.75rem',
            color: '#fca5a5',
            fontSize: '0.875rem',
            marginBottom: '1rem'
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: '8px',
            padding: '0.75rem',
            color: '#86efac',
            fontSize: '0.875rem',
            marginBottom: '1rem'
          }}>
            {success}
          </div>
        )}

        {/* Friends List */}
        <div>
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            color: '#e2e8f0',
            marginBottom: '1rem'
          }}>
            Your Friends ({friends.length})
          </h3>

          {friends.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '2rem',
              color: '#94a3b8'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>👥</div>
              <p>No friends yet.</p>
              <p style={{ fontSize: '0.875rem' }}>Add friends to invite them to your games!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {friends.map((friend) => (
                <div
                  key={friend.id}
                  style={{
                    background: 'rgba(15, 15, 35, 0.4)',
                    border: '1px solid rgba(139, 92, 246, 0.2)',
                    borderRadius: '12px',
                    padding: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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
                      👤
                    </div>
                    <div>
                      <div style={{
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: '#e2e8f0',
                        marginBottom: '0.25rem'
                      }}>
                        {friend.friend?.username || 'Unknown'}
                      </div>
                      <div style={{
                        fontSize: '0.875rem',
                        color: '#94a3b8'
                      }}>
                        {friend.friend?.email || ''}
                      </div>
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#6b7280',
                        marginTop: '0.25rem'
                      }}>
                        Friends since {new Date(friend.accepted_at || friend.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFriend(friend.id)}
                    style={{
                      padding: '0.5rem 1rem',
                      background: 'rgba(239, 68, 68, 0.2)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '8px',
                      color: '#fca5a5',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Friend Requests Tab Content */}
        {activeTab === 'requests' && (
          <div>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              color: '#e2e8f0',
              marginBottom: '1rem'
            }}>
              Friend Requests ({pendingRequests.length})
            </h3>

            {pendingRequests.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '2rem',
                color: '#94a3b8'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📨</div>
                <p>No pending friend requests.</p>
                <p style={{ fontSize: '0.875rem' }}>When someone sends you a friend request, it will appear here!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {pendingRequests.map((request) => (
                  <div
                    key={request.id}
                    style={{
                      background: 'rgba(15, 15, 35, 0.4)',
                      border: '1px solid rgba(139, 92, 246, 0.2)',
                      borderRadius: '12px',
                      padding: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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
                        👤
                      </div>
                      <div>
                        <div style={{
                          fontSize: '1rem',
                          fontWeight: '600',
                          color: '#e2e8f0',
                          marginBottom: '0.25rem'
                        }}>
                          {request.from_user?.username || 'Unknown'}
                        </div>
                        <div style={{
                          fontSize: '0.875rem',
                          color: '#94a3b8'
                        }}>
                          {request.from_user?.email || ''}
                        </div>
                        <div style={{
                          fontSize: '0.75rem',
                          color: '#64748b'
                        }}>
                          Sent {new Date(request.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleFriendRequest(request.id, true)}
                        style={{
                          background: 'rgba(34, 197, 94, 0.1)',
                          border: '1px solid rgba(34, 197, 94, 0.3)',
                          borderRadius: '6px',
                          color: '#86efac',
                          padding: '0.5rem 1rem',
                          cursor: 'pointer',
                          fontSize: '0.875rem'
                        }}
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleFriendRequest(request.id, false)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          borderRadius: '6px',
                          color: '#fca5a5',
                          padding: '0.5rem 1rem',
                          cursor: 'pointer',
                          fontSize: '0.875rem'
                        }}
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendManager;
