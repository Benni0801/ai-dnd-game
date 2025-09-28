'use client'

import { useState, useRef, useEffect } from 'react'

interface Message {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: Date
}

interface CharacterData {
  name?: string
  race?: string
  class?: string
  background?: string
  alignment?: string
  personality?: string
  backstory?: string
  appearance?: string
  goals?: string
}

interface AICharacterCreationProps {
  onComplete: (characterData: CharacterData) => void
  onCancel: () => void
}

export default function AICharacterCreation({ onComplete, onCancel }: AICharacterCreationProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: "Welcome, brave adventurer! I'm here to help you create your D&D character. Tell me about the hero you'd like to become - what's their name, or what kind of character do you envision?",
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [characterData, setCharacterData] = useState<CharacterData>({})
  const [showCharacterSheet, setShowCharacterSheet] = useState(false)
  const [finalCharacter, setFinalCharacter] = useState<CharacterData>({})
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/ai-character-creation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          characterData
        })
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.message || data.error)
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: data.message,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, aiMessage])
      
      // Update character data with new information
      if (data.characterData) {
        setCharacterData(prev => ({ ...prev, ...data.characterData }))
      }

      // Check if character creation is complete
      if (data.isComplete) {
        setTimeout(() => {
          setFinalCharacter({ ...characterData, ...data.characterData })
          setShowCharacterSheet(true)
        }, 2000) // Give user time to read the completion message
      }

    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: `I'm sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
      color: 'white',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        padding: '1rem',
        borderBottom: '1px solid rgba(139, 92, 246, 0.3)',
        background: 'rgba(15, 15, 35, 0.9)',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: 0
          }}>
            🤖 AI Character Creator
          </h1>
          <button
            onClick={onCancel}
            style={{
              padding: '0.5rem 1rem',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              color: '#fca5a5',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
            }}
          >
            Cancel
          </button>
        </div>
      </div>


      {/* Messages */}
      <div style={{
        flex: 1,
        padding: '1rem',
        overflowY: 'auto',
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%'
      }}>
        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              marginBottom: '1rem',
              display: 'flex',
              justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start'
            }}
          >
            <div
              style={{
                maxWidth: '70%',
                padding: '1rem',
                borderRadius: '12px',
                background: message.type === 'user' 
                  ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)'
                  : 'rgba(55, 65, 81, 0.8)',
                border: message.type === 'user' 
                  ? '1px solid rgba(139, 92, 246, 0.3)'
                  : '1px solid rgba(75, 85, 99, 0.3)',
                backdropFilter: 'blur(10px)'
              }}
            >
              <div style={{ marginBottom: '0.5rem', fontSize: '0.8rem', opacity: 0.7 }}>
                {message.type === 'user' ? 'You' : 'AI Dungeon Master'}
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
            <div
              style={{
                padding: '1rem',
                borderRadius: '12px',
                background: 'rgba(55, 65, 81, 0.8)',
                border: '1px solid rgba(75, 85, 99, 0.3)',
                backdropFilter: 'blur(10px)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid rgba(139, 92, 246, 0.3)',
                  borderTop: '2px solid #8b5cf6',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                <span>AI is thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '1rem',
        borderTop: '1px solid rgba(139, 92, 246, 0.3)',
        background: 'rgba(15, 15, 35, 0.9)',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          gap: '1rem',
          alignItems: 'flex-end'
        }}>
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Tell me about your character..."
            disabled={isLoading}
            style={{
              flex: 1,
              minHeight: '60px',
              maxHeight: '120px',
              padding: '1rem',
              background: 'rgba(55, 65, 81, 0.8)',
              border: '1px solid rgba(75, 85, 99, 0.3)',
              borderRadius: '12px',
              color: 'white',
              fontSize: '1rem',
              resize: 'vertical',
              fontFamily: 'inherit'
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!inputValue.trim() || isLoading}
            style={{
              padding: '1rem 1.5rem',
              background: inputValue.trim() && !isLoading 
                ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)'
                : 'rgba(75, 85, 99, 0.5)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '12px',
              color: 'white',
              cursor: inputValue.trim() && !isLoading ? 'pointer' : 'not-allowed',
              transition: 'all 0.3s ease',
              fontSize: '1rem',
              fontWeight: 'bold'
            }}
          >
            Send
          </button>
        </div>
      </div>

      {/* Character Sheet Modal */}
      {showCharacterSheet && (
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
          padding: '2rem'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
            border: '2px solid rgba(139, 92, 246, 0.5)',
            borderRadius: '20px',
            padding: '2rem',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)'
          }}>
            <h2 style={{
              textAlign: 'center',
              marginBottom: '2rem',
              fontSize: '2rem',
              background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              🎭 Character Sheet
            </h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1rem',
              marginBottom: '2rem'
            }}>
              {Object.entries(finalCharacter).map(([key, value]) => (
                <div
                  key={key}
                  style={{
                    background: 'rgba(139, 92, 246, 0.1)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: '12px',
                    padding: '1rem'
                  }}
                >
                  <h3 style={{
                    margin: '0 0 0.5rem 0',
                    fontSize: '0.9rem',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    opacity: 0.7
                  }}>
                    {key}
                  </h3>
                  <p style={{
                    margin: 0,
                    fontSize: '1.1rem',
                    fontWeight: 'bold'
                  }}>
                    {value}
                  </p>
                </div>
              ))}
            </div>
            
            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center'
            }}>
              <button
                onClick={() => setShowCharacterSheet(false)}
                style={{
                  padding: '1rem 2rem',
                  background: 'rgba(75, 85, 99, 0.5)',
                  border: '1px solid rgba(75, 85, 99, 0.3)',
                  borderRadius: '12px',
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  fontSize: '1rem',
                  fontWeight: 'bold'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(75, 85, 99, 0.7)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(75, 85, 99, 0.5)'
                }}
              >
                Edit Character
              </button>
              <button
                onClick={() => {
                  setShowCharacterSheet(false)
                  onComplete(finalCharacter)
                }}
                style={{
                  padding: '1rem 2rem',
                  background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  borderRadius: '12px',
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(139, 92, 246, 0.4)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(139, 92, 246, 0.3)'
                }}
              >
                Start Adventure! ⚔️
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
