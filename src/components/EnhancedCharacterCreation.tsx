'use client';

import React, { useState } from 'react';

interface CharacterCreationProps {
  onCharacterCreated: (character: any) => void;
  onClose: () => void;
}

interface Race {
  name: string;
  description: string;
  bonuses: { [key: string]: number };
  traits: string[];
  size: string;
  speed: number;
}

interface Class {
  name: string;
  description: string;
  hitDie: number;
  primaryAbility: string[];
  savingThrows: string[];
  skills: string[];
  equipment: string[];
  features: string[];
}

interface Background {
  name: string;
  description: string;
  skills: string[];
  equipment: string[];
  feature: string;
}

const RACES: Race[] = [
  {
    name: 'Human',
    description: 'Versatile and ambitious, humans are the most adaptable of all races.',
    bonuses: { str: 1, dex: 1, int: 1, con: 1, wis: 1, cha: 1 },
    traits: ['Extra Language', 'Extra Skill Proficiency'],
    size: 'Medium',
    speed: 30
  },
  {
    name: 'Elf',
    description: 'Graceful and long-lived, elves are connected to nature and magic.',
    bonuses: { dex: 2, int: 1 },
    traits: ['Darkvision', 'Fey Ancestry', 'Trance', 'Elf Weapon Training'],
    size: 'Medium',
    speed: 30
  },
  {
    name: 'Dwarf',
    description: 'Hardy and traditional, dwarves are master craftsmen and warriors.',
    bonuses: { con: 2, str: 1 },
    traits: ['Darkvision', 'Dwarven Resilience', 'Dwarven Combat Training', 'Stonecunning'],
    size: 'Medium',
    speed: 25
  },
  {
    name: 'Halfling',
    description: 'Brave and lucky, halflings are nimble and optimistic.',
    bonuses: { dex: 2, cha: 1 },
    traits: ['Lucky', 'Brave', 'Halfling Nimbleness'],
    size: 'Small',
    speed: 25
  },
  {
    name: 'Dragonborn',
    description: 'Strong and charismatic, dragonborn have draconic heritage.',
    bonuses: { str: 2, cha: 1 },
    traits: ['Draconic Ancestry', 'Breath Weapon', 'Damage Resistance'],
    size: 'Medium',
    speed: 30
  },
  {
    name: 'Tiefling',
    description: 'Charismatic and magical, tieflings have infernal heritage.',
    bonuses: { int: 1, cha: 2 },
    traits: ['Darkvision', 'Hellish Resistance', 'Infernal Legacy'],
    size: 'Medium',
    speed: 30
  }
];

