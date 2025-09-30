'use client';

import React, { useState, useEffect } from 'react';

export interface Quest {
  id: string;
  title: string;
  description: string;
  questGiver: string;
  xpReward: number;
  goldReward?: number;
  status: 'active' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  objectives?: string[];
  type: 'main' | 'side' | 'daily';
}

interface QuestSystemProps {
  quests: Quest[];
  onUpdateQuest: (questId: string, updates: Partial<Quest>) => void;
  onCompleteQuest: (questId: string) => void;
  onAcceptQuest: (quest: Quest) => void;
  onDeclineQuest: (questId: string) => void;
}

const QuestSystem: React.FC<QuestSystemProps> = ({
  quests,
  onUpdateQuest,
  onCompleteQuest,
  onAcceptQuest,
  onDeclineQuest
}) => {
  const [showQuestPopup, setShowQuestPopup] = useState(false);
  const [pendingQuest, setPendingQuest] = useState<Quest | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');

  const activeQuests = quests.filter(q => q.status === 'active');
  const completedQuests = quests.filter(q => q.status === 'completed');

  return (
    <div className="quest-system">
      {/* Quest Popup Modal */}
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
          zIndex: 1000,
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
                    onAcceptQuest(pendingQuest);
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
                    onDeclineQuest(pendingQuest.id);
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

      {/* Quest Panel */}
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
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: 0
          }}>
            📜 Quests
          </h3>
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '12px',
            padding: '0.25rem 0.75rem',
            fontSize: '0.8rem',
            color: '#10b981',
            fontWeight: '600'
          }}>
            {activeQuests.length} Active
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <button
            onClick={() => setActiveTab('active')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '12px',
              border: 'none',
              background: activeTab === 'active' 
                ? 'linear-gradient(135deg, #8b5cf6, #ec4899)' 
                : 'rgba(55, 65, 81, 0.6)',
              color: activeTab === 'active' ? 'white' : '#94a3b8',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            Active ({activeQuests.length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '12px',
              border: 'none',
              background: activeTab === 'completed' 
                ? 'linear-gradient(135deg, #8b5cf6, #ec4899)' 
                : 'rgba(55, 65, 81, 0.6)',
              color: activeTab === 'completed' ? 'white' : '#94a3b8',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            Completed ({completedQuests.length})
          </button>
        </div>

        {/* Quest List */}
        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
          {activeTab === 'active' ? (
            activeQuests.length > 0 ? (
              activeQuests.map(quest => (
                <div key={quest.id} style={{
                  background: 'rgba(15, 15, 35, 0.6)',
                  border: '1px solid rgba(139, 92, 246, 0.2)',
                  borderRadius: '16px',
                  padding: '1rem',
                  marginBottom: '0.75rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <h4 style={{
                      color: '#e2e8f0',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      margin: 0
                    }}>
                      {quest.title}
                    </h4>
                    <div style={{
                      background: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: '8px',
                      padding: '0.25rem 0.5rem',
                      fontSize: '0.7rem',
                      color: '#10b981',
                      fontWeight: '600'
                    }}>
                      {quest.xpReward} XP
                    </div>
                  </div>
                  <p style={{
                    color: '#94a3b8',
                    fontSize: '0.8rem',
                    margin: '0 0 0.5rem 0',
                    lineHeight: '1.4'
                  }}>
                    {quest.description}
                  </p>
                  <div style={{
                    color: '#a78bfa',
                    fontSize: '0.75rem',
                    fontStyle: 'italic'
                  }}>
                    From: {quest.questGiver}
                  </div>
                </div>
              ))
            ) : (
              <div style={{
                textAlign: 'center',
                color: '#94a3b8',
                fontSize: '0.9rem',
                padding: '2rem'
              }}>
                No active quests. Explore the world to find new adventures!
              </div>
            )
          ) : (
            completedQuests.length > 0 ? (
              completedQuests.map(quest => (
                <div key={quest.id} style={{
                  background: 'rgba(15, 15, 35, 0.6)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  borderRadius: '16px',
                  padding: '1rem',
                  marginBottom: '0.75rem',
                  opacity: 0.8
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <h4 style={{
                      color: '#e2e8f0',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      margin: 0,
                      textDecoration: 'line-through'
                    }}>
                      {quest.title}
                    </h4>
                    <div style={{
                      background: 'rgba(16, 185, 129, 0.2)',
                      border: '1px solid rgba(16, 185, 129, 0.4)',
                      borderRadius: '8px',
                      padding: '0.25rem 0.5rem',
                      fontSize: '0.7rem',
                      color: '#10b981',
                      fontWeight: '600'
                    }}>
                      ✅ Completed
                    </div>
                  </div>
                  <p style={{
                    color: '#94a3b8',
                    fontSize: '0.8rem',
                    margin: '0 0 0.5rem 0',
                    lineHeight: '1.4'
                  }}>
                    {quest.description}
                  </p>
                  <div style={{
                    color: '#a78bfa',
                    fontSize: '0.75rem',
                    fontStyle: 'italic'
                  }}>
                    From: {quest.questGiver} • Completed: {quest.completedAt?.toLocaleDateString()}
                  </div>
                </div>
              ))
            ) : (
              <div style={{
                textAlign: 'center',
                color: '#94a3b8',
                fontSize: '0.9rem',
                padding: '2rem'
              }}>
                No completed quests yet. Start your adventure!
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestSystem;

