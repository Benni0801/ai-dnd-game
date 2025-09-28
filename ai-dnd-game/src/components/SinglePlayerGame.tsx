'use client'

import { useState, useRef, useEffect } from 'react'

interface Message {
  id: string
  type: 'user' | 'ai' | 'dice'
  content: string
  timestamp: Date
  diceResult?: {
    dice: string
    result: number
    rolls: number[]
  }
}

interface CharacterStats {
  level: number
  hitPoints: number
  maxHitPoints: number
  armorClass: number
  speed: number
  strength: number
  dexterity: number
  constitution: number
  intelligence: number
  wisdom: number
  charisma: number
  proficiencyBonus: number
  experience: number
  gold: number
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
  stats?: CharacterStats
}

interface SinglePlayerGameProps {
  character?: CharacterData
  onBack: () => void
}

// D&D 5e ability score modifiers
const getModifier = (score: number): number => {
  return Math.floor((score - 10) / 2)
}

// Generate initial stats based on race and class
const generateInitialStats = (race: string, className: string): CharacterStats => {
  // Base stats (standard array: 15, 14, 13, 12, 10, 8)
  let stats = {
    strength: 13,
    dexterity: 14,
    constitution: 12,
    intelligence: 10,
    wisdom: 15,
    charisma: 8
  }

  // Race bonuses
  switch (race.toLowerCase()) {
    case 'human':
      stats.strength += 1
      stats.dexterity += 1
      stats.constitution += 1
      stats.intelligence += 1
      stats.wisdom += 1
      stats.charisma += 1
      break
    case 'elf':
      stats.dexterity += 2
      stats.intelligence += 1
      break
    case 'dwarf':
      stats.constitution += 2
      stats.strength += 1
      break
    case 'halfling':
      stats.dexterity += 2
      stats.charisma += 1
      break
    case 'dragonborn':
      stats.strength += 2
      stats.charisma += 1
      break
    case 'tiefling':
      stats.charisma += 2
      stats.intelligence += 1
      break
  }

  // Class-based hit dice
  const hitDice = {
    'fighter': 10, 'paladin': 10, 'ranger': 10, 'barbarian': 12,
    'wizard': 6, 'sorcerer': 6, 'warlock': 8, 'bard': 8,
    'rogue': 8, 'monk': 8, 'cleric': 8, 'druid': 8
  }

  const hitDie = hitDice[className.toLowerCase() as keyof typeof hitDice] || 8
  const constitutionModifier = getModifier(stats.constitution)
  const hitPoints = hitDie + constitutionModifier

  return {
    level: 1,
    hitPoints,
    maxHitPoints: hitPoints,
    armorClass: 10 + getModifier(stats.dexterity),
    speed: race.toLowerCase() === 'dwarf' ? 25 : 30,
    ...stats,
    proficiencyBonus: 2,
    experience: 0,
    gold: 100
  }
}

