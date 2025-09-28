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

interface SinglePlayerGameProps {
  character: CharacterData
  onBack: () => void
}

export default function SinglePlayerGame({ character, onBack }: SinglePlayerGameProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: `Welcome, ${character.name || 'adventurer'}! You are a ${character.race || 'mysterious'} ${character.class || 'adventurer'} ready to begin your epic journey. The world awaits your story to unfold. What would you like to do first?`,
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
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
      const response = await fetch('/api/ai-dnd', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          character: character
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
            ⚔️ {character.name || 'Adventurer'}'s Journey
          </h1>
          <button
            onClick={onBack}
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
            Back to Character Creation
          </button>
        </div>
      </div>

      {/* Character Info */}
      <div style={{
        padding: '1rem',
        background: 'rgba(139, 92, 246, 0.1)',
        borderBottom: '1px solid rgba(139, 92, 246, 0.3)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', opacity: 0.8 }}>Character:</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {Object.entries(character).map(([key, value]) => (
              <span
                key={key}
                style={{
                  padding: '0.25rem 0.5rem',
                  background: 'rgba(139, 92, 246, 0.2)',
                  border: '1px solid rgba(139, 92, 246, 0.4)',
                  borderRadius: '4px',
                  fontSize: '0.8rem'
                }}
              >
                {key}: {value}
              </span>
            ))}
          </div>
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
                {message.type === 'user' ? 'You' : 'Dungeon Master'}
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
                <span>Dungeon Master is thinking...</span>
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
            placeholder="What do you want to do?"
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

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
