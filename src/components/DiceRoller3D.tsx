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
  const dieRef = useRef<HTMLDivElement>(null)

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
      
      // Calculate final result after animation
      setTimeout(() => {
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

      {/* 3D Dice */}
      <div style={{
        margin: 'auto',
        position: 'relative',
        width: '200px',
        height: '200px',
        perspective: '1500px'
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
            transform: 'rotateX(-53deg)'
          }}
        >
          {/* Generate 20 faces for d20 */}
          {Array.from({ length: 20 }, (_, i) => (
            <figure
              key={i + 1}
              className={`face face-${i + 1}`}
              style={{
                position: 'absolute',
                left: '50%',
                top: 0,
                margin: '0 -50px',
                borderLeft: '50px solid transparent',
                borderRight: '50px solid transparent',
                borderBottom: '86px solid rgba(30, 180, 20, 0.75)',
                width: 0,
                height: 0,
                transformStyle: 'preserve-3d',
                backfaceVisibility: 'hidden',
                counterIncrement: 'steps 1'
              }}
            >
              <span style={{
                position: 'absolute',
                top: '21.5px',
                left: '-100px',
                color: '#fff',
                textShadow: '1px 1px 3px #000',
                fontSize: '43px',
                textAlign: 'center',
                lineHeight: '77.4px',
                width: '200px',
                height: '86px'
              }}>
                {i + 1}
              </span>
            </figure>
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

      {/* CSS for 3D dice animation */}
      <style jsx>{`
        @keyframes roll {
          10% { transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg) }
          30% { transform: rotateX(120deg) rotateY(240deg) rotateZ(0deg) translateX(40px) translateY(40px) }
          50% { transform: rotateX(240deg) rotateY(480deg) rotateZ(0deg) translateX(-40px) translateY(-40px) }
          70% { transform: rotateX(360deg) rotateY(720deg) rotateZ(0deg) }
          90% { transform: rotateX(480deg) rotateY(960deg) rotateZ(0deg) }
        }
        
        .die.rolling {
          animation: roll 3s linear;
        }
        
        .die[data-face="1"] { transform: rotateX(-53deg) rotateY(0deg); }
        .die[data-face="2"] { transform: rotateX(-53deg) rotateY(72deg); }
        .die[data-face="3"] { transform: rotateX(-53deg) rotateY(144deg); }
        .die[data-face="4"] { transform: rotateX(-53deg) rotateY(216deg); }
        .die[data-face="5"] { transform: rotateX(-53deg) rotateY(288deg); }
        .die[data-face="6"] { transform: rotateX(11deg) rotateZ(180deg) rotateY(-72deg); }
        .die[data-face="7"] { transform: rotateX(11deg) rotateZ(180deg) rotateY(-144deg); }
        .die[data-face="8"] { transform: rotateX(11deg) rotateZ(180deg) rotateY(-216deg); }
        .die[data-face="9"] { transform: rotateX(11deg) rotateZ(180deg) rotateY(-288deg); }
        .die[data-face="10"] { transform: rotateX(11deg) rotateZ(180deg) rotateY(-360deg); }
        .die[data-face="11"] { transform: rotateX(11deg) rotateY(-72deg); }
        .die[data-face="12"] { transform: rotateX(11deg) rotateY(-144deg); }
        .die[data-face="13"] { transform: rotateX(11deg) rotateY(-216deg); }
        .die[data-face="14"] { transform: rotateX(11deg) rotateY(-288deg); }
        .die[data-face="15"] { transform: rotateX(11deg) rotateY(-360deg); }
        .die[data-face="16"] { transform: rotateX(-53deg + 180deg) rotateY(-72deg); }
        .die[data-face="17"] { transform: rotateX(-53deg + 180deg) rotateY(-144deg); }
        .die[data-face="18"] { transform: rotateX(-53deg + 180deg) rotateY(-216deg); }
        .die[data-face="19"] { transform: rotateX(-53deg + 180deg) rotateY(-288deg); }
        .die[data-face="20"] { transform: rotateX(-53deg + 180deg) rotateY(-360deg); }
        
        .face:nth-child(1) { transform: rotateY(0deg) translateZ(33.5px) translateY(-12.9px) rotateX(53deg); }
        .face:nth-child(2) { transform: rotateY(-72deg) translateZ(33.5px) translateY(-12.9px) rotateX(53deg); }
        .face:nth-child(3) { transform: rotateY(-144deg) translateZ(33.5px) translateY(-12.9px) rotateX(53deg); }
        .face:nth-child(4) { transform: rotateY(-216deg) translateZ(33.5px) translateY(-12.9px) rotateX(53deg); }
        .face:nth-child(5) { transform: rotateY(-288deg) translateZ(33.5px) translateY(-12.9px) rotateX(53deg); }
        .face:nth-child(6) { transform: rotateY(72deg) translateZ(75px) translateY(67.08px) rotateZ(180deg) rotateX(11deg); }
        .face:nth-child(7) { transform: rotateY(144deg) translateZ(75px) translateY(67.08px) rotateZ(180deg) rotateX(11deg); }
        .face:nth-child(8) { transform: rotateY(216deg) translateZ(75px) translateY(67.08px) rotateZ(180deg) rotateX(11deg); }
        .face:nth-child(9) { transform: rotateY(288deg) translateZ(75px) translateY(67.08px) rotateZ(180deg) rotateX(11deg); }
        .face:nth-child(10) { transform: rotateY(360deg) translateZ(75px) translateY(67.08px) rotateZ(180deg) rotateX(11deg); }
        .face:nth-child(11) { transform: rotateY(72deg) translateZ(75px) translateY(67.08px) rotateX(11deg); }
        .face:nth-child(12) { transform: rotateY(144deg) translateZ(75px) translateY(67.08px) rotateX(11deg); }
        .face:nth-child(13) { transform: rotateY(216deg) translateZ(75px) translateY(67.08px) rotateX(11deg); }
        .face:nth-child(14) { transform: rotateY(288deg) translateZ(75px) translateY(67.08px) rotateX(11deg); }
        .face:nth-child(15) { transform: rotateY(360deg) translateZ(75px) translateY(67.08px) rotateX(11deg); }
        .face:nth-child(16) { transform: rotateY(-72deg) translateZ(33.5px) translateY(147.06px) rotateZ(180deg) rotateX(53deg); }
        .face:nth-child(17) { transform: rotateY(-144deg) translateZ(33.5px) translateY(147.06px) rotateZ(180deg) rotateX(53deg); }
        .face:nth-child(18) { transform: rotateY(-216deg) translateZ(33.5px) translateY(147.06px) rotateZ(180deg) rotateX(53deg); }
        .face:nth-child(19) { transform: rotateY(-288deg) translateZ(33.5px) translateY(147.06px) rotateZ(180deg) rotateX(53deg); }
        .face:nth-child(20) { transform: rotateY(-360deg) translateZ(33.5px) translateY(147.06px) rotateZ(180deg) rotateX(53deg); }
      `}</style>
    </div>
  )
}
