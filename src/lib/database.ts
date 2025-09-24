// Simple JSON-based database for character storage
import fs from 'fs';
import path from 'path';

interface User {
  id: string;
  username: string;
  characters: Character[];
  createdAt: Date;
}

interface Character {
  id: string;
  userId: string;
  name: string;
  race: string;
  class: string;
  background: string;
  str: number;
  dex: number;
  int: number;
  con: number;
  wis: number;
  cha: number;
  hp: number;
  inventory: string;
  level: number;
  specialAbilities: string[];
  createdAt: Date;
}

interface GameRoom {
  id: string;
  name: string;
  players: string[]; // User IDs
  dmId: string;
  isActive: boolean;
  createdAt: Date;
}

interface GameSession {
  id: string;
  characterId: string;
  userId: string;
  currentLocation: string;
  questProgress: string;
  npcRelations: Record<string, number>; // NPC name -> relationship score
  gameState: string; // JSON string of current game state
  lastPlayed: Date;
  createdAt: Date;
}

interface GameNote {
  id: string;
  sessionId: string;
  content: string;
  category: 'general' | 'quest' | 'npc' | 'location' | 'loot';
  createdAt: Date;
}

interface GameTurn {
  id: string;
  sessionId: string;
  turnNumber: number;
  playerInput: string;
  aiResponse: string;
  diceRolls: Array<{type: string, result: number, modifier?: number}>;
  timestamp: Date;
}

class Database {
  private dataPath: string;
  private users: User[] = [];
  private characters: Character[] = [];
  private gameRooms: GameRoom[] = [];
  private gameSessions: GameSession[] = [];
  private gameNotes: GameNote[] = [];
  private gameTurns: GameTurn[] = [];

  constructor() {
    this.dataPath = path.join(process.cwd(), 'data');
    this.ensureDataDirectory();
    this.loadData();
  }

  private ensureDataDirectory() {
    if (!fs.existsSync(this.dataPath)) {
      fs.mkdirSync(this.dataPath, { recursive: true });
    }
  }

  private loadData() {
    try {
      // Load users
      const usersPath = path.join(this.dataPath, 'users.json');
      if (fs.existsSync(usersPath)) {
        const usersData = fs.readFileSync(usersPath, 'utf8');
        this.users = JSON.parse(usersData).map((user: any) => ({
          ...user,
          createdAt: new Date(user.createdAt)
        }));
      }

      // Load characters
      const charactersPath = path.join(this.dataPath, 'characters.json');
      if (fs.existsSync(charactersPath)) {
        const charactersData = fs.readFileSync(charactersPath, 'utf8');
        this.characters = JSON.parse(charactersData).map((char: any) => ({
          ...char,
          createdAt: new Date(char.createdAt)
        }));
      }

      // Load game rooms
      const roomsPath = path.join(this.dataPath, 'gameRooms.json');
      if (fs.existsSync(roomsPath)) {
        const roomsData = fs.readFileSync(roomsPath, 'utf8');
        this.gameRooms = JSON.parse(roomsData).map((room: any) => ({
          ...room,
          createdAt: new Date(room.createdAt)
        }));
      }

      // Load game sessions
      const sessionsPath = path.join(this.dataPath, 'gameSessions.json');
      if (fs.existsSync(sessionsPath)) {
        const sessionsData = fs.readFileSync(sessionsPath, 'utf8');
        this.gameSessions = JSON.parse(sessionsData).map((session: any) => ({
          ...session,
          lastPlayed: new Date(session.lastPlayed),
          createdAt: new Date(session.createdAt)
        }));
      }

      // Load game notes
      const notesPath = path.join(this.dataPath, 'gameNotes.json');
      if (fs.existsSync(notesPath)) {
        const notesData = fs.readFileSync(notesPath, 'utf8');
        this.gameNotes = JSON.parse(notesData).map((note: any) => ({
          ...note,
          createdAt: new Date(note.createdAt)
        }));
      }

      // Load game turns
      const turnsPath = path.join(this.dataPath, 'gameTurns.json');
      if (fs.existsSync(turnsPath)) {
        const turnsData = fs.readFileSync(turnsPath, 'utf8');
        this.gameTurns = JSON.parse(turnsData).map((turn: any) => ({
          ...turn,
          timestamp: new Date(turn.timestamp)
        }));
      }
    } catch (error) {
      console.error('Error loading database:', error);
    }
  }

