'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface DiceRollAnimationProps {
  isVisible: boolean;
  diceType: number;
  modifier?: number;
  onComplete: (result: number) => void;
  onClose: () => void;
}

export default function DiceRollAnimation({ 
  isVisible, 
  diceType, 
  modifier = 0, 
  onComplete, 
  onClose 
}: DiceRollAnimationProps) {
  const [isRolling, setIsRolling] = useState(false);
  const [currentValue, setCurrentValue] = useState(1);
  const [finalResult, setFinalResult] = useState<number | null>(null);
  const [rollCount, setRollCount] = useState(0);

  useEffect(() => {
    if (isVisible && !isRolling) {
      startRoll();
    }
  }, [isVisible, isRolling, startRoll]);

  const startRoll = useCallback(() => {
    setIsRolling(true);
    setFinalResult(null);
    setRollCount(0);
    
    // Animate dice rolling
    const rollInterval = setInterval(() => {
      setCurrentValue(Math.floor(Math.random() * diceType) + 1);
      setRollCount(prev => prev + 1);
    }, 100);

    // Stop rolling after 2 seconds
    setTimeout(() => {
      clearInterval(rollInterval);
      const result = Math.floor(Math.random() * diceType) + 1;
      const totalResult = result + modifier;
      
      setCurrentValue(result);
      setFinalResult(totalResult);
      setIsRolling(false);
      
      // Call onComplete after a short delay
      setTimeout(() => {
        onComplete(totalResult);
      }, 1000);
    }, 2000);
  }, [diceType, modifier, onComplete]);

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

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-dnd-darker border-2 border-dnd-gold rounded-lg p-8 text-center max-w-md mx-4">
        <h2 className="text-2xl font-bold text-dnd-gold mb-6">
          🎲 The Dungeon Master Calls for a Roll! 🎲
        </h2>
        
        <div className="mb-6">
          <div className="text-lg text-white mb-2">
            Rolling d{diceType}
            {modifier !== 0 && (
              <span className="text-dnd-gold">
                {modifier > 0 ? ` + ${modifier}` : ` ${modifier}`}
              </span>
            )}
          </div>
          
          {/* Animated Dice */}
          <div className="flex justify-center mb-4">
            <div 
              className={`w-20 h-20 ${getDiceColor()} border-2 border-dnd-gold rounded-lg flex items-center justify-center text-4xl transform transition-transform duration-100 ${
                isRolling ? 'animate-bounce rotate-12' : ''
              }`}
            >
              {isRolling ? (
                <span className="animate-pulse">{getDiceIcon()}</span>
              ) : (
                <span className="text-white font-bold text-2xl">{currentValue}</span>
              )}
            </div>
          </div>
          
          {isRolling && (
            <div className="text-dnd-gold text-sm animate-pulse">
              Rolling... {rollCount > 0 && `(${rollCount} rolls)`}
            </div>
          )}
          
          {finalResult !== null && (
            <div className="space-y-2">
              <div className="text-xl text-white">
                <span className="text-gray-400">Base Roll:</span> {currentValue}
                {modifier !== 0 && (
                  <>
                    <span className="text-dnd-gold mx-2">
                      {modifier > 0 ? '+' : ''}{modifier}
                    </span>
                    <span className="text-gray-400">=</span>
                  </>
                )}
              </div>
              <div className="text-3xl font-bold text-dnd-gold">
                Total: {finalResult}
              </div>
              <div className="text-sm text-gray-400">
                {finalResult >= 20 ? '🎉 Critical Success!' : 
                 finalResult >= 15 ? '✨ Great Success!' :
                 finalResult >= 10 ? '✅ Success' :
                 finalResult >= 5 ? '⚠️ Partial Success' : '❌ Failure'}
              </div>
            </div>
          )}
        </div>
        
        {finalResult !== null && (
          <button
            onClick={onClose}
            className="bg-dnd-gold hover:bg-yellow-600 text-dnd-darker px-6 py-2 rounded font-bold transition-colors"
          >
            Continue Adventure
          </button>
        )}
      </div>
    </div>
  );
}



