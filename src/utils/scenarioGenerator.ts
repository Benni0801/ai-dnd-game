/**
 * Utility functions for generating random D&D scenarios based on character
 */

interface Character {
  name: string;
  race: string;
  class: string;
  background: string;
  level: number;
  str: number;
  dex: number;
  int: number;
  con: number;
  wis: number;
  cha: number;
}

interface Scenario {
  title: string;
  description: string;
  setting: string;
  initialChallenge: string;
  npcs: string[];
  locations: string[];
  hooks: string[];
}

// Scenario templates based on character class
const CLASS_SCENARIOS = {
  'Fighter': {
    titles: [
      'The Mercenary\'s Contract',
      'Guardian of the Realm',
      'The Arena Champion',
      'Warrior\'s Honor',
      'The Last Stand'
    ],
    settings: [
      'a war-torn battlefield',
      'a gladiator arena',
      'a military outpost',
      'a besieged castle',
      'a training grounds'
    ],
    challenges: [
      'defend against an enemy assault',
      'prove your worth in single combat',
      'escort a valuable caravan',
      'investigate reports of bandits',
      'train new recruits for battle'
    ]
  },
  'Wizard': {
    titles: [
      'The Arcane Mystery',
      'Tower of Lost Knowledge',
      'The Spellbook Thief',
      'Mystical Convergence',
      'The Forbidden Library'
    ],
    settings: [
      'an ancient wizard\'s tower',
      'a magical academy',
      'a mysterious library',
      'a planar rift',
      'a magical laboratory'
    ],
    challenges: [
      'uncover the secrets of a lost spell',
      'investigate magical disturbances',
      'protect the realm from arcane threats',
      'study under a master wizard',
      'recover stolen magical artifacts'
    ]
  },
  'Rogue': {
    titles: [
      'The Shadow Heist',
      'Thieves\' Guild Politics',
      'The Stolen Crown',
      'Underground Network',
      'The Perfect Crime'
    ],
    settings: [
      'a bustling city at night',
      'a noble\'s mansion',
      'the underground sewers',
      'a thieves\' guild hideout',
      'a merchant\'s warehouse'
    ],
    challenges: [
      'infiltrate a heavily guarded building',
      'steal a valuable artifact',
      'gather information from dangerous sources',
      'escape from a tight spot',
      'negotiate with criminal contacts'
    ]
  },
  'Cleric': {
    titles: [
      'Divine Intervention',
      'Temple of the Fallen',
      'The Sacred Quest',
      'Healing the Land',
      'Crusade Against Evil'
    ],
    settings: [
      'a sacred temple',
      'a plague-stricken village',
      'a holy pilgrimage site',
      'a cursed graveyard',
      'a divine sanctuary'
    ],
    challenges: [
      'heal the sick and wounded',
      'purify a cursed location',
      'spread the word of your deity',
      'combat undead creatures',
      'restore faith to the people'
    ]
  },
  'Ranger': {
    titles: [
      'Wilderness Guardian',
      'The Beast\'s Lair',
      'Nature\'s Wrath',
      'The Lost Expedition',
      'Forest of Shadows'
    ],
    settings: [
      'a deep, dark forest',
      'a mountain wilderness',
      'a dangerous swamp',
      'an ancient grove',
      'a wild frontier'
    ],
    challenges: [
      'track down a dangerous beast',
      'protect travelers from wilderness dangers',
      'investigate strange animal behavior',
      'guide lost explorers to safety',
      'defend nature from destruction'
    ]
  },
  'Barbarian': {
    titles: [
      'Rage of the Ancestors',
      'Tribal Honor',
      'The Wild Hunt',
      'Spirit of the Warrior',
      'Savage Lands'
    ],
    settings: [
      'a harsh wilderness',
      'a tribal village',
      'an ancient battlefield',
      'a sacred hunting ground',
      'a remote mountain pass'
    ],
    challenges: [
      'prove your worth to the tribe',
      'hunt a legendary beast',
      'defend your homeland from invaders',
      'seek guidance from ancestral spirits',
      'master your primal rage'
    ]
  }
};

// Background-based scenario elements
const BACKGROUND_ELEMENTS = {
  'Acolyte': {
    npcs: ['High Priest', 'Fellow Cleric', 'Temple Guard', 'Worshipper in Need'],
    locations: ['Sacred Shrine', 'Temple Library', 'Holy Grounds', 'Prayer Chamber'],
    hooks: ['A divine vision calls you', 'The temple needs your help', 'A sacred relic has been stolen']
  },
  'Criminal': {
    npcs: ['Old Crime Partner', 'Fence', 'Guild Contact', 'Former Target'],
    locations: ['Tavern', 'Underground Hideout', 'Market Square', 'Back Alley'],
    hooks: ['Your past catches up with you', 'A job opportunity arises', 'Someone needs your skills']
  },
  'Folk Hero': {
    npcs: ['Grateful Villager', 'Local Leader', 'Innocent in Danger', 'Community Elder'],
    locations: ['Village Square', 'Local Tavern', 'Community Hall', 'Rural Road'],
    hooks: ['The people need a hero', 'A local problem requires solving', 'Your reputation precedes you']
  },
  'Noble': {
    npcs: ['Royal Courtier', 'Fellow Noble', 'Servant', 'Political Rival'],
    locations: ['Royal Court', 'Noble Estate', 'Grand Ballroom', 'Private Study'],
    hooks: ['A political matter requires attention', 'Your family needs you', 'Court intrigue unfolds']
  },
  'Sage': {
    npcs: ['Fellow Scholar', 'Library Keeper', 'Ancient Sage', 'Student'],
    locations: ['Great Library', 'Scholar\'s Study', 'Ancient Ruins', 'Knowledge Repository'],
    hooks: ['A mystery needs solving', 'Ancient knowledge is discovered', 'A scholar seeks your expertise']
  },
  'Soldier': {
    npcs: ['Former Comrade', 'Military Commander', 'War Veteran', 'Recruit'],
    locations: ['Military Barracks', 'Battlefield', 'Command Post', 'Training Ground'],
    hooks: ['Your unit needs you', 'A military matter arises', 'Old enemies resurface']
  }
};

