'use client'

import React, { useState, useEffect, useRef } from 'react'

interface DiceRoller3DProps {
  dice: string | string[]
  onRollComplete: (result: number, rolls: number[]) => void
  isRolling: boolean
  onClose: () => void
  playerName?: string
  enemyName?: string
  diceResults?: {dice: string, result: number, rolls: number[]}[]
}

export default function DiceRoller3D({ 
  dice, 
  onRollComplete, 
  isRolling, 
  onClose,
  playerName = "Player",
  enemyName = "Enemy",
  diceResults = []
}: DiceRoller3DProps) {
  const [currentRoll, setCurrentRoll] = useState<number>(1)
  const [isAnimating, setIsAnimating] = useState(false)
  const [finalResult, setFinalResult] = useState<number | null>(null)
  const [rolls, setRolls] = useState<number[]>([])
  const [showResult, setShowResult] = useState(false)
  const [rollingNumber, setRollingNumber] = useState<number>(1)
  const dieRef = useRef<HTMLDivElement>(null)
  const rollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isRolling && !isAnimating) {
      setIsAnimating(true)
      setFinalResult(null)
      setShowResult(false)
      
      // Parse dice string (e.g., "1d20", "2d6+3")
      const diceString = Array.isArray(dice) ? dice[0] : dice
      const match = diceString.match(/(\d+)d(\d+)([+-]\d+)?/)
      if (!match) return
      
      const numDice = parseInt(match[1])
      const dieSize = parseInt(match[2])
      const modifier = match[3] ? parseInt(match[3]) : 0
      
      // Add rolling class for animation
      if (dieRef.current) {
        dieRef.current.classList.add('rolling')
      }
      
      // Start rolling animation with random numbers
      rollingIntervalRef.current = setInterval(() => {
        setRollingNumber(Math.floor(Math.random() * dieSize) + 1)
      }, 100)
      
      // Calculate final result after animation
      setTimeout(() => {
        // Clear rolling interval
        if (rollingIntervalRef.current) {
          clearInterval(rollingIntervalRef.current)
          rollingIntervalRef.current = null
        }
        
        const newRolls: number[] = []
        let total = 0
        
        for (let i = 0; i < numDice; i++) {
          const roll = Math.floor(Math.random() * dieSize) + 1
          newRolls.push(roll)
          total += roll
        }
        
        total += modifier
        setFinalResult(total)
        setRolls(newRolls)
        setCurrentRoll(newRolls[0]) // Show first die result
        
        // Remove rolling class and show result
        if (dieRef.current) {
          dieRef.current.classList.remove('rolling')
          dieRef.current.setAttribute('data-face', newRolls[0].toString())
        }
        
        setIsAnimating(false)
        setShowResult(true)
        
        // Call completion handler
        onRollComplete(total, newRolls)
      }, 3000) // 3 second animation
    }
  }, [isRolling, dice, onRollComplete, isAnimating])

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (rollingIntervalRef.current) {
        clearInterval(rollingIntervalRef.current)
      }
    }
  }, [])

  if (!isRolling && !showResult) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontFamily: 'sans-serif'
    }}>
      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          background: 'rgba(255, 255, 255, 0.2)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          color: 'white',
          fontSize: '20px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        ×
      </button>

      {/* Title */}
      <h2 style={{
        marginBottom: '2rem',
        fontSize: '2rem',
        textAlign: 'center',
        color: '#fafafa'
      }}>
        {isAnimating ? `Rolling ${dice}...` : `${dice} = ${finalResult}`}
      </h2>

      {/* Context Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '1rem',
        padding: '1rem',
        background: 'rgba(0, 0, 0, 0.7)',
        borderRadius: '12px',
        border: '2px solid rgba(139, 92, 246, 0.5)'
      }}>
        <h3 style={{ 
          color: '#8b5cf6', 
          margin: '0 0 0.5rem 0',
          fontSize: '1.2rem'
        }}>
          {isAnimating ? '🎲 Rolling Dice...' : '🎲 Dice Result'}
        </h3>
        <p style={{ 
          color: '#e2e8f0', 
          margin: 0,
          fontSize: '0.9rem'
        }}>
          {isAnimating 
            ? `Rolling ${dice} for ${playerName}${enemyName ? ` vs ${enemyName}` : ''}`
            : `${playerName} rolled ${dice} = ${finalResult}`
          }
        </p>
      </div>

      {/* 3D Dice Container */}
      <div style={{
        margin: 'auto',
        position: 'relative',
        width: diceResults.length > 1 ? '400px' : '200px',
        height: '200px',
        perspective: '1000px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '20px'
      }}>
        {diceResults.length > 0 ? (
          // Show multiple dice with actual results
          diceResults.map((diceResult, index) => (
            <div
              key={index}
              className="die"
              style={{
                position: 'relative',
                width: '100px',
                height: '100px',
                transformStyle: 'preserve-3d',
                transition: 'transform 0.5s ease-out',
                transform: 'rotateX(-20deg) rotateY(20deg)'
              }}
            >
              {/* Front face */}
              <div
                className="dice-face front"
                style={{
                  position: 'absolute',
                  width: '100px',
                  height: '100px',
                  background: 'linear-gradient(145deg, #ffffff, #f1f5f9)',
                  border: '2px solid #cbd5e1',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '28px',
                  fontWeight: 'bold',
                  color: '#1e293b',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                  transform: 'translateZ(50px)',
                  borderTop: '3px solid #f8fafc',
                  borderLeft: '3px solid #f8fafc'
                }}
              >
                {diceResult.result}
              </div>
              
              {/* Back face */}
              <div
                className="dice-face back"
                style={{
                  position: 'absolute',
                  width: '100px',
                  height: '100px',
                  background: 'linear-gradient(145deg, #e2e8f0, #cbd5e1)',
                  border: '2px solid #94a3b8',
                  borderRadius: '12px',
                  transform: 'translateZ(-50px) rotateY(180deg)',
                  borderBottom: '3px solid #94a3b8',
                  borderRight: '3px solid #94a3b8'
                }}
              />
              
              {/* Right face */}
              <div
                className="dice-face right"
                style={{
                  position: 'absolute',
                  width: '100px',
                  height: '100px',
                  background: 'linear-gradient(145deg, #f1f5f9, #e2e8f0)',
                  border: '2px solid #cbd5e1',
                  borderRadius: '12px',
                  transform: 'rotateY(90deg) translateZ(50px)',
                  borderTop: '3px solid #f8fafc',
                  borderRight: '3px solid #cbd5e1'
                }}
              />
              
              {/* Left face */}
              <div
                className="dice-face left"
                style={{
                  position: 'absolute',
                  width: '100px',
                  height: '100px',
                  background: 'linear-gradient(145deg, #e2e8f0, #cbd5e1)',
                  border: '2px solid #94a3b8',
                  borderRadius: '12px',
                  transform: 'rotateY(-90deg) translateZ(50px)',
                  borderBottom: '3px solid #94a3b8',
                  borderLeft: '3px solid #cbd5e1'
                }}
              />
              
              {/* Top face */}
              <div
                className="dice-face top"
                style={{
                  position: 'absolute',
                  width: '100px',
                  height: '100px',
                  background: 'linear-gradient(145deg, #f8fafc, #f1f5f9)',
                  border: '2px solid #e2e8f0',
                  borderRadius: '12px',
                  transform: 'rotateX(90deg) translateZ(50px)',
                  borderTop: '3px solid #ffffff',
                  borderLeft: '3px solid #f8fafc'
                }}
              />
              
              {/* Bottom face */}
              <div
                className="dice-face bottom"
                style={{
                  position: 'absolute',
                  width: '100px',
                  height: '100px',
                  background: 'linear-gradient(145deg, #cbd5e1, #94a3b8)',
                  border: '2px solid #64748b',
                  borderRadius: '12px',
                  transform: 'rotateX(-90deg) translateZ(50px)',
                  borderBottom: '3px solid #64748b',
                  borderRight: '3px solid #94a3b8'
                }}
              />
            </div>
          ))
        ) : (
          // Single dice animation
          <div
            ref={dieRef}
            className="die"
            style={{
              position: 'relative',
              width: '100px',
              height: '100px',
              transformStyle: 'preserve-3d',
              transition: 'transform 0.5s ease-out',
              transform: 'rotateX(-20deg) rotateY(20deg)'
            }}
          >
            {/* Front face */}
            <div
              className="dice-face front"
              style={{
                position: 'absolute',
                width: '100px',
                height: '100px',
                background: 'linear-gradient(145deg, #ffffff, #f1f5f9)',
                border: '2px solid #cbd5e1',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
                fontWeight: 'bold',
                color: '#1e293b',
                textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                transform: 'translateZ(50px)',
                borderTop: '3px solid #f8fafc',
                borderLeft: '3px solid #f8fafc'
              }}
            >
              {showResult ? finalResult : (isAnimating ? rollingNumber : '?')}
            </div>
          
          {/* Back face */}
          <div
            className="dice-face back"
            style={{
              position: 'absolute',
              width: '100px',
              height: '100px',
              background: 'linear-gradient(145deg, #e2e8f0, #cbd5e1)',
              border: '2px solid #94a3b8',
              borderRadius: '12px',
              transform: 'translateZ(-50px) rotateY(180deg)',
              borderBottom: '3px solid #94a3b8',
              borderRight: '3px solid #94a3b8'
            }}
          />
          
          {/* Right face */}
          <div
            className="dice-face right"
            style={{
              position: 'absolute',
              width: '100px',
              height: '100px',
              background: 'linear-gradient(145deg, #f1f5f9, #e2e8f0)',
              border: '2px solid #cbd5e1',
              borderRadius: '12px',
              transform: 'rotateY(90deg) translateZ(50px)',
              borderTop: '3px solid #f8fafc',
              borderRight: '3px solid #cbd5e1'
            }}
          />
          
          {/* Left face */}
          <div
            className="dice-face left"
            style={{
              position: 'absolute',
              width: '100px',
              height: '100px',
              background: 'linear-gradient(145deg, #e2e8f0, #cbd5e1)',
              border: '2px solid #94a3b8',
              borderRadius: '12px',
              transform: 'rotateY(-90deg) translateZ(50px)',
              borderBottom: '3px solid #94a3b8',
              borderLeft: '3px solid #cbd5e1'
            }}
          />
          
          {/* Top face */}
          <div
            className="dice-face top"
            style={{
              position: 'absolute',
              width: '100px',
              height: '100px',
              background: 'linear-gradient(145deg, #f8fafc, #f1f5f9)',
              border: '2px solid #e2e8f0',
              borderRadius: '12px',
              transform: 'rotateX(90deg) translateZ(50px)',
              borderTop: '3px solid #ffffff',
              borderLeft: '3px solid #f8fafc'
            }}
          />
          
            {/* Bottom face */}
            <div
              className="dice-face bottom"
              style={{
                position: 'absolute',
                width: '100px',
                height: '100px',
                background: 'linear-gradient(145deg, #cbd5e1, #94a3b8)',
                border: '2px solid #64748b',
                borderRadius: '12px',
                transform: 'rotateX(-90deg) translateZ(50px)',
                borderBottom: '3px solid #64748b',
                borderRight: '3px solid #94a3b8'
              }}
            />
          </div>
        )}
      </div>

      {/* Result display */}
      {showResult && (
        <div style={{
          marginTop: '1.5rem',
          textAlign: 'center',
          padding: '1rem',
          background: 'rgba(0, 0, 0, 0.6)',
          borderRadius: '12px',
          border: '2px solid rgba(34, 197, 94, 0.5)'
        }}>
          <div style={{ 
            marginBottom: '0.5rem',
            fontSize: '1.4rem',
            fontWeight: 'bold',
            color: '#22c55e'
          }}>
            🎯 Final Result: {finalResult}
          </div>
          <div style={{ 
            color: '#e2e8f0',
            fontSize: '0.9rem',
            marginBottom: '0.5rem'
          }}>
            {dice} = {finalResult}
          </div>
          {rolls.length > 1 && (
            <div style={{ 
              color: '#94a3b8',
              fontSize: '0.8rem'
            }}>
              Individual rolls: ({rolls.join(', ')})
            </div>
          )}
          <div style={{
            marginTop: '0.5rem',
            fontSize: '0.8rem',
            color: '#64748b'
          }}>
            Click the × to close
          </div>
        </div>
      )}

      {/* CSS for 3D dice animation */}
      <style jsx>{`
        @keyframes diceRoll {
          0% { 
            transform: rotateX(-20deg) rotateY(20deg) rotateZ(0deg) scale(1);
          }
          10% { 
            transform: rotateX(160deg) rotateY(200deg) rotateZ(90deg) scale(1.1);
          }
          20% { 
            transform: rotateX(340deg) rotateY(380deg) rotateZ(180deg) scale(0.9);
          }
          30% { 
            transform: rotateX(520deg) rotateY(560deg) rotateZ(270deg) scale(1.1);
          }
          40% { 
            transform: rotateX(700deg) rotateY(740deg) rotateZ(360deg) scale(0.9);
          }
          50% { 
            transform: rotateX(880deg) rotateY(920deg) rotateZ(450deg) scale(1.1);
          }
          60% { 
            transform: rotateX(1060deg) rotateY(1100deg) rotateZ(540deg) scale(0.9);
          }
          70% { 
            transform: rotateX(1240deg) rotateY(1280deg) rotateZ(630deg) scale(1.1);
          }
          80% { 
            transform: rotateX(1420deg) rotateY(1460deg) rotateZ(720deg) scale(0.9);
          }
          90% { 
            transform: rotateX(1600deg) rotateY(1640deg) rotateZ(810deg) scale(1.1);
          }
          100% { 
            transform: rotateX(1780deg) rotateY(1820deg) rotateZ(900deg) scale(1);
          }
        }
        
        .die.rolling {
          animation: diceRoll 3s ease-out;
        }
        
        .dice-face {
          transition: all 0.3s ease;
        }
        
        .die.rolling .dice-face.front {
          animation: numberChange 0.1s infinite;
        }
        
        @keyframes numberChange {
          0% { transform: translateZ(50px) scale(1); }
          50% { transform: translateZ(50px) scale(1.05); }
          100% { transform: translateZ(50px) scale(1); }
        }
      `}</style>
    </div>
  )
}
