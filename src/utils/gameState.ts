// Game State Management for D&D AI Game

export interface GameState {
  // Character Information
  character: {
    name: string;
    race: string;
    class: string;
    level: number;
    experience: { current: number; needed: number };
    abilityScores: {
      strength: number;
      dexterity: number;
      constitution: number;
      intelligence: number;
      wisdom: number;
      charisma: number;
    };
    backstory: string;
    startingSpells: string[];
    startingSkills: string[];
  };

  // Party Information
  party: Array<{
    name: string;
    gender: string;
    race: string;
    class: string;
    level: number;
    experience: { current: number; needed: number };
    personalStory: string;
  }>;

  // Inventory
  inventory: {
    equipped: {
      clothes: string;
      weapons: string[];
      armor: string;
      accessories: string[];
    };
    carried: Array<{
      name: string;
      quantity: number;
      description: string;
      type: 'weapon' | 'armor' | 'consumable' | 'tool' | 'misc';
    }>;
  };

  // Spells
  spells: {
    slots: {
      level1: number;
      level2: number;
      level3: number;
      level4: number;
      level5: number;
      level6: number;
      level7: number;
      level8: number;
      level9: number;
    };
    known: Array<{
      name: string;
      level: number;
      description: string;
      type: 'spell' | 'cantrip';
    }>;
  };

  // Skills
  skills: Array<{
    name: string;
    modifier: number;
    proficient: boolean;
    description: string;
  }>;

  // Quest Information
  quests: {
    mainQuest: {
      title: string;
      description: string;
      objectives: string[];
      progress: string;
    };
    currentMission: {
      title: string;
      description: string;
      objectives: string[];
      progress: string;
    };
    sideQuests: Array<{
      title: string;
      description: string;
      objectives: string[];
      progress: string;
      completed: boolean;
    }>;
  };

  // Location
  currentLocation: {
    name: string;
    description: string;
    type: 'city' | 'dungeon' | 'wilderness' | 'building' | 'other';
    npcs: string[];
    exits: string[];
  };

  // Lore
  lore: {
    characters: Array<{
      name: string;
      race: string;
      role: string;
      description: string;
      relationship: 'friendly' | 'neutral' | 'hostile' | 'romantic' | 'unknown';
      backstory: string;
      motivations: string[];
    }>;
    world: Array<{
      name: string;
      type: 'city' | 'region' | 'landmark' | 'dungeon' | 'building';
      description: string;
      history: string;
      significance: string;
    }>;
    races: Array<{
      name: string;
      description: string;
      characteristics: string[];
      culture: string;
      abilities: string[];
    }>;
  };

  // Game Settings
  settings: {
    genre: 'fantasy' | 'sci-fi' | 'historical' | 'modern' | 'other';
    dayNightCycle: 'day' | 'night' | 'dawn' | 'dusk';
    timeOfDay: number; // 0-24 hours
    weather: 'clear' | 'rainy' | 'stormy' | 'foggy' | 'snowy';
  };

  // Combat State
  combat: {
    inCombat: boolean;
    initiative: Array<{
      name: string;
      initiative: number;
      hp: number;
      maxHp: number;
      ac: number;
    }>;
    currentTurn: number;
    round: number;
  };

  // Session Data
  session: {
    startTime: Date;
    lastSave: Date;
    totalPlayTime: number;
    decisions: Array<{
      timestamp: Date;
      choice: string;
      consequence: string;
    }>;
  };
}