const CLASSES: Class[] = [
  {
    name: 'Fighter',
    description: 'A master of martial combat, skilled with weapons and armor.',
    hitDie: 10,
    primaryAbility: ['Strength', 'Constitution'],
    savingThrows: ['Strength', 'Constitution'],
    skills: ['Acrobatics', 'Animal Handling', 'Athletics', 'History', 'Insight', 'Intimidation', 'Perception', 'Survival'],
    equipment: ['Chain mail', 'Shield', 'Longsword', 'Handaxe', 'Dungeoneer\'s pack'],
    features: ['Fighting Style', 'Second Wind']
  },
  {
    name: 'Wizard',
    description: 'A scholarly magic-user capable of manipulating the fabric of reality.',
    hitDie: 6,
    primaryAbility: ['Intelligence'],
    savingThrows: ['Intelligence', 'Wisdom'],
    skills: ['Arcana', 'History', 'Insight', 'Investigation', 'Medicine', 'Religion'],
    equipment: ['Quarterstaff', 'Dagger', 'Component pouch', 'Scholar\'s pack', 'Spellbook'],
    features: ['Spellcasting', 'Arcane Recovery']
  },
  {
    name: 'Rogue',
    description: 'A scoundrel who uses stealth and trickery to overcome obstacles.',
    hitDie: 8,
    primaryAbility: ['Dexterity'],
    savingThrows: ['Dexterity', 'Intelligence'],
    skills: ['Acrobatics', 'Athletics', 'Deception', 'Insight', 'Intimidation', 'Investigation', 'Perception', 'Performance', 'Persuasion', 'Sleight of Hand', 'Stealth'],
    equipment: ['Rapier', 'Shortbow', 'Burglar\'s pack', 'Leather armor', 'Dagger'],
    features: ['Expertise', 'Sneak Attack', 'Thieves\' Cant']
  },
  {
    name: 'Cleric',
    description: 'A priestly champion who wields divine magic in service of a higher power.',
    hitDie: 8,
    primaryAbility: ['Wisdom'],
    savingThrows: ['Wisdom', 'Charisma'],
    skills: ['History', 'Insight', 'Medicine', 'Persuasion', 'Religion'],
    equipment: ['Mace', 'Shield', 'Chain mail', 'Priest\'s pack', 'Holy symbol'],
    features: ['Spellcasting', 'Divine Domain', 'Channel Divinity']
  },
  {
    name: 'Ranger',
    description: 'A warrior who uses martial prowess and nature magic to combat threats.',
    hitDie: 10,
    primaryAbility: ['Dexterity', 'Wisdom'],
    savingThrows: ['Strength', 'Dexterity'],
    skills: ['Animal Handling', 'Athletics', 'Insight', 'Investigation', 'Nature', 'Perception', 'Stealth', 'Survival'],
    equipment: ['Longbow', 'Quiver', 'Scale mail', 'Explorer\'s pack', 'Dagger'],
    features: ['Favored Enemy', 'Natural Explorer', 'Spellcasting']
  },
  {
    name: 'Barbarian',
    description: 'A fierce warrior of primitive background who can enter a battle rage.',
    hitDie: 12,
    primaryAbility: ['Strength'],
    savingThrows: ['Strength', 'Constitution'],
    skills: ['Animal Handling', 'Athletics', 'Intimidation', 'Nature', 'Perception', 'Survival'],
    equipment: ['Greataxe', 'Handaxe', 'Javelin', 'Explorer\'s pack'],
    features: ['Rage', 'Unarmored Defense', 'Reckless Attack']
  }
];

const BACKGROUNDS: Background[] = [
  {
    name: 'Acolyte',
    description: 'You have spent your life in the service of a temple.',
    skills: ['Insight', 'Religion'],
    equipment: ['Holy symbol', 'Prayer book', 'Incense', 'Common clothes', 'Belt pouch with 15 gp'],
    feature: 'Shelter of the Faithful'
  },
  {
    name: 'Criminal',
    description: 'You are an experienced criminal with a history of breaking the law.',
    skills: ['Deception', 'Stealth'],
    equipment: ['Crowbar', 'Dark common clothes with hood', 'Belt pouch with 15 gp'],
    feature: 'Criminal Contact'
  },
  {
    name: 'Folk Hero',
    description: 'You come from a humble social rank, but you are destined for so much more.',
    skills: ['Animal Handling', 'Survival'],
    equipment: ['Artisan\'s tools', 'Shovel', 'Iron pot', 'Common clothes', 'Belt pouch with 10 gp'],
    feature: 'Rustic Hospitality'
  },
  {
    name: 'Noble',
    description: 'You understand wealth, power, and privilege.',
    skills: ['History', 'Persuasion'],
    equipment: ['Signet ring', 'Scroll of pedigree', 'Purse with 25 gp'],
    feature: 'Position of Privilege'
  },
  {
    name: 'Sage',
    description: 'You spent years learning the lore of the multiverse.',
    skills: ['Arcana', 'History'],
    equipment: ['Ink', 'Quill', 'Small knife', 'Letter from a dead colleague', 'Common clothes', 'Belt pouch with 10 gp'],
    feature: 'Researcher'
  },
  {
    name: 'Soldier',
    description: 'War has been your life for as long as you care to remember.',
    skills: ['Athletics', 'Intimidation'],
    equipment: ['Insignia of rank', 'Trophy from a fallen enemy', 'Playing cards', 'Common clothes', 'Belt pouch with 10 gp'],
    feature: 'Military Rank'
  }
];

