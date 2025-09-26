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
    console.log('=== SIGN UP DEBUG ===');
    console.log('Email:', email);
    console.log('Username:', username);
    console.log('Password length:', password.length);
    
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

    console.log('Sign up result:');
    console.log('Data:', data);
    console.log('Error:', error);
    console.log('User email confirmed:', data.user?.email_confirmed_at);
    console.log('===================');

    if (error) throw error;
    return data;
  },

  // Sign in with email and password
  signIn: async (email: string, password: string) => {
    console.log('=== SIGN IN DEBUG ===');
    console.log('Email:', email);
    console.log('Password length:', password.length);
    console.log('Supabase configured:', isSupabaseConfigured());
    
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please set up your environment variables.');
    }
    
    // First, let's check if the user exists in auth.users
    console.log('Checking if user exists in auth.users...');
    try {
      const { data: userData, error: userError } = await getSupabase()
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
      
      console.log('User lookup result:', userData);
      console.log('User lookup error:', userError);
    } catch (e) {
      console.log('User lookup failed:', e);
    }
    
    console.log('Attempting sign in with Supabase...');
    const { data, error } = await getSupabase().auth.signInWithPassword({
      email,
      password
    });

    console.log('Sign in result:');
    console.log('Data:', data);
    console.log('Error:', error);
    console.log('Error message:', error?.message);
    console.log('Error code:', error?.code);
    console.log('===================');

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
    
    try {
      const { data: { user }, error } = await getSupabase().auth.getUser();
      if (error && error.message !== 'Auth session missing!') {
        throw error;
      }
      return user;
    } catch (error: any) {
      // Handle auth session missing gracefully
      if (error.message === 'Auth session missing!') {
        return null;
      }
      throw error;
    }
  },

  // Ensure user exists in public.users table
  ensureUserExists: async (userId: string) => {
    console.log('=== ENSURE USER EXISTS DEBUG ===');
    console.log('User ID:', userId);
    
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured');
    }
    
    // Check if user exists in public.users
    const { data: existingUser, error: checkError } = await getSupabase()
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();
    
    console.log('Existing user check:', existingUser);
    console.log('Check error:', checkError);
    
    if (checkError && checkError.code === 'PGRST116') {
      // User doesn't exist, create them
      console.log('User does not exist, creating...');
      
      const { data: authUser } = await getSupabase().auth.getUser();
      if (authUser.user) {
        const { data: newUser, error: createError } = await getSupabase()
          .from('users')
          .insert({
            id: userId,
            username: authUser.user.user_metadata?.username || 'Unknown',
            email: authUser.user.email || ''
          })
          .select()
          .single();
        
        console.log('User creation result:', newUser);
        console.log('User creation error:', createError);
        
        if (createError) {
          throw createError;
        }
        
        console.log('User created successfully');
        return newUser;
      }
    } else if (existingUser) {
      console.log('User already exists');
      return existingUser;
    }
    
    console.log('===============================');
    return existingUser;
  },

  // Get current session
  getCurrentSession: async () => {
    if (!isSupabaseConfigured()) {
      return null;
    }
    
    try {
      const { data: { session }, error } = await getSupabase().auth.getSession();
      if (error && error.message !== 'Auth session missing!') {
        throw error;
      }
      return session;
    } catch (error: any) {
      // Handle auth session missing gracefully
      if (error.message === 'Auth session missing!') {
        return null;
      }
      throw error;
    }
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
    return data.map((char: any) => ({
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
    console.log('=== CREATE CHARACTER DEBUG ===');
    console.log('User ID:', userId);
    console.log('Character data:', characterData);
    
    // Ensure user exists in public.users table
    await authService.ensureUserExists(userId);
    
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

    console.log('Character creation result:', data);
    console.log('Character creation error:', error);
    console.log('===============================');

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
    return data.map((story: any) => ({
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
