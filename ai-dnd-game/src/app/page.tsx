'use client'

import { useState } from 'react'
import AICharacterCreation from '../components/AICharacterCreation'
import SinglePlayerGame from '../components/SinglePlayerGame'

export default function Home() {
  const [showAICharacterCreation, setShowAICharacterCreation] = useState(false)
  const [showSinglePlayerGame, setShowSinglePlayerGame] = useState(false)
  const [createdCharacter, setCreatedCharacter] = useState<any>(null)

  const handleCharacterComplete = (characterData: any) => {
    console.log('Character created:', characterData)
    setCreatedCharacter(characterData)
    setShowAICharacterCreation(false)
    setShowSinglePlayerGame(true)
  }

  const handleBackToCharacterCreation = () => {
    setShowSinglePlayerGame(false)
    setShowAICharacterCreation(true)
  }

  if (showSinglePlayerGame && createdCharacter) {
    return (
      <SinglePlayerGame
        character={createdCharacter}
        onBack={handleBackToCharacterCreation}
      />
    )
  }

  if (showAICharacterCreation) {
    return (
      <AICharacterCreation
        onComplete={handleCharacterComplete}
        onCancel={() => setShowAICharacterCreation(false)}
      />
    )
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
      color: 'white',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>
          ⚔️ AI D&D Adventure
        </h1>
        <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>
          Your epic adventure awaits...
        </p>
        <div style={{ 
          padding: '2rem', 
          background: 'rgba(139, 92, 246, 0.1)', 
          borderRadius: '12px',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          marginBottom: '2rem'
        }}>
          <p>🎮 Ready to create your character?</p>
          <p style={{ marginTop: '1rem', fontSize: '0.9rem', opacity: 0.7 }}>
            Let our AI Dungeon Master help you build the perfect hero!
          </p>
        </div>
        <button
          onClick={() => setShowAICharacterCreation(true)}
          style={{
            padding: '1rem 2rem',
            background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: '12px',
            color: 'white',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
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
          🤖 Create Character with AI
        </button>
      </div>
    </div>
  )
}
