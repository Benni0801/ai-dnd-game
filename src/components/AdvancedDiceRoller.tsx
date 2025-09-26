'use client';

import React, { useState, useCallback } from 'react';

interface DiceResult {
  id: string;
  type: string;
  value: number;
  maxValue: number;
  isCritical: boolean;
  isFumble: boolean;
}

interface DiceRollerProps {
  onRollComplete: (result: DiceResult[]) => void;
  disabled?: boolean;
}

const DICE_TYPES = [
  { value: 'd4', label: 'd4', max: 4 },
  { value: 'd6', label: 'd6', max: 6 },
  { value: 'd8', label: 'd8', max: 8 },
  { value: 'd10', label: 'd10', max: 10 },
  { value: 'd12', label: 'd12', max: 12 },
  { value: 'd20', label: 'd20', max: 20 },
  { value: 'd100', label: 'd100', max: 100 },
];

export default function AdvancedDiceRoller({ onRollComplete, disabled = false }: DiceRollerProps) {
  const [selectedDice, setSelectedDice] = useState('d20');
  const [quantity, setQuantity] = useState(1);
  const [modifier, setModifier] = useState(0);
  const [isRolling, setIsRolling] = useState(false);
  const [lastRoll, setLastRoll] = useState<DiceResult[]>([]);
  const [rollHistory, setRollHistory] = useState<DiceResult[][]>([]);

  const rollDice = useCallback(async () => {
    if (isRolling || disabled) return;

    setIsRolling(true);
    const diceType = DICE_TYPES.find(d => d.value === selectedDice)!;
    const results: DiceResult[] = [];

    // Simulate rolling animation
    await new Promise(resolve => setTimeout(resolve, 1000));

    for (let i = 0; i < quantity; i++) {
      const value = Math.floor(Math.random() * diceType.max) + 1;
      const isCritical = value === diceType.max;
      const isFumble = value === 1;
      
      results.push({
        id: `${Date.now()}-${i}`,
        type: selectedDice,
        value,
        maxValue: diceType.max,
        isCritical,
        isFumble
      });
    }

    setLastRoll(results);
    setRollHistory(prev => [results, ...prev.slice(0, 9)]); // Keep last 10 rolls
    setIsRolling(false);
    onRollComplete(results);
  }, [selectedDice, quantity, isRolling, disabled, onRollComplete]);

  const getTotal = (results: DiceResult[]) => {
    return results.reduce((sum, die) => sum + die.value, 0) + modifier;
  };

  const getRollText = (results: DiceResult[]) => {
    const diceValues = results.map(d => d.value).join(', ');
    const total = getTotal(results);
    const modifierText = modifier !== 0 ? ` + ${modifier}` : '';
    return `${quantity}${selectedDice}: [${diceValues}]${modifierText} = ${total}`;
  };

  return (
    <div className="dice-roller bg-gray-800 p-4 rounded-lg border border-gray-600">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center">
        🎲 Advanced Dice Roller
      </h3>

      {/* Dice Selection */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Dice Type
          </label>
          <select
            value={selectedDice}
            onChange={(e) => setSelectedDice(e.target.value)}
            className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600"
            disabled={isRolling}
          >
            {DICE_TYPES.map(dice => (
              <option key={dice.value} value={dice.value}>
                {dice.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Quantity
          </label>
          <input
            type="number"
            min="1"
            max="10"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
            className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600"
            disabled={isRolling}
          />
        </div>
      </div>

      {/* Modifier */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Modifier
        </label>
        <input
          type="number"
          value={modifier}
          onChange={(e) => setModifier(parseInt(e.target.value) || 0)}
          className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600"
          disabled={isRolling}
          placeholder="+0"
        />
      </div>

      {/* Roll Button */}
      <button
        onClick={rollDice}
        disabled={isRolling || disabled}
        className={`w-full py-3 px-4 rounded-lg font-bold text-lg transition-all duration-200 ${
          isRolling
            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
            : 'bg-red-600 hover:bg-red-700 text-white transform hover:scale-105'
        }`}
      >
        {isRolling ? '🎲 Rolling...' : `🎲 Roll ${quantity}${selectedDice}${modifier !== 0 ? ` + ${modifier}` : ''}`}
      </button>

      {/* Last Roll Result */}
      {lastRoll.length > 0 && (
        <div className="mt-4 p-3 bg-gray-700 rounded border border-gray-600">
          <h4 className="text-sm font-medium text-gray-300 mb-2">Last Roll:</h4>
          <div className="flex flex-wrap gap-2 mb-2">
            {lastRoll.map((die, index) => (
              <div
                key={die.id}
                className={`px-3 py-1 rounded text-sm font-bold ${
                  die.isCritical
                    ? 'bg-green-600 text-white'
                    : die.isFumble
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-600 text-white'
                }`}
              >
                {die.value}
                {die.isCritical && ' ⚡'}
                {die.isFumble && ' 💥'}
              </div>
            ))}
          </div>
          <div className="text-white font-bold">
            Total: {getTotal(lastRoll)}
            {modifier !== 0 && (
              <span className="text-gray-400 text-sm ml-2">
                ({lastRoll.reduce((sum, die) => sum + die.value, 0)} + {modifier})
              </span>
            )}
          </div>
        </div>
      )}

      {/* Roll History */}
      {rollHistory.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-300 mb-2">Recent Rolls:</h4>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {rollHistory.slice(0, 5).map((roll, index) => (
              <div key={index} className="text-xs text-gray-400 bg-gray-700 p-2 rounded">
                {getRollText(roll)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
