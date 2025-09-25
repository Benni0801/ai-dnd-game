// Shared types for the AI D&D Game

export interface CharacterStats {
  id?: string;
  name: string;
  race?: string;
  class?: string;
  background?: string;
  level?: number;
  experience?: { current: number; needed: number };
  hp: number;
  maxHp?: number;
  str: number;
  dex: number;
  int: number;
  con: number;
  wis: number;
  cha: number;
  inventory: string;
  equippedItems?: string;
  spells?: Array<{ name: string; level: number; slots: number }> | string[];
  skills?: string[];
  backstory?: string;
  specialAbilities?: string[];
  attributes?: {
    str: number;
    dex: number;
    int: number;
    con: number;
    wis: number;
    cha: number;
  };
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  diceRoll?: number;
  isError?: boolean;
}

export interface GameMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface GameRoom {
  id: string;
  name: string;
  players: string[];
  dmId: string;
  isActive: boolean;
  createdAt: string;
}

export interface GameSession {
  id: string;
  characterId: string;
  userId: string;
  currentLocation: string;
  questProgress: string;
  npcRelations: Record<string, number>;
  gameState: string;
  lastPlayed: Date;
  createdAt: Date;
}

export interface GameNote {
  id: string;
  sessionId: string;
  content: string;
  category: 'general' | 'quest' | 'npc' | 'location' | 'loot';
  createdAt: Date;
}

export interface GameTurn {
  id: string;
  sessionId: string;
  turnNumber: number;
  playerInput: string;
  aiResponse: string;
  diceRolls: Array<{type: string, result: number, modifier?: number}>;
  timestamp: Date;
}

export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: Date;
}

export interface Character {
  id: string;
  userId: string;
  name: string;
  race: string;
  class: string;
  background: string;
  level: number;
  hp: number;
  maxHp: number;
  str: number;
  dex: number;
  int: number;
  con: number;
  wis: number;
  cha: number;
  inventory: string;
  createdAt: Date;
}
