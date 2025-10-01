'use client';

import React, { useState, useCallback } from 'react';

interface Combatant {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  ac: number;
  initiative: number;
  isPlayer: boolean;
  actions: string[];
  statusEffects: string[];
}

interface CombatAction {
  type: 'attack' | 'spell' | 'item' | 'move' | 'dodge';
  name: string;
  description: string;
  damage?: string;
  healing?: number;
  effects?: string[];
}

interface CombatSystemProps {
  characterStats: any;
  onCombatEnd: (victory: boolean) => void;
}

const ENEMY_TEMPLATES = [
  {
    name: 'Goblin',
    hp: 7,
    ac: 15,
    actions: ['Scimitar Attack', 'Shortbow Attack'],
    description: 'A small, green-skinned humanoid with malicious intent.'
  },
  {
    name: 'Orc',
    hp: 15,
    ac: 13,
    actions: ['Greataxe Attack', 'Javelin Throw'],
    description: 'A large, brutish humanoid warrior.'
  },
  {
    name: 'Skeleton',
    hp: 13,
    ac: 13,
    actions: ['Shortsword Attack', 'Bone Throw'],
    description: 'An animated skeleton, its bones clattering as it moves.'
  },
  {
    name: 'Wolf',
    hp: 11,
    ac: 13,
    actions: ['Bite Attack', 'Pack Tactics'],
    description: 'A fierce wolf with glowing eyes.'
  }
];