  private saveData() {
    try {
      // Save users
      fs.writeFileSync(
        path.join(this.dataPath, 'users.json'),
        JSON.stringify(this.users, null, 2)
      );

      // Save characters
      fs.writeFileSync(
        path.join(this.dataPath, 'characters.json'),
        JSON.stringify(this.characters, null, 2)
      );

      // Save game rooms
      fs.writeFileSync(
        path.join(this.dataPath, 'gameRooms.json'),
        JSON.stringify(this.gameRooms, null, 2)
      );

      // Save game sessions
      fs.writeFileSync(
        path.join(this.dataPath, 'gameSessions.json'),
        JSON.stringify(this.gameSessions, null, 2)
      );

      // Save game notes
      fs.writeFileSync(
        path.join(this.dataPath, 'gameNotes.json'),
        JSON.stringify(this.gameNotes, null, 2)
      );

      // Save game turns
      fs.writeFileSync(
        path.join(this.dataPath, 'gameTurns.json'),
        JSON.stringify(this.gameTurns, null, 2)
      );
    } catch (error) {
      console.error('Error saving database:', error);
    }
  }

  // User management
  createUser(username: string): User {
    const user: User = {
      id: this.generateId(),
      username,
      characters: [],
      createdAt: new Date()
    };
    this.users.push(user);
    this.saveData();
    return user;
  }

  getUserById(id: string): User | undefined {
    return this.users.find(user => user.id === id);
  }

  getUserByUsername(username: string): User | undefined {
    return this.users.find(user => user.username === username);
  }

  // Character management
  createCharacter(userId: string, characterData: Omit<Character, 'id' | 'userId' | 'createdAt'>): Character {
    // Check character limit (3 per user)
    const userCharacters = this.characters.filter(char => char.userId === userId);
    if (userCharacters.length >= 3) {
      throw new Error('Character limit reached. You can only have 3 characters.');
    }

    const character: Character = {
      id: this.generateId(),
      userId,
      createdAt: new Date(),
      ...characterData
    };
    
    this.characters.push(character);
    this.saveData();
    return character;
  }

  getCharactersByUserId(userId: string): Character[] {
    return this.characters.filter(char => char.userId === userId);
  }

  getCharacterById(id: string): Character | undefined {
    return this.characters.find(char => char.id === id);
  }

  updateCharacter(id: string, updates: Partial<Character>): Character | undefined {
    const index = this.characters.findIndex(char => char.id === id);
    if (index !== -1) {
      this.characters[index] = { ...this.characters[index], ...updates };
      this.saveData();
      return this.characters[index];
    }
    return undefined;
  }

  deleteCharacter(id: string): boolean {
    const index = this.characters.findIndex(char => char.id === id);
    if (index !== -1) {
      this.characters.splice(index, 1);
      this.saveData();
      return true;
    }
    return false;
  }

  // Game room management
  createGameRoom(name: string, dmId: string): GameRoom {
    const room: GameRoom = {
      id: this.generateId(),
      name,
      players: [],
      dmId,
      isActive: true,
      createdAt: new Date()
    };
    this.gameRooms.push(room);
    this.saveData();
    return room;
  }

  getGameRoomById(id: string): GameRoom | undefined {
    return this.gameRooms.find(room => room.id === id);
  }

  getActiveGameRooms(): GameRoom[] {
    return this.gameRooms.filter(room => room.isActive);
  }

