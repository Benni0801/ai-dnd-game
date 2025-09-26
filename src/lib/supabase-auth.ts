import { supabase } from './supabase';

// Check if Supabase is configured
const isSupabaseConfigured = () => {
  return supabase !== null;
};

// Helper function to get supabase client or throw error
const getSupabase = () => {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured. Please set up your environment variables.');
  }
  return supabase as NonNullable<typeof supabase>;
};

// Authentication functions using Supabase
export const authService = {
  // Sign up with email and password
  signUp: async (email: string, password: string, username: string) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please set up your environment variables.');
    }
    
    const { data, error } = await getSupabase().auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username
        }
      }
    });

    if (error) throw error;
    return data;
  },

  // Sign in with email and password
  signIn: async (email: string, password: string) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please set up your environment variables.');
    }
    
    const { data, error } = await getSupabase().auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    return data;
  },

  // Sign in with Google OAuth
  signInWithGoogle: async () => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please set up your environment variables.');
    }
    
    const { data, error } = await getSupabase().auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });

    if (error) throw error;
    return data;
  },

  // Sign out
  signOut: async () => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please set up your environment variables.');
    }
    
    const { error } = await getSupabase().auth.signOut();
    if (error) throw error;
  },

  // Get current user
  getCurrentUser: async () => {
    if (!isSupabaseConfigured()) {
      return null;
    }
    
    const { data: { user }, error } = await getSupabase().auth.getUser();
    if (error) throw error;
    return user;
  },

  // Get current session
  getCurrentSession: async () => {
    if (!isSupabaseConfigured()) {
      return null;
    }
    
    const { data: { session }, error } = await getSupabase().auth.getSession();
    if (error) throw error;
    return session;
  },

  // Listen to auth state changes
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    if (!isSupabaseConfigured()) {
      return { data: { subscription: { unsubscribe: () => {} } } };
    }
    
    return getSupabase().auth.onAuthStateChange(callback);
  }
};

// User profile functions
export const userService = {
  // Get user profile
  getProfile: async (userId: string) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please set up your environment variables.');
    }
    
    const { data, error } = await getSupabase()
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  },

  // Update user profile
  updateProfile: async (userId: string, updates: any) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please set up your environment variables.');
    }
    
    const { data, error } = await getSupabase()
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update last login
  updateLastLogin: async (userId: string) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please set up your environment variables.');
    }
    
    const { error } = await getSupabase()
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', userId);

    if (error) throw error;
  }
};

// Character management functions
export const characterService = {
  // Get all characters for a user
  getCharacters: async (userId: string) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please set up your environment variables.');
    }
    
    const { data, error } = await getSupabase()
      .from('characters')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Parse JSON fields
    return data.map(char => ({
      ...char,
      skills: JSON.parse(char.skills || '[]'),
      abilities: JSON.parse(char.abilities || '[]'),
      spells: JSON.parse(char.spells || '[]'),
      inventory: JSON.parse(char.inventory || '{}')
    }));
  },

  // Get character by ID
  getCharacter: async (characterId: string) => {
    const { data, error } = await getSupabase()
      .from('characters')
      .select('*')
      .eq('id', characterId)
      .single();

    if (error) throw error;
    
    return {
      ...data,
      skills: JSON.parse(data.skills || '[]'),
      abilities: JSON.parse(data.abilities || '[]'),
      spells: JSON.parse(data.spells || '[]'),
      inventory: JSON.parse(data.inventory || '{}')
    };
  },

  // Create new character
  createCharacter: async (userId: string, characterData: any) => {
    const { data, error } = await getSupabase()
      .from('characters')
      .insert({
        user_id: userId,
        name: characterData.name,
        race: characterData.race,
        class: characterData.class,
        level: characterData.level || 1,
        xp: characterData.xp || 0,
        max_xp: characterData.maxXp || 300,
        hp: characterData.hp || 20,
        max_hp: characterData.maxHp || 20,
        str: characterData.str || 10,
        dex: characterData.dex || 10,
        con: characterData.con || 10,
        int: characterData.int || 10,
        wis: characterData.wis || 10,
        cha: characterData.cha || 10,
        proficiency_bonus: characterData.proficiencyBonus || 2,
        background: characterData.background,
        backstory: characterData.backstory,
        skills: JSON.stringify(characterData.skills || []),
        abilities: JSON.stringify(characterData.abilities || []),
        spells: JSON.stringify(characterData.spells || []),
        inventory: JSON.stringify(characterData.inventory || {})
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update character
  updateCharacter: async (characterId: string, characterData: any) => {
    const { data, error } = await getSupabase()
      .from('characters')
      .update({
        name: characterData.name,
        race: characterData.race,
        class: characterData.class,
        level: characterData.level,
        xp: characterData.xp,
        max_xp: characterData.maxXp,
        hp: characterData.hp,
        max_hp: characterData.maxHp,
        str: characterData.str,
        dex: characterData.dex,
        con: characterData.con,
        int: characterData.int,
        wis: characterData.wis,
        cha: characterData.cha,
        proficiency_bonus: characterData.proficiencyBonus,
        background: characterData.background,
        backstory: characterData.backstory,
        skills: JSON.stringify(characterData.skills || []),
        abilities: JSON.stringify(characterData.abilities || []),
        spells: JSON.stringify(characterData.spells || []),
        inventory: JSON.stringify(characterData.inventory || {})
      })
      .eq('id', characterId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete character
  deleteCharacter: async (characterId: string) => {
    const { error } = await getSupabase()
      .from('characters')
      .delete()
      .eq('id', characterId);

    if (error) throw error;
  },

  // Count characters for a user
  countCharacters: async (userId: string) => {
    const { count, error } = await getSupabase()
      .from('characters')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) throw error;
    return count || 0;
  }
};

// Story management functions
export const storyService = {
  // Get all stories for a user
  getStories: async (userId: string) => {
    const { data, error } = await getSupabase()
      .from('stories')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Parse JSON fields
    return data.map(story => ({
      ...story,
      gameState: JSON.parse(story.game_state || '{}')
    }));
  },

  // Get story by ID
  getStory: async (storyId: string) => {
    const { data, error } = await getSupabase()
      .from('stories')
      .select('*')
      .eq('id', storyId)
      .single();

    if (error) throw error;
    
    return {
      ...data,
      gameState: JSON.parse(data.game_state || '{}')
    };
  },

  // Create new story
  createStory: async (userId: string, storyData: any) => {
    const { data, error } = await getSupabase()
      .from('stories')
      .insert({
        user_id: userId,
        title: storyData.title,
        description: storyData.description,
        genre: storyData.genre || 'fantasy',
        current_location: storyData.currentLocation,
        current_mission: storyData.currentMission,
        main_quest: storyData.mainQuest,
        game_state: JSON.stringify(storyData.gameState || {})
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update story
  updateStory: async (storyId: string, storyData: any) => {
    const { data, error } = await getSupabase()
      .from('stories')
      .update({
        title: storyData.title,
        description: storyData.description,
        genre: storyData.genre,
        current_location: storyData.currentLocation,
        current_mission: storyData.currentMission,
        main_quest: storyData.mainQuest,
        game_state: JSON.stringify(storyData.gameState || {})
      })
      .eq('id', storyId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete story
  deleteStory: async (storyId: string) => {
    const { error } = await getSupabase()
      .from('stories')
      .delete()
      .eq('id', storyId);

    if (error) throw error;
  },

  // Count stories for a user
  countStories: async (userId: string) => {
    const { count, error } = await getSupabase()
      .from('stories')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) throw error;
    return count || 0;
  }
};
