'use client';

import React, { useState, useEffect } from 'react';

interface SimpleDiceRollProps {
  isVisible: boolean;
  diceType: number;
  modifier?: number;
  onComplete: (result: number) => void;
  onClose: () => void;
}

export default function SimpleDiceRoll({ 
  isVisible, 
  diceType, 
  modifier = 0, 
  onComplete, 
  onClose 
}: SimpleDiceRollProps) {
  const [isRolling, setIsRolling] = useState(false);
  const [currentValue, setCurrentValue] = useState(1);
  const [finalResult, setFinalResult] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<'initial' | 'rolling' | 'settling' | 'result'>('initial');

  useEffect(() => {
    if (isVisible && !isRolling) {
      startRoll();
    }
  }, [isVisible]);

  const startRoll = () => {
    setIsRolling(true);
    setFinalResult(null);
    setShowResult(false);
    setAnimationPhase('rolling');
    
    // Realistic dice rolling animation with multiple phases - Extended for more excitement!
    let rollCount = 0;
    const rollInterval = setInterval(() => {
      setCurrentValue(Math.floor(Math.random() * diceType) + 1);
      rollCount++;
      
      // Phase 1: Fast rolling (first 15 rolls)
      if (rollCount === 15) {
        setAnimationPhase('settling');
      }
      
      // Phase 2: Medium rolling (next 10 rolls)
      if (rollCount === 25) {
        setAnimationPhase('settling');
      }
      
      // Phase 3: Final settling (next 8 rolls)
      if (rollCount >= 33) {
        clearInterval(rollInterval);
        const result = Math.floor(Math.random() * diceType) + 1;
        const totalResult = result + modifier;
        
        setCurrentValue(result);
        setFinalResult(totalResult);
        setIsRolling(false);
        setAnimationPhase('result');
        
        // Show result immediately - no auto-close
        setTimeout(() => {
          setShowResult(true);
          // Don't call onComplete here - only when user manually closes
        }, 800);
      }
    }, rollCount < 15 ? 60 : rollCount < 25 ? 100 : 150); // Slower progression for more drama
  };

  if (!isVisible) return null;

  const getDiceColor = () => {
    switch (diceType) {
      case 4: return 'bg-red-600';
      case 6: return 'bg-blue-600';
      case 8: return 'bg-green-600';
      case 10: return 'bg-yellow-600';
      case 12: return 'bg-purple-600';
      case 20: return 'bg-orange-600';
      default: return 'bg-gray-600';
    }
  };

  const getDiceIcon = () => {
    switch (diceType) {
      case 4: return '🔺';
      case 6: return '🎲';
      case 8: return '🔷';
      case 10: return '🔸';
      case 12: return '🔶';
      case 20: return '🎯';
      default: return '🎲';
    }
  };

  const getAnimationClass = () => {
    switch (animationPhase) {
      case 'rolling':
        return 'dice-tumble';
      case 'settling':
        return 'dice-settle';
      case 'result':
        return 'result-glow';
      default:
        return 'animate-none';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-dnd-darker border-2 border-dnd-gold rounded-lg p-8 text-center max-w-md mx-4">
        <h2 className="text-2xl font-bold text-dnd-gold mb-6">
          🎲 The Dungeon Master Calls for a Roll! 🎲
        </h2>
        
        <div className="mb-6">
          <div className="text-lg text-white mb-4">
            Rolling d{diceType}
            {modifier !== 0 && (
              <span className="text-dnd-gold">
                {modifier > 0 ? ` + ${modifier}` : ` ${modifier}`}
              </span>
            )}
          </div>
          
          {/* Enhanced Dice Display with Realistic Animation */}
          <div className="flex justify-center mb-6">
            <div className="relative dice-3d">
              {/* Dice Shadow */}
              <div className={`absolute top-3 left-3 w-20 h-20 ${getDiceColor()} opacity-20 rounded-lg blur-sm`}></div>
              
              {/* Main Dice */}
              <div className={`relative w-20 h-20 ${getDiceColor()} border-2 border-dnd-gold rounded-lg flex items-center justify-center text-4xl transform transition-all duration-100 ${getAnimationClass()}`}>
                {isRolling ? (
                  <span className="animate-spin text-2xl">{getDiceIcon()}</span>
                ) : (
                  <span className="text-white font-bold text-2xl drop-shadow-lg">{currentValue}</span>
                )}
              </div>
              
              {/* Rolling Particles Effect */}
              {isRolling && animationPhase === 'rolling' && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="rolling-particle absolute top-2 left-1/2 particle-float"></div>
                  <div className="rolling-particle absolute bottom-2 right-2 particle-float animation-delay-200"></div>
                  <div className="rolling-particle absolute top-1/2 left-2 particle-float animation-delay-400"></div>
                  <div className="rolling-particle absolute top-1/3 right-1/3 particle-float animation-delay-600"></div>
                </div>
              )}
              
              {/* Result Glow Effect */}
              {finalResult !== null && showResult && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className={`absolute inset-0 ${getDiceColor()} opacity-20 rounded-lg ${finalResult >= 20 ? 'critical-success' : finalResult >= 15 ? 'great-success' : 'failure'}`}></div>
                </div>
              )}
            </div>
          </div>
          
          {/* Status Text */}
          {isRolling && (
            <div className="text-dnd-gold text-sm mb-4">
              {animationPhase === 'rolling' && (
                <span className="animate-pulse">🎲 The dice are tumbling wildly...</span>
              )}
              {animationPhase === 'settling' && (
                <span className="animate-pulse">🎯 The dice are settling into place...</span>
              )}
            </div>
          )}
          
          {/* Results Display */}
          {finalResult !== null && showResult && (
            <div className="space-y-3 animate-fade-in">
              <div className="text-xl text-white">
                <span className="text-gray-400">Base Roll:</span> 
                <span className="text-dnd-gold font-bold text-2xl mx-2">{currentValue}</span>
                {modifier !== 0 && (
                  <>
                    <span className="text-dnd-gold mx-2">
                      {modifier > 0 ? '+' : ''}{modifier}
                    </span>
                    <span className="text-gray-400">=</span>
                  </>
                )}
              </div>
              <div className="text-4xl font-bold text-dnd-gold animate-pulse">
                Total: {finalResult}
              </div>
              <div className="text-lg font-medium">
                {finalResult >= 20 ? (
                  <span className="text-yellow-400 animate-bounce">🎉 Critical Success!</span>
                ) : finalResult >= 15 ? (
                  <span className="text-green-400">✨ Great Success!</span>
                ) : finalResult >= 10 ? (
                  <span className="text-blue-400">✅ Success</span>
                ) : finalResult >= 5 ? (
                  <span className="text-orange-400">⚠️ Partial Success</span>
                ) : (
                  <span className="text-red-400">❌ Failure</span>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Manual Close Button (only show after result is displayed) */}
        {finalResult !== null && showResult && (
          <button
            onClick={() => {
              onComplete(finalResult);
              onClose();
            }}
            className="bg-dnd-gold hover:bg-yellow-600 text-dnd-darker px-6 py-2 rounded font-bold transition-colors animate-fade-in"
          >
            Continue Adventure
          </button>
        )}
        
        {/* Manual close instruction */}
        {finalResult !== null && showResult && (
          <div className="text-xs text-gray-400 mt-2">
            Click "Continue Adventure" when ready
          </div>
        )}
      </div>
    </div>
  );
}