  joinGameRoom(roomId: string, userId: string): boolean {
    const room = this.getGameRoomById(roomId);
    if (room && !room.players.includes(userId)) {
      room.players.push(userId);
      this.saveData();
      return true;
    }
    return false;
  }

  leaveGameRoom(roomId: string, userId: string): boolean {
    const room = this.getGameRoomById(roomId);
    if (room) {
      const index = room.players.indexOf(userId);
      if (index !== -1) {
        room.players.splice(index, 1);
        this.saveData();
        return true;
      }
    }
    return false;
  }

  // Game session management
  createGameSession(characterId: string, userId: string, initialLocation: string = 'Starting Village'): GameSession {
    const session: GameSession = {
      id: this.generateId(),
      characterId,
      userId,
      currentLocation: initialLocation,
      questProgress: 'Beginning your adventure',
      npcRelations: {},
      gameState: JSON.stringify({ turn: 0, events: [] }),
      lastPlayed: new Date(),
      createdAt: new Date()
    };
    this.gameSessions.push(session);
    this.saveData();
    return session;
  }

  getGameSessionById(id: string): GameSession | undefined {
    return this.gameSessions.find(session => session.id === id);
  }

  getGameSessionsByUserId(userId: string): GameSession[] {
    return this.gameSessions.filter(session => session.userId === userId);
  }

  getGameSessionsByCharacterId(characterId: string): GameSession[] {
    return this.gameSessions.filter(session => session.characterId === characterId);
  }

  updateGameSession(id: string, updates: Partial<GameSession>): GameSession | undefined {
    const index = this.gameSessions.findIndex(session => session.id === id);
    if (index !== -1) {
      this.gameSessions[index] = { 
        ...this.gameSessions[index], 
        ...updates, 
        lastPlayed: new Date() 
      };
      this.saveData();
      return this.gameSessions[index];
    }
    return undefined;
  }

  // Game notes management
  createGameNote(sessionId: string, content: string, category: GameNote['category'] = 'general'): GameNote {
    const note: GameNote = {
      id: this.generateId(),
      sessionId,
      content,
      category,
      createdAt: new Date()
    };
    this.gameNotes.push(note);
    this.saveData();
    return note;
  }

  getGameNotesBySessionId(sessionId: string): GameNote[] {
    return this.gameNotes.filter(note => note.sessionId === sessionId);
  }

  updateGameNote(id: string, updates: Partial<GameNote>): GameNote | undefined {
    const index = this.gameNotes.findIndex(note => note.id === id);
    if (index !== -1) {
      this.gameNotes[index] = { ...this.gameNotes[index], ...updates };
      this.saveData();
      return this.gameNotes[index];
    }
    return undefined;
  }

  deleteGameNote(id: string): boolean {
    const index = this.gameNotes.findIndex(note => note.id === id);
    if (index !== -1) {
      this.gameNotes.splice(index, 1);
      this.saveData();
      return true;
    }
    return false;
  }

  // Game turns management
  createGameTurn(sessionId: string, turnNumber: number, playerInput: string, aiResponse: string, diceRolls: Array<{type: string, result: number, modifier?: number}> = []): GameTurn {
    const turn: GameTurn = {
      id: this.generateId(),
      sessionId,
      turnNumber,
      playerInput,
      aiResponse,
      diceRolls,
      timestamp: new Date()
    };
    this.gameTurns.push(turn);
    this.saveData();
    return turn;
  }

  getGameTurnsBySessionId(sessionId: string): GameTurn[] {
    return this.gameTurns.filter(turn => turn.sessionId === sessionId).sort((a, b) => a.turnNumber - b.turnNumber);
  }

  getLastTurnNumber(sessionId: string): number {
    const turns = this.getGameTurnsBySessionId(sessionId);
    return turns.length > 0 ? Math.max(...turns.map(t => t.turnNumber)) : 0;
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }
}

// Export singleton instance
export const database = new Database();
export type { User, Character, GameRoom, GameSession, GameNote, GameTurn };


