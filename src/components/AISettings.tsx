'use client';

import React, { useState } from 'react';

interface AISettingsProps {
  isVisible: boolean;
  onClose: () => void;
  onSettingsChange: (settings: AISettingsData) => void;
  currentSettings: AISettingsData;
}

export interface AISettingsData {
  personality: 'friendly' | 'mysterious' | 'dramatic' | 'humorous' | 'serious';
  difficulty: 'easy' | 'normal' | 'hard' | 'expert';
  descriptionLevel: 'minimal' | 'moderate' | 'detailed' | 'immersive';
  diceFrequency: 'rare' | 'normal' | 'frequent' | 'constant';
}

const PERSONALITY_DESCRIPTIONS = {
  friendly: 'Warm and encouraging, perfect for new players',
  mysterious: 'Cryptic and atmospheric, creates intrigue',
  dramatic: 'Epic and cinematic, emphasizes heroic moments',
  humorous: 'Light-hearted with jokes and puns',
  serious: 'Professional and focused on the story'
};

const DIFFICULTY_DESCRIPTIONS = {
  easy: 'More forgiving, helps players succeed',
  normal: 'Balanced challenge and reward',
  hard: 'Demanding but fair, requires strategy',
  expert: 'Brutal challenges for experienced players'
};

const DESCRIPTION_DESCRIPTIONS = {
  minimal: 'Brief, to-the-point descriptions',
  moderate: 'Good balance of detail and pacing',
  detailed: 'Rich, vivid scene descriptions',
  immersive: 'Maximum atmosphere and world-building'
};

const DICE_DESCRIPTIONS = {
  rare: 'Dice rolls only for critical moments',
  normal: 'Balanced use of dice for important actions',
  frequent: 'Regular dice rolls for most actions',
  constant: 'Dice rolls for almost everything'
};

export default function AISettings({ isVisible, onClose, onSettingsChange, currentSettings }: AISettingsProps) {
  const [settings, setSettings] = useState<AISettingsData>(currentSettings);

  const handleSave = () => {
    onSettingsChange(settings);
    onClose();
  };

  const handleReset = () => {
    const defaultSettings: AISettingsData = {
      personality: 'friendly',
      difficulty: 'normal',
      descriptionLevel: 'moderate',
      diceFrequency: 'normal'
    };
    setSettings(defaultSettings);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-dnd-darker border border-dnd-gold rounded-lg w-full max-w-2xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-dnd-gold">
          <h2 className="text-xl font-bold text-dnd-gold">🎭 AI Dungeon Master Settings</h2>
          <button
            onClick={onClose}
            className="text-dnd-gold hover:text-yellow-400 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Personality */}
          <div className="bg-dnd-dark border border-dnd-gold rounded p-4">
            <h3 className="text-lg font-bold text-dnd-gold mb-3">🎭 DM Personality</h3>
            <div className="grid grid-cols-1 gap-3">
              {Object.entries(PERSONALITY_DESCRIPTIONS).map(([key, description]) => (
                <label key={key} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="personality"
                    value={key}
                    checked={settings.personality === key}
                    onChange={(e) => setSettings(prev => ({ ...prev, personality: e.target.value as any }))}
                    className="text-dnd-gold focus:ring-dnd-gold"
                  />
                  <div>
                    <div className="text-white font-medium capitalize">{key}</div>
                    <div className="text-gray-400 text-sm">{description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div className="bg-dnd-dark border border-dnd-gold rounded p-4">
            <h3 className="text-lg font-bold text-dnd-gold mb-3">⚔️ Challenge Level</h3>
            <div className="grid grid-cols-1 gap-3">
              {Object.entries(DIFFICULTY_DESCRIPTIONS).map(([key, description]) => (
                <label key={key} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="difficulty"
                    value={key}
                    checked={settings.difficulty === key}
                    onChange={(e) => setSettings(prev => ({ ...prev, difficulty: e.target.value as any }))}
                    className="text-dnd-gold focus:ring-dnd-gold"
                  />
                  <div>
                    <div className="text-white font-medium capitalize">{key}</div>
                    <div className="text-gray-400 text-sm">{description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Description Level */}
          <div className="bg-dnd-dark border border-dnd-gold rounded p-4">
            <h3 className="text-lg font-bold text-dnd-gold mb-3">📝 Description Style</h3>
            <div className="grid grid-cols-1 gap-3">
              {Object.entries(DESCRIPTION_DESCRIPTIONS).map(([key, description]) => (
                <label key={key} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="descriptionLevel"
                    value={key}
                    checked={settings.descriptionLevel === key}
                    onChange={(e) => setSettings(prev => ({ ...prev, descriptionLevel: e.target.value as any }))}
                    className="text-dnd-gold focus:ring-dnd-gold"
                  />
                  <div>
                    <div className="text-white font-medium capitalize">{key}</div>
                    <div className="text-gray-400 text-sm">{description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Dice Frequency */}
          <div className="bg-dnd-dark border border-dnd-gold rounded p-4">
            <h3 className="text-lg font-bold text-dnd-gold mb-3">🎲 Dice Rolling Frequency</h3>
            <div className="grid grid-cols-1 gap-3">
              {Object.entries(DICE_DESCRIPTIONS).map(([key, description]) => (
                <label key={key} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="diceFrequency"
                    value={key}
                    checked={settings.diceFrequency === key}
                    onChange={(e) => setSettings(prev => ({ ...prev, diceFrequency: e.target.value as any }))}
                    className="text-dnd-gold focus:ring-dnd-gold"
                  />
                  <div>
                    <div className="text-white font-medium capitalize">{key}</div>
                    <div className="text-gray-400 text-sm">{description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-4 border-t border-dnd-gold">
          <button
            onClick={handleReset}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded font-bold transition-colors"
          >
            Reset to Defaults
          </button>
          <div className="space-x-2">
            <button
              onClick={onClose}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="bg-dnd-gold hover:bg-yellow-600 text-dnd-darker px-4 py-2 rounded font-bold transition-colors"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