// Race-based scenario elements
const RACE_ELEMENTS = {
  'Human': {
    traits: ['adaptable', 'ambitious', 'versatile'],
    connections: ['merchants', 'politicians', 'common folk']
  },
  'Elf': {
    traits: ['graceful', 'long-lived', 'magical'],
    connections: ['other elves', 'nature spirits', 'ancient beings']
  },
  'Dwarf': {
    traits: ['hardy', 'traditional', 'craftsman'],
    connections: ['dwarf clans', 'miners', 'craftsmen']
  },
  'Halfling': {
    traits: ['lucky', 'brave', 'nimble'],
    connections: ['halfling communities', 'travelers', 'merchants']
  },
  'Dragonborn': {
    traits: ['strong', 'charismatic', 'draconic'],
    connections: ['dragon cults', 'ancient dragons', 'mystical orders']
  },
  'Tiefling': {
    traits: ['charismatic', 'magical', 'infernal'],
    connections: ['other tieflings', 'warlocks', 'infernal beings']
  }
};

/**
 * Generates a random scenario based on character details
 */
export function generateScenario(character: Character): Scenario {
  const classData = CLASS_SCENARIOS[character.class as keyof typeof CLASS_SCENARIOS] || CLASS_SCENARIOS['Fighter'];
  const backgroundData = BACKGROUND_ELEMENTS[character.background as keyof typeof BACKGROUND_ELEMENTS] || BACKGROUND_ELEMENTS['Folk Hero'];
  const raceData = RACE_ELEMENTS[character.race as keyof typeof RACE_ELEMENTS] || RACE_ELEMENTS['Human'];

  // Randomly select elements
  const title = classData.titles[Math.floor(Math.random() * classData.titles.length)];
  const setting = classData.settings[Math.floor(Math.random() * classData.settings.length)];
  const challenge = classData.challenges[Math.floor(Math.random() * classData.challenges.length)];
  const npc = backgroundData.npcs[Math.floor(Math.random() * backgroundData.npcs.length)];
  const location = backgroundData.locations[Math.floor(Math.random() * backgroundData.locations.length)];
  const hook = backgroundData.hooks[Math.floor(Math.random() * backgroundData.hooks.length)];

  // Create the scenario description
  const description = `${hook} You find yourself in ${setting}, where you must ${challenge}. As a ${character.race.toLowerCase()} ${character.class.toLowerCase()}, your unique abilities and background as a ${character.background.toLowerCase()} will be crucial to your success.`;

  return {
    title,
    description,
    setting,
    initialChallenge: challenge,
    npcs: [npc],
    locations: [location],
    hooks: [hook]
  };
}

/**
 * Generates an opening message for the Dungeon Master
 */
export function generateOpeningMessage(character: Character, scenario: Scenario): string {
  const raceTraits = RACE_ELEMENTS[character.race as keyof typeof RACE_ELEMENTS] || RACE_ELEMENTS['Human'];
  
  return `Welcome, ${character.name}! 

${scenario.description}

The ${scenario.setting} stretches before you, filled with possibilities and dangers. Your ${raceTraits.traits.join(', ')} nature as a ${character.race.toLowerCase()} and your training as a ${character.class.toLowerCase()} have prepared you for this moment.

As you take in your surroundings, you notice ${scenario.locations[0]} nearby, and you sense that ${scenario.npcs[0]} might have information that could help you in your quest.

What do you do first? Do you investigate the area, seek out the ${scenario.npcs[0].toLowerCase()}, or take a different approach entirely?`;
}

/**
 * Generates random encounters based on character level and class
 */
export function generateRandomEncounter(character: Character): string {
  const encounters = [
    'A group of bandits blocks your path, demanding payment for safe passage.',
    'You discover the remains of a previous adventurer, along with some useful equipment.',
    'A mysterious figure approaches you with a proposition.',
    'You hear the sound of battle in the distance - someone is in trouble.',
    'A magical portal appears before you, pulsing with unknown energy.',
    'You find a hidden cache of supplies, but it might be trapped.',
    'A local merchant offers to trade information for a small favor.',
    'You encounter a wounded animal that seems to be asking for help.',
    'A traveling bard offers to share news from distant lands.',
    'You discover an ancient inscription that might hold important clues.'
  ];

  return encounters[Math.floor(Math.random() * encounters.length)];
}