export const createInitialGameState = (): GameState => ({
  character: {
    name: '',
    race: '',
    class: '',
    level: 1,
    experience: { current: 0, needed: 300 },
    abilityScores: {
      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10,
    },
    backstory: '',
    startingSpells: [],
    startingSkills: [],
  },

  party: [],

  inventory: {
    equipped: {
      clothes: 'Basic clothing',
      weapons: ['Rusty dagger'],
      armor: 'Leather armor',
      accessories: [],
    },
    carried: [
      {
        name: 'Health Potion',
        quantity: 3,
        description: 'A red potion that restores 2d4+2 hit points',
        type: 'consumable',
      },
      {
        name: 'Rope (50ft)',
        quantity: 1,
        description: 'Strong hemp rope for climbing and binding',
        type: 'tool',
      },
    ],
  },

  spells: {
    slots: {
      level1: 0,
      level2: 0,
      level3: 0,
      level4: 0,
      level5: 0,
      level6: 0,
      level7: 0,
      level8: 0,
      level9: 0,
    },
    known: [],
  },

  skills: [
    { name: 'Acrobatics', modifier: 0, proficient: false, description: 'Balance, tumbling, and acrobatic stunts' },
    { name: 'Animal Handling', modifier: 0, proficient: false, description: 'Calm, train, and communicate with animals' },
    { name: 'Arcana', modifier: 0, proficient: false, description: 'Knowledge of magical theories and practices' },
    { name: 'Athletics', modifier: 0, proficient: false, description: 'Climbing, jumping, and swimming' },
    { name: 'Deception', modifier: 0, proficient: false, description: 'Lying, misleading, and disguising' },
    { name: 'History', modifier: 0, proficient: false, description: 'Knowledge of historical events and legends' },
    { name: 'Insight', modifier: 0, proficient: false, description: 'Reading people and detecting lies' },
    { name: 'Intimidation', modifier: 0, proficient: false, description: 'Influencing others through threats' },
    { name: 'Investigation', modifier: 0, proficient: false, description: 'Finding clues and solving puzzles' },
    { name: 'Medicine', modifier: 0, proficient: false, description: 'Diagnosing and treating injuries' },
    { name: 'Nature', modifier: 0, proficient: false, description: 'Knowledge of natural world and survival' },
    { name: 'Perception', modifier: 0, proficient: false, description: 'Noticing details and detecting hidden things' },
    { name: 'Performance', modifier: 0, proficient: false, description: 'Entertaining others through art or music' },
    { name: 'Persuasion', modifier: 0, proficient: false, description: 'Influencing others through diplomacy' },
    { name: 'Religion', modifier: 0, proficient: false, description: 'Knowledge of deities and religious practices' },
    { name: 'Sleight of Hand', modifier: 0, proficient: false, description: 'Pickpocketing, lockpicking, and sleight of hand' },
    { name: 'Stealth', modifier: 0, proficient: false, description: 'Hiding and moving silently' },
    { name: 'Survival', modifier: 0, proficient: false, description: 'Tracking, foraging, and wilderness survival' },
  ],

  quests: {
    mainQuest: {
      title: 'The Awakening',
      description: 'A mysterious force awakens ancient powers across the land',
      objectives: ['Discover the source of the awakening', 'Uncover the ancient prophecy', 'Gather allies for the coming conflict'],
      progress: 'Just beginning your journey',
    },
    currentMission: {
      title: 'Character Creation',
      description: 'Complete your character creation to begin your adventure',
      objectives: ['Choose your race and class', 'Develop your backstory', 'Select starting abilities'],
      progress: 'In progress',
    },
    sideQuests: [],
  },

  currentLocation: {
    name: 'Character Creation Hall',
    description: 'A mystical chamber where new adventurers begin their journey',
    type: 'building',
    npcs: ['Character Creation Guide'],
    exits: ['To the Adventure World'],
  },

  lore: {
    characters: [
      {
        name: 'Character Creation Guide',
        race: 'Mystical Entity',
        role: 'Guide',
        description: 'A wise being who helps new adventurers begin their journey',
        relationship: 'friendly',
        backstory: 'An ancient entity tasked with guiding new heroes',
        motivations: ['Help new adventurers', 'Preserve the balance of the world'],
      },
    ],
    world: [
      {
        name: 'Character Creation Hall',
        type: 'building',
        description: 'A mystical chamber where new adventurers begin their journey',
        history: 'Created by ancient powers to guide new heroes',
        significance: 'The starting point for all new adventurers',
      },
    ],
    races: [
      {
        name: 'Human',
        description: 'Versatile and ambitious, humans are the most adaptable of all races',
        characteristics: ['+1 to all ability scores', 'Extra skill proficiency', 'Extra feat'],
        culture: 'Diverse and varied, with many different cultures and traditions',
        abilities: ['Versatile', 'Extra Language'],
      },
      {
        name: 'Elf',
        description: 'Graceful and long-lived, elves are connected to nature and magic',
        characteristics: ['+2 Dexterity', '+1 Intelligence', 'Darkvision', 'Fey Ancestry'],
        culture: 'Ancient and sophisticated, with deep connections to nature and magic',
        abilities: ['Keen Senses', 'Trance', 'Elf Weapon Training'],
      },
      {
        name: 'Dwarf',
        description: 'Hardy and traditional, dwarves are known for their craftsmanship and resilience',
        characteristics: ['+2 Constitution', '+1 Strength', 'Darkvision', 'Dwarven Resilience'],
        culture: 'Traditional and honor-bound, with strong family and clan ties',
        abilities: ['Dwarven Combat Training', 'Tool Proficiency', 'Stonecunning'],
      },
    ],
  },

  settings: {
    genre: 'fantasy',
    dayNightCycle: 'day',
    timeOfDay: 12,
    weather: 'clear',
  },

  combat: {
    inCombat: false,
    initiative: [],
    currentTurn: 0,
    round: 0,
  },

  session: {
    startTime: new Date(),
    lastSave: new Date(),
    totalPlayTime: 0,
    decisions: [],
  },
});

