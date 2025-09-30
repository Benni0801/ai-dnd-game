'use client';

import React, { useState, useRef, useEffect } from 'react';

interface CharacterCreationMessage {
  id: string;
  type: 'ai' | 'user';
  content: string;
  timestamp: Date;
}

interface CharacterData {
  name?: string;
  race?: string;
  class?: string;
  background?: string;
  alignment?: string;
  personality?: string;
  backstory?: string;
  appearance?: string;
  goals?: string;
  fears?: string;
  [key: string]: any;
}

interface AICharacterCreationProps {
  onComplete: (character: CharacterData) => void;
  onCancel: () => void;
}

const AICharacterCreation: React.FC<AICharacterCreationProps> = ({ onComplete, onCancel }) => {
  const [messages, setMessages] = useState<CharacterCreationMessage[]>([
    {
      id: '1',
      type: 'ai',
      content: "Welcome, brave adventurer! I'm your AI Character Creator, and I'm here to help you craft the perfect hero for your epic journey. Let's start with the basics - what would you like to be called?",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [characterData, setCharacterData] = useState<CharacterData>({});
  const [isComplete, setIsComplete] = useState(false);
  const [characterImage, setCharacterImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: CharacterCreationMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai-character-creation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          characterData: characterData
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      
      const aiMessage: CharacterCreationMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: data.message,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);

      // Update character data if provided
      if (data.characterData) {
        setCharacterData(prev => ({ ...prev, ...data.characterData }));
      }

      // Check if character creation is complete
      if (data.isComplete) {
        setIsComplete(true);
        // Generate character image
        if (data.characterData) {
          await generateCharacterImage({ ...characterData, ...data.characterData });
        }
      }

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: CharacterCreationMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: "I apologize, but I'm having trouble processing your response. Could you please try again?",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateCharacterImage = async (finalCharacterData: CharacterData) => {
    try {
      const response = await fetch('/api/generate-character-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          character: finalCharacterData
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCharacterImage(data.imageUrl);
      }
    } catch (error) {
      console.error('Error generating character image:', error);
    }
  };

  const handleComplete = () => {
    onComplete(characterData);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
      color: '#e2e8f0',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(139, 92, 246, 0.2)',
        padding: '1rem 0'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: 0
          }}>
            🧙‍♂️ AI Character Creator
          </h1>
          <button
            onClick={onCancel}
            style={{
              padding: '0.5rem 1rem',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              color: '#fca5a5',
              fontSize: '0.875rem',
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
            Cancel
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        {/* Chat Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1rem' }}>
          {/* Messages */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1rem',
            background: 'rgba(26, 26, 46, 0.8)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: '16px',
            marginBottom: '1rem'
          }}>
            {messages.map((message) => (
              <div
                key={message.id}
                style={{
                  display: 'flex',
                  justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start',
                  marginBottom: '1rem'
                }}
              >
                <div style={{
                  maxWidth: '70%',
                  padding: '1rem',
                  borderRadius: '16px',
                  background: message.type === 'user' 
                    ? 'linear-gradient(135deg, #8b5cf6, #ec4899)'
                    : 'rgba(15, 15, 35, 0.8)',
                  border: message.type === 'ai' ? '1px solid rgba(139, 92, 246, 0.2)' : 'none',
                  color: message.type === 'user' ? 'white' : '#e2e8f0',
                  lineHeight: '1.6'
                }}>
                  <div style={{ marginBottom: '0.5rem', fontSize: '0.875rem', opacity: 0.7 }}>
                    {message.type === 'ai' ? '🧙‍♂️ AI Creator' : '👤 You'}
                  </div>
                  <div style={{ whiteSpace: 'pre-wrap' }}>{message.content}</div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div style={{
                display: 'flex',
                justifyContent: 'flex-start',
                marginBottom: '1rem'
              }}>
                <div style={{
                  padding: '1rem',
                  borderRadius: '16px',
                  background: 'rgba(15, 15, 35, 0.8)',
                  border: '1px solid rgba(139, 92, 246, 0.2)',
                  color: '#e2e8f0'
                }}>
                  <div style={{ marginBottom: '0.5rem', fontSize: '0.875rem', opacity: 0.7 }}>
                    🧙‍♂️ AI Creator
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      border: '2px solid rgba(139, 92, 246, 0.3)',
                      borderTop: '2px solid #8b5cf6',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    Thinking...
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          {!isComplete && (
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'flex-end'
            }}>
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your response here..."
                disabled={isLoading}
                style={{
                  flex: 1,
                  minHeight: '60px',
                  maxHeight: '120px',
                  padding: '1rem',
                  background: 'rgba(15, 15, 35, 0.8)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  borderRadius: '12px',
                  color: '#e2e8f0',
                  fontSize: '1rem',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                style={{
                  padding: '1rem 1.5rem',
                  background: inputValue.trim() && !isLoading 
                    ? 'linear-gradient(135deg, #8b5cf6, #ec4899)'
                    : 'rgba(100, 100, 100, 0.3)',
                  border: 'none',
                  borderRadius: '12px',
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: inputValue.trim() && !isLoading ? 'pointer' : 'not-allowed',
                  transition: 'all 0.3s ease'
                }}
              >
                Send
              </button>
            </div>
          )}
        </div>

        {/* Character Preview */}
        <div style={{ width: '300px', padding: '1rem' }}>
          <div style={{
            background: 'rgba(26, 26, 46, 0.8)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: '16px',
            padding: '1.5rem',
            height: 'fit-content'
          }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '1rem',
              textAlign: 'center'
            }}>
              Character Preview
            </h3>
            
            {/* Character Image */}
            {characterImage && (
              <div style={{
                width: '100%',
                height: '200px',
                background: 'rgba(15, 15, 35, 0.6)',
                borderRadius: '12px',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}>
                <img
                  src={characterImage}
                  alt="Character"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: '12px'
                  }}
                />
              </div>
            )}

            {/* Character Details */}
            <div style={{ fontSize: '0.875rem', lineHeight: '1.6' }}>
              {Object.entries(characterData).map(([key, value]) => (
                value && (
                  <div key={key} style={{ marginBottom: '0.5rem' }}>
                    <strong style={{ color: '#8b5cf6', textTransform: 'capitalize' }}>
                      {key.replace(/([A-Z])/g, ' $1').trim()}:
                    </strong>
                    <div style={{ color: '#cbd5e1', marginTop: '0.25rem' }}>
                      {value}
                    </div>
                  </div>
                )
              ))}
            </div>

            {/* Complete Button */}
            {isComplete && (
              <button
                onClick={handleComplete}
                style={{
                  width: '100%',
                  padding: '1rem',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  border: 'none',
                  borderRadius: '12px',
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  marginTop: '1rem'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #059669, #047857)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #10b981, #059669)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                🎮 Create Character & Start Adventure
              </button>
            )}
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AICharacterCreation;