export default function EnhancedCharacterCreation({ onCharacterCreated, onClose }: CharacterCreationProps) {
  const [step, setStep] = useState(1);
  const [characterName, setCharacterName] = useState('');
  const [selectedRace, setSelectedRace] = useState<Race | null>(null);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [selectedBackground, setSelectedBackground] = useState<Background | null>(null);
  const [attributes, setAttributes] = useState({
    str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8
  });
  const [availablePoints, setAvailablePoints] = useState(27);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [backstory, setBackstory] = useState('');

  const attributeCosts = [0, 1, 2, 3, 4, 5, 7, 9]; // Cost for values 8-15

  const calculateAttributeCost = (value: number) => {
    if (value < 8 || value > 15) return 0;
    return attributeCosts[value - 8];
  };

  const getTotalAttributeCost = () => {
    return Object.values(attributes).reduce((total, value) => total + calculateAttributeCost(value), 0);
  };

  const updateAttribute = (attr: string, value: number) => {
    if (value < 8 || value > 15) return;
    
    const currentCost = calculateAttributeCost(attributes[attr as keyof typeof attributes]);
    const newCost = calculateAttributeCost(value);
    const costDifference = newCost - currentCost;
    
    if (availablePoints - costDifference >= 0) {
      setAttributes(prev => ({ ...prev, [attr]: value }));
      setAvailablePoints(prev => prev - costDifference);
    }
  };

  const getFinalAttributes = () => {
    if (!selectedRace) return attributes;
    
    const final = { ...attributes };
    Object.entries(selectedRace.bonuses).forEach(([attr, bonus]) => {
      final[attr as keyof typeof final] += bonus;
    });
    return final;
  };

  const getHitPoints = () => {
    if (!selectedClass) return 8;
    const conMod = Math.floor((getFinalAttributes().con - 10) / 2);
    return selectedClass.hitDie + conMod;
  };

  const getProficiencyBonus = () => 2; // Level 1

  const getSkillModifier = (skill: string) => {
    const finalAttrs = getFinalAttributes();
    let ability = 'str';
    
    // Map skills to abilities (simplified)
    const skillAbilityMap: { [key: string]: string } = {
      'Athletics': 'str',
      'Acrobatics': 'dex', 'Sleight of Hand': 'dex', 'Stealth': 'dex',
      'Arcana': 'int', 'History': 'int', 'Investigation': 'int', 'Nature': 'int', 'Religion': 'int',
      'Animal Handling': 'wis', 'Insight': 'wis', 'Medicine': 'wis', 'Perception': 'wis', 'Survival': 'wis',
      'Deception': 'cha', 'Intimidation': 'cha', 'Performance': 'cha', 'Persuasion': 'cha'
    };
    
    ability = skillAbilityMap[skill] || 'str';
    const baseMod = Math.floor((finalAttrs[ability as keyof typeof finalAttrs] - 10) / 2);
    const proficiency = selectedSkills.includes(skill) ? getProficiencyBonus() : 0;
    return baseMod + proficiency;
  };

  const createCharacter = () => {
    if (!selectedRace || !selectedClass || !selectedBackground) return;

    const finalAttributes = getFinalAttributes();
    const inventory = [
      ...selectedClass.equipment,
      ...selectedBackground.equipment
    ].join(', ');

    const character = {
      name: characterName || 'Adventurer',
      race: selectedRace.name,
      class: selectedClass.name,
      background: selectedBackground.name,
      level: 1,
      str: finalAttributes.str,
      dex: finalAttributes.dex,
      int: finalAttributes.int,
      con: finalAttributes.con,
      wis: finalAttributes.wis,
      cha: finalAttributes.cha,
      hp: getHitPoints(),
      inventory,
      backstory,
      skills: selectedSkills,
      specialAbilities: [
        ...selectedRace.traits,
        ...selectedClass.features,
        selectedBackground.feature
      ]
    };

    onCharacterCreated(character);
  };

  const canProceed = () => {
    switch (step) {
      case 1: return characterName.trim() !== '';
      case 2: return selectedRace !== null;
      case 3: return selectedClass !== null;
      case 4: return selectedBackground !== null;
      case 5: return getTotalAttributeCost() <= 27;
      case 6: return selectedSkills.length >= 2;
      default: return true;
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-dnd-gold mb-4">Character Name</h3>
        <input
          type="text"
          value={characterName}
          onChange={(e) => setCharacterName(e.target.value)}
          placeholder="Enter your character's name..."
          className="w-full bg-dnd-darker border border-dnd-gold rounded px-4 py-3 text-white text-lg"
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-dnd-gold mb-4">Choose Your Race</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {RACES.map((race) => (
          <div
            key={race.name}
            onClick={() => setSelectedRace(race)}
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
              selectedRace?.name === race.name
                ? 'border-dnd-gold bg-dnd-gold bg-opacity-20'
                : 'border-dnd-dark hover:border-dnd-gold hover:bg-dnd-dark'
            }`}
          >
            <h4 className="text-lg font-bold text-dnd-gold mb-2">{race.name}</h4>
            <p className="text-gray-300 text-sm mb-3">{race.description}</p>
            <div className="text-xs text-gray-400">
              <div>Size: {race.size} | Speed: {race.speed} ft</div>
              <div>Bonuses: {Object.entries(race.bonuses).map(([attr, bonus]) => 
                `${attr.toUpperCase()} +${bonus}`
              ).join(', ')}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-dnd-gold mb-4">Choose Your Class</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CLASSES.map((cls) => (
          <div
            key={cls.name}
            onClick={() => setSelectedClass(cls)}
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
              selectedClass?.name === cls.name
                ? 'border-dnd-gold bg-dnd-gold bg-opacity-20'
                : 'border-dnd-dark hover:border-dnd-gold hover:bg-dnd-dark'
            }`}
          >
            <h4 className="text-lg font-bold text-dnd-gold mb-2">{cls.name}</h4>
            <p className="text-gray-300 text-sm mb-3">{cls.description}</p>
            <div className="text-xs text-gray-400">
              <div>Hit Die: d{cls.hitDie} | Primary: {cls.primaryAbility.join(', ')}</div>
              <div>Features: {cls.features.join(', ')}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-dnd-gold mb-4">Choose Your Background</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {BACKGROUNDS.map((bg) => (
          <div
            key={bg.name}
            onClick={() => setSelectedBackground(bg)}
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
              selectedBackground?.name === bg.name
                ? 'border-dnd-gold bg-dnd-gold bg-opacity-20'
                : 'border-dnd-dark hover:border-dnd-gold hover:bg-dnd-dark'
            }`}
          >
            <h4 className="text-lg font-bold text-dnd-gold mb-2">{bg.name}</h4>
            <p className="text-gray-300 text-sm mb-3">{bg.description}</p>
            <div className="text-xs text-gray-400">
              <div>Skills: {bg.skills.join(', ')}</div>
              <div>Feature: {bg.feature}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-dnd-gold mb-4">Assign Ability Scores</h3>
      <div className="text-center mb-4">
        <span className="text-dnd-gold font-bold">Available Points: {availablePoints}</span>
        <span className="text-gray-400 ml-4">Used: {getTotalAttributeCost()}/27</span>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {Object.entries(attributes).map(([attr, value]) => (
          <div key={attr} className="bg-dnd-dark border border-dnd-gold rounded p-4">
            <h4 className="text-dnd-gold font-bold text-center mb-2">{attr.toUpperCase()}</h4>
            <div className="flex items-center justify-center space-x-2 mb-2">
              <button
                onClick={() => updateAttribute(attr, value - 1)}
                className="w-8 h-8 bg-dnd-darker border border-dnd-gold rounded text-dnd-gold hover:bg-dnd-gold hover:text-dnd-darker"
                disabled={value <= 8}
              >
                -
              </button>
              <span className="text-2xl font-bold text-white w-8 text-center">{value}</span>
              <button
                onClick={() => updateAttribute(attr, value + 1)}
                className="w-8 h-8 bg-dnd-darker border border-dnd-gold rounded text-dnd-gold hover:bg-dnd-gold hover:text-dnd-darker"
                disabled={value >= 15}
              >
                +
              </button>
            </div>
            <div className="text-center text-sm text-gray-400">
              Modifier: {Math.floor((value - 10) / 2) >= 0 ? '+' : ''}{Math.floor((value - 10) / 2)}
            </div>
            {selectedRace && (
              <div className="text-center text-xs text-dnd-gold mt-1">
                +{selectedRace.bonuses[attr] || 0} from {selectedRace.name}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep6 = () => {
    if (!selectedClass) return null;
    
    const availableSkills = selectedClass.skills;
    const backgroundSkills = selectedBackground?.skills || [];
    const totalSkills = Math.min(2 + (selectedBackground ? 2 : 0), availableSkills.length);
    
    return (
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-dnd-gold mb-4">Choose Skill Proficiencies</h3>
        <div className="text-center mb-4">
          <span className="text-dnd-gold">Choose {totalSkills} skills to be proficient in</span>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {availableSkills.map((skill) => (
            <div
              key={skill}
              onClick={() => {
                if (selectedSkills.includes(skill)) {
                  setSelectedSkills(prev => prev.filter(s => s !== skill));
                } else if (selectedSkills.length < totalSkills) {
                  setSelectedSkills(prev => [...prev, skill]);
                }
              }}
              className={`p-3 border-2 rounded cursor-pointer transition-all ${
                selectedSkills.includes(skill)
                  ? 'border-dnd-gold bg-dnd-gold bg-opacity-20'
                  : selectedSkills.length >= totalSkills
                  ? 'border-gray-600 bg-gray-800 opacity-50 cursor-not-allowed'
                  : 'border-dnd-dark hover:border-dnd-gold hover:bg-dnd-dark'
              }`}
            >
              <div className="text-center">
                <div className="text-white font-medium">{skill}</div>
                <div className="text-xs text-gray-400">
                  {getSkillModifier(skill) >= 0 ? '+' : ''}{getSkillModifier(skill)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderStep7 = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-dnd-gold mb-4">Character Backstory</h3>
      <textarea
        value={backstory}
        onChange={(e) => setBackstory(e.target.value)}
        placeholder="Tell us about your character's background, motivations, and history..."
        className="w-full h-32 bg-dnd-darker border border-dnd-gold rounded px-4 py-3 text-white resize-none"
      />
      
      <div className="bg-dnd-dark border border-dnd-gold rounded p-4">
        <h4 className="text-dnd-gold font-bold mb-2">Character Summary</h4>
        <div className="text-sm space-y-1">
          <div><span className="text-gray-400">Name:</span> {characterName}</div>
          <div><span className="text-gray-400">Race:</span> {selectedRace?.name}</div>
          <div><span className="text-gray-400">Class:</span> {selectedClass?.name}</div>
          <div><span className="text-gray-400">Background:</span> {selectedBackground?.name}</div>
          <div><span className="text-gray-400">Level:</span> 1</div>
          <div><span className="text-gray-400">Hit Points:</span> {getHitPoints()}</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-dnd-darker border border-dnd-gold rounded-lg w-full max-w-4xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-dnd-gold">
          <h2 className="text-2xl font-bold text-dnd-gold">Character Creation</h2>
          <button
            onClick={onClose}
            className="text-dnd-gold hover:text-yellow-400 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Progress Bar */}
        <div className="p-4 border-b border-dnd-gold">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Step {step} of 7</span>
            <span>{Math.round((step / 7) * 100)}% Complete</span>
          </div>
          <div className="w-full bg-dnd-dark rounded-full h-2">
            <div 
              className="bg-dnd-gold h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 7) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
          {step === 5 && renderStep5()}
          {step === 6 && renderStep6()}
          {step === 7 && renderStep7()}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-4 border-t border-dnd-gold">
          <button
            onClick={() => setStep(step - 1)}
            disabled={step === 1}
            className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:cursor-not-allowed text-white px-4 py-2 rounded font-bold transition-colors"
          >
            Previous
          </button>
          
          <div className="text-sm text-gray-400">
            {step === 1 && "Enter your character's name"}
            {step === 2 && "Choose your race"}
            {step === 3 && "Choose your class"}
            {step === 4 && "Choose your background"}
            {step === 5 && "Assign ability scores"}
            {step === 6 && "Choose skill proficiencies"}
            {step === 7 && "Review and create character"}
          </div>
          
          {step < 7 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="bg-dnd-gold hover:bg-yellow-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-dnd-darker px-4 py-2 rounded font-bold transition-colors"
            >
              Next
            </button>
          ) : (
            <button
              onClick={createCharacter}
              disabled={!canProceed()}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded font-bold transition-colors"
            >
              Create Character
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

