'use client'

import React, { useState, useEffect, useRef } from 'react'

interface DiceRoller3DProps {
  dice: string
  onRollComplete: (result: number, rolls: number[]) => void
  isRolling: boolean
  onClose: () => void
  playerName?: string
  enemyName?: string
}

export default function DiceRoller3D({ 
  dice, 
  onRollComplete, 
  isRolling, 
  onClose,
  playerName = "Player",
  enemyName = "Enemy"
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
      const match = dice.match(/(\d+)d(\d+)([+-]\d+)?/)
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

      {/* 3D D20 Dice */}
      <div style={{
        margin: 'auto',
        position: 'relative',
        width: '200px',
        height: '200px',
        perspective: '1000px'
      }}>
        <div
          ref={dieRef}
          className="die"
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            transformStyle: 'preserve-3d',
            transition: 'transform 0.5s ease-out',
            cursor: 'pointer',
            transform: 'rotateX(-20deg) rotateY(20deg)'
          }}
        >
          {/* D20 faces - creating an icosahedron shape */}
          {Array.from({ length: 20 }, (_, i) => (
            <div
              key={i + 1}
              className={`d20-face face-${i + 1}`}
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                border: '2px solid #047857',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '36px',
                fontWeight: 'bold',
                color: 'white',
                textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)'
              }}
            >
              {i + 1}
            </div>
          ))}
        </div>
      </div>

      {/* Result display */}
      {showResult && (
        <div style={{
          marginTop: '2rem',
          textAlign: 'center',
          fontSize: '1.2rem'
        }}>
          <div style={{ marginBottom: '1rem' }}>
            <strong>Result: {finalResult}</strong>
          </div>
          {rolls.length > 1 && (
            <div style={{ color: '#ccc' }}>
              Individual rolls: ({rolls.join(', ')}) + {dice.includes('+') ? dice.split('+')[1] : dice.includes('-') ? dice.split('-')[1] : '0'}
            </div>
          )}
        </div>
      )}

      {/* CSS for 3D d20 animation */}
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
        
        .d20-face {
          transition: all 0.3s ease;
          opacity: 0.1;
        }
        
        .d20-face:first-child {
          opacity: 1;
        }
        
        .die[data-face="1"] .face-1 { opacity: 1; }
        .die[data-face="2"] .face-2 { opacity: 1; }
        .die[data-face="3"] .face-3 { opacity: 1; }
        .die[data-face="4"] .face-4 { opacity: 1; }
        .die[data-face="5"] .face-5 { opacity: 1; }
        .die[data-face="6"] .face-6 { opacity: 1; }
        .die[data-face="7"] .face-7 { opacity: 1; }
        .die[data-face="8"] .face-8 { opacity: 1; }
        .die[data-face="9"] .face-9 { opacity: 1; }
        .die[data-face="10"] .face-10 { opacity: 1; }
        .die[data-face="11"] .face-11 { opacity: 1; }
        .die[data-face="12"] .face-12 { opacity: 1; }
        .die[data-face="13"] .face-13 { opacity: 1; }
        .die[data-face="14"] .face-14 { opacity: 1; }
        .die[data-face="15"] .face-15 { opacity: 1; }
        .die[data-face="16"] .face-16 { opacity: 1; }
        .die[data-face="17"] .face-17 { opacity: 1; }
        .die[data-face="18"] .face-18 { opacity: 1; }
        .die[data-face="19"] .face-19 { opacity: 1; }
        .die[data-face="20"] .face-20 { opacity: 1; }
      `}</style>
    </div>
  )
}