export default function SinglePlayerGame({ character, onBack }: SinglePlayerGameProps) {
  const [showCharacterCreation, setShowCharacterCreation] = useState(!character)
  const [characterData, setCharacterData] = useState<CharacterData>(character || {
    name: '',
    race: '',
    class: '',
    background: '',
    alignment: '',
    personality: '',
    backstory: '',
    appearance: '',
    goals: ''
  })

  const [messages, setMessages] = useState<Message[]>(character ? [
    {
      id: '1',
      type: 'ai',
      content: `Welcome, ${character.name || 'adventurer'}! You are a ${character.race || 'mysterious'} ${character.class || 'adventurer'} ready to begin your epic journey. The world awaits your story to unfold. What would you like to do first?`,
      timestamp: new Date()
    }
  ] : [])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showCharacterSheet, setShowCharacterSheet] = useState(false)
  const [diceRolling, setDiceRolling] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Roll dice function
  const rollDice = (diceString: string): { dice: string, result: number, rolls: number[] } => {
    const match = diceString.match(/(\d+)d(\d+)([+-]\d+)?/)
    if (!match) return { dice: diceString, result: 0, rolls: [] }

    const numDice = parseInt(match[1])
    const dieSize = parseInt(match[2])
    const modifier = match[3] ? parseInt(match[3]) : 0

    const rolls: number[] = []
    for (let i = 0; i < numDice; i++) {
      rolls.push(Math.floor(Math.random() * dieSize) + 1)
    }

    const result = rolls.reduce((sum, roll) => sum + roll, 0) + modifier

    return { dice: diceString, result, rolls }
  }

  // Handle dice rolling
  const handleDiceRoll = (diceString: string) => {
    setDiceRolling(true)
    
    setTimeout(() => {
      const rollResult = rollDice(diceString)
      const diceMessage: Message = {
        id: Date.now().toString(),
        type: 'dice',
        content: `🎲 Rolled ${diceString}: ${rollResult.result} ${rollResult.rolls.length > 1 ? `(${rollResult.rolls.join(', ')})` : ''}`,
        timestamp: new Date(),
        diceResult: rollResult
      }
      
      setMessages(prev => [...prev, diceMessage])
      setDiceRolling(false)
    }, 1500)
  }

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    // Check for dice roll commands
    if (inputValue.trim().startsWith('/roll ')) {
      const diceString = inputValue.trim().substring(6)
      handleDiceRoll(diceString)
      setInputValue('')
      return
    }

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
          character: characterData
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

  const handleCharacterSubmit = () => {
    if (characterData.name && characterData.race && characterData.class) {
      const stats = generateInitialStats(characterData.race, characterData.class)
      setCharacterData(prev => ({ ...prev, stats }))
      setShowCharacterCreation(false)
      setMessages([{
        id: '1',
        type: 'ai',
        content: `Welcome, ${characterData.name}! You are a ${characterData.race} ${characterData.class} ready to begin your epic journey. The world awaits your story to unfold. What would you like to do first?`,
        timestamp: new Date()
      }])
    }
  }

  if (showCharacterCreation) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem'
      }}>
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
                value={characterData.name}
                onChange={(e) => setCharacterData(prev => ({ ...prev, name: e.target.value }))}
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
                  e.target.style.borderColor = 'rgba(139, 92, 246, 0.5)'
                  e.target.style.background = 'rgba(15, 15, 35, 0.8)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(139, 92, 246, 0.3)'
                  e.target.style.background = 'rgba(15, 15, 35, 0.6)'
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
                  value={characterData.race}
                  onChange={(e) => setCharacterData(prev => ({ ...prev, race: e.target.value }))}
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
                    e.target.style.borderColor = 'rgba(139, 92, 246, 0.5)'
                    e.target.style.background = 'rgba(15, 15, 35, 0.8)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(139, 92, 246, 0.3)'
                    e.target.style.background = 'rgba(15, 15, 35, 0.6)'
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
                  value={characterData.class}
                  onChange={(e) => setCharacterData(prev => ({ ...prev, class: e.target.value }))}
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
                    e.target.style.borderColor = 'rgba(139, 92, 246, 0.5)'
                    e.target.style.background = 'rgba(15, 15, 35, 0.8)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(139, 92, 246, 0.3)'
                    e.target.style.background = 'rgba(15, 15, 35, 0.6)'
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
            {(characterData.name || characterData.race || characterData.class) && (
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
                    {characterData.name || 'Unnamed Hero'}
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '1rem' }}>
                    {characterData.race || 'Unknown'} {characterData.class || 'Adventurer'}
                  </div>
                </div>
              </div>
            )}
            
            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <button
                onClick={handleCharacterSubmit}
                disabled={!characterData.name || !characterData.race || !characterData.class}
                style={{
                  width: '100%',
                  padding: '1.25rem 2rem',
                  background: (!characterData.name || !characterData.race || !characterData.class)
                    ? 'rgba(55, 65, 81, 0.5)'
                    : 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                  border: 'none',
                  borderRadius: '12px',
                  color: 'white',
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  cursor: (!characterData.name || !characterData.race || !characterData.class) ? 'not-allowed' : 'pointer',
                  opacity: (!characterData.name || !characterData.race || !characterData.class) ? 0.5 : 1,
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
                onClick={onBack}
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
                  e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)'
                  e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.5)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)'
                  e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)'
                }}
              >
                ← Back to Homepage
              </button>
            </div>
          </div>
        </div>
      </div>
    )
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
            ⚔️ {characterData.name || 'Adventurer'}'s Journey
          </h1>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button
              onClick={() => setShowCharacterSheet(!showCharacterSheet)}
              style={{
                padding: '0.5rem 1rem',
                background: 'rgba(139, 92, 246, 0.1)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '8px',
                color: '#a78bfa',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)'
              }}
            >
              📋 Character Sheet
            </button>
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
      </div>

      {/* Character Sheet Modal */}
      {showCharacterSheet && characterData.stats && (
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
            background: 'rgba(26, 26, 46, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: '24px',
            maxWidth: '800px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '2rem',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{
                fontSize: '2rem',
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                margin: 0
              }}>
                📋 Character Sheet
              </h2>
              <button
                onClick={() => setShowCharacterSheet(false)}
                style={{
                  padding: '0.5rem',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  color: '#fca5a5',
                  cursor: 'pointer',
                  fontSize: '1.5rem'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
              {/* Basic Info */}
              <div style={{
                background: 'rgba(15, 15, 35, 0.6)',
                border: '1px solid rgba(139, 92, 246, 0.2)',
                borderRadius: '16px',
                padding: '1.5rem'
              }}>
                <h3 style={{ color: '#8b5cf6', marginBottom: '1rem' }}>Basic Information</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div><strong>Name:</strong> {characterData.name}</div>
                  <div><strong>Race:</strong> {characterData.race}</div>
                  <div><strong>Class:</strong> {characterData.class}</div>
                  <div><strong>Level:</strong> {characterData.stats.level}</div>
                  <div><strong>Experience:</strong> {characterData.stats.experience} XP</div>
                </div>
              </div>

              {/* Combat Stats */}
              <div style={{
                background: 'rgba(15, 15, 35, 0.6)',
                border: '1px solid rgba(139, 92, 246, 0.2)',
                borderRadius: '16px',
                padding: '1.5rem'
              }}>
                <h3 style={{ color: '#8b5cf6', marginBottom: '1rem' }}>Combat Stats</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div><strong>Hit Points:</strong> {characterData.stats.hitPoints}/{characterData.stats.maxHitPoints}</div>
                  <div><strong>Armor Class:</strong> {characterData.stats.armorClass}</div>
                  <div><strong>Speed:</strong> {characterData.stats.speed} ft</div>
                  <div><strong>Proficiency Bonus:</strong> +{characterData.stats.proficiencyBonus}</div>
                  <div><strong>Gold:</strong> {characterData.stats.gold} gp</div>
                </div>
              </div>

              {/* Ability Scores */}
              <div style={{
                background: 'rgba(15, 15, 35, 0.6)',
                border: '1px solid rgba(139, 92, 246, 0.2)',
                borderRadius: '16px',
                padding: '1.5rem'
              }}>
                <h3 style={{ color: '#8b5cf6', marginBottom: '1rem' }}>Ability Scores</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                  {Object.entries(characterData.stats).filter(([key]) => 
                    ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'].includes(key)
                  ).map(([key, value]) => (
                    <div key={key} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ textTransform: 'capitalize' }}>{key}:</span>
                      <span>{value} ({getModifier(value) >= 0 ? '+' : ''}{getModifier(value)})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Character Info Bar */}
      <div style={{
        padding: '1rem',
        background: 'rgba(139, 92, 246, 0.1)',
        borderBottom: '1px solid rgba(139, 92, 246, 0.3)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
            <div><strong>{characterData.name}</strong> - {characterData.race} {characterData.class}</div>
            {characterData.stats && (
              <>
                <div>Level {characterData.stats.level}</div>
                <div>HP: {characterData.stats.hitPoints}/{characterData.stats.maxHitPoints}</div>
                <div>AC: {characterData.stats.armorClass}</div>
                <div>Gold: {characterData.stats.gold} gp</div>
              </>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => handleDiceRoll('1d20')}
              style={{
                padding: '0.25rem 0.5rem',
                background: 'rgba(139, 92, 246, 0.2)',
                border: '1px solid rgba(139, 92, 246, 0.4)',
                borderRadius: '4px',
                color: '#a78bfa',
                cursor: 'pointer',
                fontSize: '0.8rem'
              }}
            >
              🎲 d20
            </button>
            <button
              onClick={() => handleDiceRoll('1d12')}
              style={{
                padding: '0.25rem 0.5rem',
                background: 'rgba(139, 92, 246, 0.2)',
                border: '1px solid rgba(139, 92, 246, 0.4)',
                borderRadius: '4px',
                color: '#a78bfa',
                cursor: 'pointer',
                fontSize: '0.8rem'
              }}
            >
              🎲 d12
            </button>
            <button
              onClick={() => handleDiceRoll('1d6')}
              style={{
                padding: '0.25rem 0.5rem',
                background: 'rgba(139, 92, 246, 0.2)',
                border: '1px solid rgba(139, 92, 246, 0.4)',
                borderRadius: '4px',
                color: '#a78bfa',
                cursor: 'pointer',
                fontSize: '0.8rem'
              }}
            >
              🎲 d6
            </button>
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
                  : message.type === 'dice'
                  ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                  : 'rgba(55, 65, 81, 0.8)',
                border: message.type === 'user' 
                  ? '1px solid rgba(139, 92, 246, 0.3)'
                  : message.type === 'dice'
                  ? '1px solid rgba(245, 158, 11, 0.3)'
                  : '1px solid rgba(75, 85, 99, 0.3)',
                backdropFilter: 'blur(10px)'
              }}
            >
              <div style={{ marginBottom: '0.5rem', fontSize: '0.8rem', opacity: 0.7 }}>
                {message.type === 'user' ? 'You' : message.type === 'dice' ? '🎲 Dice Roll' : 'Dungeon Master'}
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

        {diceRolling && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '1rem'
          }}>
            <div
              style={{
                padding: '1rem',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                backdropFilter: 'blur(10px)',
                animation: 'diceRoll 1.5s ease-in-out'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  fontSize: '1.5rem',
                  animation: 'diceSpin 0.5s linear infinite'
                }}>
                  🎲
                </div>
                <span>Rolling dice...</span>
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
            placeholder="What do you want to do? (Use /roll 1d20 for dice rolls)"
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
        
        @keyframes diceRoll {
          0% { transform: scale(0.8) rotate(0deg); opacity: 0; }
          50% { transform: scale(1.1) rotate(180deg); opacity: 1; }
          100% { transform: scale(1) rotate(360deg); opacity: 1; }
        }
        
        @keyframes diceSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
