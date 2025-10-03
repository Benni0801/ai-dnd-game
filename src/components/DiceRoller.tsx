'use client'

import { useState, useEffect } from 'react'

interface DiceRollerProps {
  dice: string
  onRollComplete: (result: number, rolls: number[]) => void
  isRolling: boolean
}

export default function DiceRoller({ dice, onRollComplete, isRolling }: DiceRollerProps) {
  const [currentRoll, setCurrentRoll] = useState<number>(1)
  const [isAnimating, setIsAnimating] = useState(false)
  const [finalResult, setFinalResult] = useState<number | null>(null)

  useEffect(() => {
    if (isRolling && !isAnimating) {
      setIsAnimating(true)
      setFinalResult(null)
      
      // Parse dice string (e.g., "1d20", "2d6+3")
      const match = dice.match(/(\d+)d(\d+)([+-]\d+)?/)
      if (!match) return
      
      const numDice = parseInt(match[1])
      const dieSize = parseInt(match[2])
      const modifier = match[3] ? parseInt(match[3]) : 0
      
      // Animate dice rolling
      const rollInterval = setInterval(() => {
        setCurrentRoll(Math.floor(Math.random() * dieSize) + 1)
      }, 100)
      
      // Stop rolling after 2 seconds and calculate final result
      setTimeout(() => {
        clearInterval(rollInterval)
        
        const rolls: number[] = []
        let total = 0
        
        for (let i = 0; i < numDice; i++) {
          const roll = Math.floor(Math.random() * dieSize) + 1
          rolls.push(roll)
          total += roll
        }
        
        total += modifier
        setFinalResult(total)
        setCurrentRoll(rolls[0]) // Show first die result
        
        setTimeout(() => {
          setIsAnimating(false)
          onRollComplete(total, rolls)
        }, 500)
      }, 2000)
    }
  }, [isRolling, dice, onRollComplete, isAnimating])

  if (!isRolling && !isAnimating) return null

  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 1000,
      background: 'rgba(0, 0, 0, 0.8)',
      padding: '2rem',
      borderRadius: '12px',
      border: '2px solid #8b5cf6',
      textAlign: 'center',
      color: 'white',
      fontFamily: 'monospace'
    }}>
      <div style={{
        fontSize: '2rem',
        marginBottom: '1rem',
        color: isAnimating ? '#fbbf24' : '#10b981'
      }}>
        {isAnimating ? '🎲' : '✅'}
      </div>
      
      <div style={{
        fontSize: '3rem',
        fontWeight: 'bold',
        marginBottom: '1rem',
        color: isAnimating ? '#fbbf24' : '#10b981',
        textShadow: '0 0 10px currentColor'
      }}>
        {isAnimating ? currentRoll : finalResult}
      </div>
      
      <div style={{
        fontSize: '1rem',
        color: '#9ca3af'
      }}>
        {isAnimating ? `Rolling ${dice}...` : `Result: ${dice} = ${finalResult}`}
      </div>
      
      {isAnimating && (
        <div style={{
          marginTop: '1rem',
          fontSize: '0.875rem',
          color: '#6b7280'
        }}>
          Rolling...
        </div>
      )}
    </div>
  )
}

