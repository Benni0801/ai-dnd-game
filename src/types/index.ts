// Shared types for the AI D&D Game

export interface CharacterStats {
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

export interface GameMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface GameRoom {
  id: string;
  name: string;
  players: string[];
  gameMaster: string;
  createdAt: string;
}
