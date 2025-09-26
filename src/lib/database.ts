import Database from 'better-sqlite3';
import path from 'path';
import bcrypt from 'bcryptjs';

// Database file path
const dbPath = path.join(process.cwd(), 'data', 'game.db');

// Create database connection
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database tables
export function initializeDatabase() {
  try {
    // Users table
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME,
        is_active BOOLEAN DEFAULT 1
      )
    `);

    // Characters table
    db.exec(`
      CREATE TABLE IF NOT EXISTS characters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        race TEXT,
        class TEXT,
        level INTEGER DEFAULT 1,
        xp INTEGER DEFAULT 0,
        max_xp INTEGER DEFAULT 300,
        hp INTEGER DEFAULT 20,
        max_hp INTEGER DEFAULT 20,
        str INTEGER DEFAULT 10,
        dex INTEGER DEFAULT 10,
        con INTEGER DEFAULT 10,
        int INTEGER DEFAULT 10,
        wis INTEGER DEFAULT 10,
        cha INTEGER DEFAULT 10,
        proficiency_bonus INTEGER DEFAULT 2,
        background TEXT,
        backstory TEXT,
        skills TEXT, -- JSON array
        abilities TEXT, -- JSON array
        spells TEXT, -- JSON array
        inventory TEXT, -- JSON object
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `);

    // Stories table
    db.exec(`
      CREATE TABLE IF NOT EXISTS stories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        genre TEXT DEFAULT 'fantasy',
        current_location TEXT,
        current_mission TEXT,
        main_quest TEXT,
        game_state TEXT, -- JSON object
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `);

    // Story sessions table (for tracking individual play sessions)
    db.exec(`
      CREATE TABLE IF NOT EXISTS story_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        story_id INTEGER NOT NULL,
        character_id INTEGER NOT NULL,
        session_data TEXT, -- JSON object with messages, state, etc.
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (story_id) REFERENCES stories (id) ON DELETE CASCADE,
        FOREIGN KEY (character_id) REFERENCES characters (id) ON DELETE CASCADE
      )
    `);

    // Create indexes for better performance
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_characters_user_id ON characters (user_id);
      CREATE INDEX IF NOT EXISTS idx_stories_user_id ON stories (user_id);
      CREATE INDEX IF NOT EXISTS idx_story_sessions_story_id ON story_sessions (story_id);
      CREATE INDEX IF NOT EXISTS idx_story_sessions_character_id ON story_sessions (character_id);
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// User management functions
export const userDb = {
  // Create a new user
  create: (username: string, email: string, password: string) => {
    const passwordHash = bcrypt.hashSync(password, 10);
    const stmt = db.prepare(`
      INSERT INTO users (username, email, password_hash)
      VALUES (?, ?, ?)
    `);
    return stmt.run(username, email, passwordHash);
  },

  // Find user by username
  findByUsername: (username: string) => {
    const stmt = db.prepare('SELECT * FROM users WHERE username = ? AND is_active = 1');
    return stmt.get(username);
  },

  // Find user by email
  findByEmail: (email: string) => {
    const stmt = db.prepare('SELECT * FROM users WHERE email = ? AND is_active = 1');
    return stmt.get(email);
  },

  // Find user by ID
  findById: (id: number) => {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ? AND is_active = 1');
    return stmt.get(id);
  },

  // Update last login
  updateLastLogin: (id: number) => {
    const stmt = db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?');
    return stmt.run(id);
  },

  // Verify password
  verifyPassword: (password: string, hash: string) => {
    return bcrypt.compareSync(password, hash);
  }
};

// Character management functions
export const characterDb = {
  // Create a new character
  create: (userId: number, characterData: any) => {
    const stmt = db.prepare(`
      INSERT INTO characters (
        user_id, name, race, class, level, xp, max_xp, hp, max_hp,
        str, dex, con, int, wis, cha, proficiency_bonus, background,
        backstory, skills, abilities, spells, inventory
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    return stmt.run(
      userId,
      characterData.name,
      characterData.race,
      characterData.class,
      characterData.level || 1,
      characterData.xp || 0,
      characterData.maxXp || 300,
      characterData.hp || 20,
      characterData.maxHp || 20,
      characterData.str || 10,
      characterData.dex || 10,
      characterData.con || 10,
      characterData.int || 10,
      characterData.wis || 10,
      characterData.cha || 10,
      characterData.proficiencyBonus || 2,
      characterData.background,
      characterData.backstory,
      JSON.stringify(characterData.skills || []),
      JSON.stringify(characterData.abilities || []),
      JSON.stringify(characterData.spells || []),
      JSON.stringify(characterData.inventory || {})
    );
  },

  // Get all characters for a user
  findByUserId: (userId: number) => {
    const stmt = db.prepare('SELECT * FROM characters WHERE user_id = ? ORDER BY created_at DESC');
    const characters = stmt.all(userId);
    
    // Parse JSON fields
    return characters.map((char: any) => ({
      ...char,
      skills: JSON.parse(char.skills || '[]'),
      abilities: JSON.parse(char.abilities || '[]'),
      spells: JSON.parse(char.spells || '[]'),
      inventory: JSON.parse(char.inventory || '{}')
    }));
  },

  // Get character by ID
  findById: (id: number) => {
    const stmt = db.prepare('SELECT * FROM characters WHERE id = ?');
    const character = stmt.get(id);
    
    if (character) {
      return {
        ...character,
        skills: JSON.parse((character as any).skills || '[]'),
        abilities: JSON.parse((character as any).abilities || '[]'),
        spells: JSON.parse((character as any).spells || '[]'),
        inventory: JSON.parse((character as any).inventory || '{}')
      };
    }
    return null;
  },

  // Update character
  update: (id: number, characterData: any) => {
    const stmt = db.prepare(`
      UPDATE characters SET
        name = ?, race = ?, class = ?, level = ?, xp = ?, max_xp = ?,
        hp = ?, max_hp = ?, str = ?, dex = ?, con = ?, int = ?, wis = ?, cha = ?,
        proficiency_bonus = ?, background = ?, backstory = ?, skills = ?,
        abilities = ?, spells = ?, inventory = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    return stmt.run(
      characterData.name,
      characterData.race,
      characterData.class,
      characterData.level,
      characterData.xp,
      characterData.maxXp,
      characterData.hp,
      characterData.maxHp,
      characterData.str,
      characterData.dex,
      characterData.con,
      characterData.int,
      characterData.wis,
      characterData.cha,
      characterData.proficiencyBonus,
      characterData.background,
      characterData.backstory,
      JSON.stringify(characterData.skills || []),
      JSON.stringify(characterData.abilities || []),
      JSON.stringify(characterData.spells || []),
      JSON.stringify(characterData.inventory || {}),
      id
    );
  },

  // Delete character
  delete: (id: number) => {
    const stmt = db.prepare('DELETE FROM characters WHERE id = ?');
    return stmt.run(id);
  },

  // Count characters for a user
  countByUserId: (userId: number) => {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM characters WHERE user_id = ?');
    return (stmt.get(userId) as any).count;
  }
};

// Story management functions
export const storyDb = {
  // Create a new story
  create: (userId: number, storyData: any) => {
    const stmt = db.prepare(`
      INSERT INTO stories (
        user_id, title, description, genre, current_location,
        current_mission, main_quest, game_state
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    return stmt.run(
      userId,
      storyData.title,
      storyData.description,
      storyData.genre || 'fantasy',
      storyData.currentLocation,
      storyData.currentMission,
      storyData.mainQuest,
      JSON.stringify(storyData.gameState || {})
    );
  },

  // Get all stories for a user
  findByUserId: (userId: number) => {
    const stmt = db.prepare('SELECT * FROM stories WHERE user_id = ? ORDER BY created_at DESC');
    const stories = stmt.all(userId);
    
    // Parse JSON fields
    return stories.map((story: any) => ({
      ...story,
      gameState: JSON.parse(story.game_state || '{}')
    }));
  },

  // Get story by ID
  findById: (id: number) => {
    const stmt = db.prepare('SELECT * FROM stories WHERE id = ?');
    const story = stmt.get(id);
    
    if (story) {
      return {
        ...story,
        gameState: JSON.parse((story as any).game_state || '{}')
      };
    }
    return null;
  },

  // Update story
  update: (id: number, storyData: any) => {
    const stmt = db.prepare(`
      UPDATE stories SET
        title = ?, description = ?, genre = ?, current_location = ?,
        current_mission = ?, main_quest = ?, game_state = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    return stmt.run(
      storyData.title,
      storyData.description,
      storyData.genre,
      storyData.currentLocation,
      storyData.currentMission,
      storyData.mainQuest,
      JSON.stringify(storyData.gameState || {}),
      id
    );
  },

  // Delete story
  delete: (id: number) => {
    const stmt = db.prepare('DELETE FROM stories WHERE id = ?');
    return stmt.run(id);
  },

  // Count stories for a user
  countByUserId: (userId: number) => {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM stories WHERE user_id = ?');
    return (stmt.get(userId) as any).count;
  }
};

// Session management functions
export const sessionDb = {
  // Create a new session
  create: (storyId: number, characterId: number, sessionData: any) => {
    const stmt = db.prepare(`
      INSERT INTO story_sessions (story_id, character_id, session_data)
      VALUES (?, ?, ?)
    `);
    
    return stmt.run(storyId, characterId, JSON.stringify(sessionData));
  },

  // Get latest session for a story and character
  getLatest: (storyId: number, characterId: number) => {
    const stmt = db.prepare(`
      SELECT * FROM story_sessions 
      WHERE story_id = ? AND character_id = ?
      ORDER BY updated_at DESC 
      LIMIT 1
    `);
    
    const session = stmt.get(storyId, characterId);
    
    if (session) {
      return {
        ...session,
        sessionData: JSON.parse((session as any).session_data || '{}')
      };
    }
    return null;
  },

  // Update session
  update: (id: number, sessionData: any) => {
    const stmt = db.prepare(`
      UPDATE story_sessions SET
        session_data = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    return stmt.run(JSON.stringify(sessionData), id);
  }
};

// Initialize database on import
initializeDatabase();

export { db as database };
export default db;