export default function CombatSystem({ characterStats, onCombatEnd }: CombatSystemProps) {
  const [combatants, setCombatants] = useState<Combatant[]>([]);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [combatLog, setCombatLog] = useState<string[]>([]);
  const [isInCombat, setIsInCombat] = useState(false);
  const [selectedAction, setSelectedAction] = useState<CombatAction | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<Combatant | null>(null);

  const rollInitiative = useCallback(() => {
    return Math.floor(Math.random() * 20) + 1 + (characterStats.dex || 0);
  }, [characterStats.dex]);

  const startCombat = useCallback((enemyType: string) => {
    const template = ENEMY_TEMPLATES.find(e => e.name === enemyType) || ENEMY_TEMPLATES[0];
    
    const player: Combatant = {
      id: 'player',
      name: characterStats.name || 'Adventurer',
      hp: characterStats.hp || 20,
      maxHp: characterStats.hp || 20,
      ac: 10 + (characterStats.dex || 0),
      initiative: rollInitiative(),
      isPlayer: true,
      actions: ['Attack', 'Cast Spell', 'Use Item', 'Dodge'],
      statusEffects: []
    };

    const enemy: Combatant = {
      id: 'enemy',
      name: template.name,
      hp: template.hp,
      maxHp: template.hp,
      ac: template.ac,
      initiative: Math.floor(Math.random() * 20) + 1,
      isPlayer: false,
      actions: template.actions,
      statusEffects: []
    };

    const combatants = [player, enemy].sort((a, b) => b.initiative - a.initiative);
    
    setCombatants(combatants);
    setCurrentTurn(0);
    setCombatLog([`Combat begins! ${player.name} encounters a ${enemy.name}!`]);
    setIsInCombat(true);
  }, [characterStats, rollInitiative]);

  const endCombat = useCallback((victory: boolean) => {
    setIsInCombat(false);
    setCombatants([]);
    setCombatLog([]);
    onCombatEnd(victory);
  }, [onCombatEnd]);

  const rollDamage = useCallback((damageDice: string) => {
    // Simple damage calculation (e.g., "1d8+2" -> roll 1d8, add 2)
    const match = damageDice.match(/(\d+)d(\d+)([+-]\d+)?/);
    if (!match) return 0;
    
    const numDice = parseInt(match[1]);
    const dieSize = parseInt(match[2]);
    const modifier = match[3] ? parseInt(match[3]) : 0;
    
    let damage = 0;
    for (let i = 0; i < numDice; i++) {
      damage += Math.floor(Math.random() * dieSize) + 1;
    }
    damage += modifier;
    
    return Math.max(1, damage);
  }, []);

  const performAction = useCallback((action: CombatAction, attacker: Combatant, target: Combatant) => {
    let logMessage = `${attacker.name} uses ${action.name}`;
    
    if (action.type === 'attack') {
      const attackRoll = Math.floor(Math.random() * 20) + 1;
      const hit = attackRoll + (attacker.isPlayer ? (characterStats.str || 0) : 0) >= target.ac;
      
      if (hit) {
        const damage = action.damage ? rollDamage(action.damage) : 1;
        const newHp = Math.max(0, target.hp - damage);
        
        setCombatants(prev => prev.map(c => 
          c.id === target.id ? { ...c, hp: newHp } : c
        ));
        
        logMessage += ` and hits for ${damage} damage!`;
        
        if (newHp === 0) {
          logMessage += ` ${target.name} is defeated!`;
        }
      } else {
        logMessage += ` but misses!`;
      }
    } else if (action.type === 'spell') {
      // Spell logic would go here
      logMessage += ` and casts a spell!`;
    } else if (action.type === 'item') {
      // Item use logic would go here
      logMessage += ` and uses an item!`;
    }
    
    setCombatLog(prev => [...prev, logMessage]);
    
    // Check for combat end
    const aliveCombatants = combatants.filter(c => c.hp > 0);
    if (aliveCombatants.length <= 1) {
      const victory = aliveCombatants[0]?.isPlayer || false;
      endCombat(victory);
    } else {
      // Next turn
      setCurrentTurn(prev => (prev + 1) % combatants.length);
    }
  }, [combatants, characterStats, rollDamage, endCombat]);

  const enemyTurn = useCallback(() => {
    const enemy = combatants.find(c => !c.isPlayer && c.hp > 0);
    const player = combatants.find(c => c.isPlayer);
    
    if (enemy && player) {
      const action: CombatAction = {
        type: 'attack',
        name: enemy.actions[0],
        description: 'A basic attack',
        damage: '1d6+1'
      };
      
      performAction(action, enemy, player);
    }
  }, [combatants, performAction]);

  const getCurrentCombatant = () => {
    return combatants[currentTurn];
  };

  const getHpPercentage = (combatant: Combatant) => {
    return (combatant.hp / combatant.maxHp) * 100;
  };

  const getHpColor = (percentage: number) => {
    if (percentage > 60) return 'bg-green-500';
    if (percentage > 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (!isInCombat) {
    return (
      <div className="combat-system bg-gray-800 p-4 rounded-lg border border-gray-600">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center">
          ⚔️ Combat System
        </h3>
        
        <p className="text-gray-300 mb-4">
          Ready for battle? Choose an enemy to fight!
        </p>
        
        <div className="grid grid-cols-2 gap-2">
          {ENEMY_TEMPLATES.map(enemy => (
            <button
              key={enemy.name}
              onClick={() => startCombat(enemy.name)}
              className="p-3 bg-red-600 hover:bg-red-700 text-white rounded border border-red-500 text-left"
            >
              <div className="font-bold">{enemy.name}</div>
              <div className="text-sm text-red-200">
                HP: {enemy.hp} | AC: {enemy.ac}
              </div>
              <div className="text-xs text-red-300 mt-1">
                {enemy.description}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const currentCombatant = getCurrentCombatant();
  const isPlayerTurn = currentCombatant?.isPlayer;

  return (
    <div className="combat-system bg-gray-800 p-4 rounded-lg border border-gray-600">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center">
        ⚔️ Combat in Progress
      </h3>

      {/* Combatants */}
      <div className="space-y-3 mb-4">
        {combatants.map(combatant => {
          const hpPercentage = getHpPercentage(combatant);
          const isCurrentTurn = combatant.id === currentCombatant?.id;
          
          return (
            <div
              key={combatant.id}
              className={`p-3 rounded border ${
                isCurrentTurn
                  ? 'bg-blue-600 border-blue-500'
                  : 'bg-gray-700 border-gray-600'
              }`}
            >
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">
                    {combatant.name}
                    {isCurrentTurn && ' (Current Turn)'}
                  </span>
                  <span className="text-sm text-gray-300">
                    AC: {combatant.ac}
                  </span>
                </div>
                <div className="text-sm text-gray-300">
                  {combatant.hp}/{combatant.maxHp} HP
                </div>
              </div>
              
              <div className="w-full bg-gray-600 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${getHpColor(hpPercentage)}`}
                  style={{ width: `${hpPercentage}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Combat Log */}
      <div className="mb-4">
        <h4 className="text-sm font-bold text-gray-300 mb-2">Combat Log:</h4>
        <div className="bg-gray-900 p-3 rounded max-h-32 overflow-y-auto">
          {combatLog.map((log, index) => (
            <div key={index} className="text-sm text-gray-300 mb-1">
              {log}
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      {isPlayerTurn ? (
        <div>
          <h4 className="text-sm font-bold text-gray-300 mb-2">Your Actions:</h4>
          <div className="grid grid-cols-2 gap-2">
            {currentCombatant?.actions.map(action => (
              <button
                key={action}
                onClick={() => {
                  const target = combatants.find(c => !c.isPlayer && c.hp > 0);
                  if (target) {
                    const combatAction: CombatAction = {
                      type: 'attack',
                      name: action,
                      description: 'A basic attack',
                      damage: '1d8+1'
                    };
                    performAction(combatAction, currentCombatant, target);
                  }
                }}
                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
              >
                {action}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center">
          <p className="text-gray-300 mb-2">
            {currentCombatant?.name} is taking their turn...
          </p>
          <button
            onClick={enemyTurn}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
          >
            Continue Combat
          </button>
        </div>
      )}

      <button
        onClick={() => endCombat(false)}
        className="mt-4 w-full py-2 bg-gray-600 hover:bg-gray-700 text-white rounded"
      >
        Flee Combat
      </button>
    </div>
  );
}





