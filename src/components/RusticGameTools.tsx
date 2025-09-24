'use client';

import React, { useState } from 'react';

interface RusticGameToolsProps {
  onRollDice: (diceType: number, modifier?: number) => void;
  onShowGameSheets: () => void;
  onShowAISettings: () => void;
  onShowCharacterCreation: () => void;
  selectedModel?: string;
  availableModels?: Array<{ name: string; size: number }>;
  onModelChange?: (model: string) => void;
}

export default function RusticGameTools({ 
  onRollDice, 
  onShowGameSheets, 
  onShowAISettings, 
  onShowCharacterCreation,
  selectedModel,
  availableModels = [],
  onModelChange
}: RusticGameToolsProps) {
  const [diceType, setDiceType] = useState(20);
  const [diceModifier, setDiceModifier] = useState(0);

  const diceTypes = [
    { value: 4, label: 'd4', icon: '🔺' },
    { value: 6, label: 'd6', icon: '🎲' },
    { value: 8, label: 'd8', icon: '🔷' },
    { value: 10, label: 'd10', icon: '🔸' },
    { value: 12, label: 'd12', icon: '🔶' },
    { value: 20, label: 'd20', icon: '🎯' },
    { value: 100, label: 'd100', icon: '💯' }
  ];

  const handleRollDice = () => {
    onRollDice(diceType, diceModifier);
  };

  return (
    <div className="space-y-4">
      {/* Dice Roller */}
      <div className="fantasy-card">
        <h3 className="rustic-subtitle text-lg mb-3">🎲 Dice Roller</h3>
        
        {/* Dice Type Selection */}
        <div className="mb-3">
          <label className="block text-sm text-dnd-gold mb-2">Dice Type</label>
          <div className="grid grid-cols-2 gap-1">
            {diceTypes.map(dice => (
              <button
                key={dice.value}
                onClick={() => setDiceType(dice.value)}
                className={`p-2 text-xs rounded border transition-all ${
                  diceType === dice.value
                    ? 'bg-dnd-gold text-dnd-darker border-dnd-gold'
                    : 'bg-dnd-darker border-dnd-gold text-white hover:bg-dnd-dark'
                }`}
              >
                <div className="text-lg">{dice.icon}</div>
                <div>{dice.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Modifier */}
        <div className="mb-3">
          <label className="block text-sm text-dnd-gold mb-2">Modifier</label>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setDiceModifier(diceModifier - 1)}
              className="rustic-button text-sm px-2 py-1"
            >
              -
            </button>
            <input
              type="number"
              value={diceModifier}
              onChange={(e) => setDiceModifier(parseInt(e.target.value) || 0)}
              className="rustic-input text-center w-16"
              suppressHydrationWarning
            />
            <button
              onClick={() => setDiceModifier(diceModifier + 1)}
              className="rustic-button text-sm px-2 py-1"
            >
              +
            </button>
          </div>
        </div>

        {/* Roll Button */}
        <button
          onClick={handleRollDice}
          className="w-full rustic-button glow-effect"
        >
          Roll d{diceType}{diceModifier !== 0 ? (diceModifier > 0 ? ` + ${diceModifier}` : ` ${diceModifier}`) : ''}
        </button>
      </div>

      {/* Quick Actions */}
      <div className="fantasy-card">
        <h3 className="rustic-subtitle text-lg mb-3">⚡ Quick Actions</h3>
        <div className="space-y-2">
          <button
            onClick={onShowGameSheets}
            className="w-full rustic-button text-sm"
          >
            📋 Game Sheets
          </button>
          <button
            onClick={onShowAISettings}
            className="w-full rustic-button text-sm"
          >
            🎭 AI Settings
          </button>
          <button
            onClick={onShowCharacterCreation}
            className="w-full rustic-button text-sm"
          >
            ✨ Create Character
          </button>
        </div>
      </div>

      {/* AI Model Selection */}
      {availableModels.length > 0 && (
        <div className="fantasy-card">
          <h3 className="rustic-subtitle text-lg mb-3">🤖 AI Model</h3>
          <div className="space-y-2">
            {availableModels.map((model, index) => (
              <button
                key={index}
                onClick={() => onModelChange?.(model.name)}
                className={`w-full p-2 text-xs rounded border transition-all ${
                  selectedModel === model.name
                    ? 'bg-dnd-gold text-dnd-darker border-dnd-gold'
                    : 'bg-dnd-darker border-dnd-gold text-white hover:bg-dnd-dark'
                }`}
              >
                <div className="font-bold">{model.name}</div>
                <div className="text-xs opacity-75">
                  {(model.size / (1024 * 1024 * 1024)).toFixed(1)} GB
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Game Status */}
      <div className="fantasy-card">
        <h3 className="rustic-subtitle text-lg mb-3">📊 Game Status</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">AI Status:</span>
            <span className="text-green-400">● Online</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Active Model:</span>
            <span className="text-dnd-gold text-xs">
              {selectedModel || 'None'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Session:</span>
            <span className="text-blue-400">Active</span>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="fantasy-card">
        <h3 className="rustic-subtitle text-lg mb-3">💡 Tips</h3>
        <div className="text-xs rustic-text space-y-1">
          <div>• Use "show character sheet" to open detailed stats</div>
          <div>• Try "roll for initiative" for combat</div>
          <div>• Ask the AI to describe scenes vividly</div>
          <div>• Use dice rolls for skill checks</div>
        </div>
      </div>
    </div>
  );
}