export const formatGameSheet = (gameState: GameState, sheetType: string): string => {
  switch (sheetType.toLowerCase()) {
    case 'character':
      return formatCharacterSheet(gameState);
    case 'party':
      return formatPartySheet(gameState);
    case 'inventory':
      return formatInventorySheet(gameState);
    case 'spells':
      return formatSpellSheet(gameState);
    case 'skills':
      return formatSkillSheet(gameState);
    case 'quests':
      return formatQuestSheet(gameState);
    case 'lore':
      return formatLoreSheet(gameState);
    case 'rules':
      return formatRuleSheet();
    default:
      return 'Unknown sheet type. Available sheets: Character, Party, Inventory, Spells, Skills, Quests, Lore, Rules';
  }
};

const formatCharacterSheet = (gameState: GameState): string => {
  const char = gameState.character;
  return `
**CHARACTER SHEET**
Name: ${char.name}
Race: ${char.race}
Class: ${char.class}
Level: ${char.level}
Experience: ${char.experience.current}/${char.experience.needed}

**ABILITY SCORES**
Strength: ${char.abilityScores.strength}
Dexterity: ${char.abilityScores.dexterity}
Constitution: ${char.abilityScores.constitution}
Intelligence: ${char.abilityScores.intelligence}
Wisdom: ${char.abilityScores.wisdom}
Charisma: ${char.abilityScores.charisma}

**BACKSTORY**
${char.backstory}

**STARTING SPELLS/SKILLS**
Spells: ${char.startingSpells.join(', ') || 'None'}
Skills: ${char.startingSkills.join(', ') || 'None'}
`;
};

const formatPartySheet = (gameState: GameState): string => {
  if (gameState.party.length === 0) {
    return '**PARTY SHEET**\nNo party members yet.';
  }
  
  return `**PARTY SHEET**
${gameState.party.map(member => `
Name: ${member.name}
Gender: ${member.gender}
Race: ${member.race}
Class: ${member.class}
Level: ${member.level}
Experience: ${member.experience.current}/${member.experience.needed}
Personal Story: ${member.personalStory}
`).join('\n')}`;
};

const formatInventorySheet = (gameState: GameState): string => {
  const inv = gameState.inventory;
  return `
**INVENTORY SHEET**

**EQUIPPED ITEMS**
Clothes: ${inv.equipped.clothes}
Weapons: ${inv.equipped.weapons.join(', ')}
Armor: ${inv.equipped.armor}
Accessories: ${inv.equipped.accessories.join(', ') || 'None'}

**CARRIED ITEMS**
${inv.carried.map(item => `${item.name} (x${item.quantity}) - ${item.description}`).join('\n')}
`;
};

const formatSpellSheet = (gameState: GameState): string => {
  const spells = gameState.spells;
  return `
**SPELL SHEET**

**SPELL SLOTS**
Level 1: ${spells.slots.level1}
Level 2: ${spells.slots.level2}
Level 3: ${spells.slots.level3}
Level 4: ${spells.slots.level4}
Level 5: ${spells.slots.level5}
Level 6: ${spells.slots.level6}
Level 7: ${spells.slots.level7}
Level 8: ${spells.slots.level8}
Level 9: ${spells.slots.level9}

**KNOWN SPELLS**
${spells.known.map(spell => `${spell.name} (Level ${spell.level}, ${spell.type}) - ${spell.description}`).join('\n') || 'None'}
`;
};

const formatSkillSheet = (gameState: GameState): string => {
  return `
**SKILL SHEET**
${gameState.skills.map(skill => 
  `${skill.name}: ${skill.modifier >= 0 ? '+' : ''}${skill.modifier} ${skill.proficient ? '(Proficient)' : ''} - ${skill.description}`
).join('\n')}
`;
};

const formatQuestSheet = (gameState: GameState): string => {
  const quests = gameState.quests;
  return `
**QUEST SHEETS**

**MAIN QUEST**
Title: ${quests.mainQuest.title}
Description: ${quests.mainQuest.description}
Objectives:
${quests.mainQuest.objectives.map(obj => `- ${obj}`).join('\n')}
Progress: ${quests.mainQuest.progress}

**CURRENT MISSION**
Title: ${quests.currentMission.title}
Description: ${quests.currentMission.description}
Objectives:
${quests.currentMission.objectives.map(obj => `- ${obj}`).join('\n')}
Progress: ${quests.currentMission.progress}

**CURRENT LOCATION**
${gameState.currentLocation.name}: ${gameState.currentLocation.description}
Type: ${gameState.currentLocation.type}
NPCs: ${gameState.currentLocation.npcs.join(', ')}
Exits: ${gameState.currentLocation.exits.join(', ')}

**SIDE QUESTS**
${quests.sideQuests.length === 0 ? 'None' : quests.sideQuests.map(quest => 
  `${quest.title} - ${quest.completed ? 'COMPLETED' : 'IN PROGRESS'}\n${quest.description}`
).join('\n\n')}
`;
};

const formatLoreSheet = (gameState: GameState): string => {
  const lore = gameState.lore;
  return `
**LORE SHEETS**

**CHARACTERS**
${lore.characters.map(char => `
Name: ${char.name}
Race: ${char.race}
Role: ${char.role}
Relationship: ${char.relationship}
Description: ${char.description}
Backstory: ${char.backstory}
Motivations: ${char.motivations.join(', ')}
`).join('\n')}

**WORLD**
${lore.world.map(location => `
Name: ${location.name}
Type: ${location.type}
Description: ${location.description}
History: ${location.history}
Significance: ${location.significance}
`).join('\n')}

**RACES**
${lore.races.map(race => `
Name: ${race.name}
Description: ${race.description}
Characteristics: ${race.characteristics.join(', ')}
Culture: ${race.culture}
Abilities: ${race.abilities.join(', ')}
`).join('\n')}
`;
};

const formatRuleSheet = (): string => {
  return `
**RULE SHEET**

**CORE MECHANICS**
- All checks use d20 + relevant modifier
- GM rolls all dice internally
- DCs set by GM based on difficulty
- Turn-based combat with initiative
- Limited resources (HP, spell slots, inventory)

**CHARACTER PROGRESSION**
- Start at Level 1
- Gain XP through quests, combat, and challenges
- Level up to gain new abilities and features
- Skills improve with practice and training

**COMBAT SYSTEM**
- Initiative determines turn order
- Attack rolls: d20 + attack modifier vs AC
- Damage calculated by weapon + modifiers
- Different damage types have different effects

**MAGIC SYSTEM**
- Spellcasters have limited spell slots
- Spells have various effects and requirements
- Cantrips can be cast at will
- Higher level spells require higher level slots

**SKILL CHALLENGES**
- Non-combat situations resolved with skill checks
- DC set by GM based on difficulty
- Success/failure affects narrative progression
- Creative solutions may provide advantage

**WORLD INTERACTION**
- NPCs have consistent personalities and motivations
- Player choices have real consequences
- Day/night cycle affects gameplay
- Weather and environment impact actions

**QUEST SYSTEM**
- Main story provides overarching narrative
- Side quests offer additional content
- Current mission tracks immediate objectives
- Progress affects world state and relationships
`;
};
