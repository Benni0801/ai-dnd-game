import { getSupabase, isSupabaseConfigured } from './supabase-auth';

// Adventure session management
export const adventureService = {
  // Create or update adventure session
  saveAdventureSession: async (userId: string, characterId: string, sessionData: any) => {
    console.log('=== SAVE ADVENTURE SESSION ===');
    console.log('User ID:', userId);
    console.log('Character ID:', characterId);
    console.log('Session data:', sessionData);
    
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured');
    }

    // Check if session already exists
    const { data: existingSession, error: checkError } = await getSupabase()
      .from('story_sessions')
      .select('*')
      .eq('character_id', characterId)
      .single();

    if (existingSession) {
      // Update existing session
      const { data, error } = await getSupabase()
        .from('story_sessions')
        .update({
          session_data: JSON.stringify(sessionData),
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSession.id)
        .select()
        .single();

      console.log('Session updated:', data);
      console.log('Update error:', error);
      
      if (error) throw error;
      return data;
    } else {
      // Create new session - first create a story if none exists
      const { data: stories, error: storiesError } = await getSupabase()
        .from('stories')
        .select('id')
        .eq('user_id', userId)
        .limit(1);

      if (storiesError) throw storiesError;

      let storyId;
      if (stories && stories.length > 0) {
        storyId = stories[0].id;
      } else {
        // Create a default story
        const { data: newStory, error: createStoryError } = await getSupabase()
          .from('stories')
          .insert({
            user_id: userId,
            title: 'My Adventure',
            description: 'An epic D&D adventure',
            genre: 'fantasy'
          })
          .select()
          .single();

        if (createStoryError) throw createStoryError;
        storyId = newStory.id;
      }

      // Create new session
      const { data, error } = await getSupabase()
        .from('story_sessions')
        .insert({
          story_id: storyId,
          character_id: characterId,
          session_data: JSON.stringify(sessionData)
        })
        .select()
        .single();

      console.log('Session created:', data);
      console.log('Create error:', error);
      
      if (error) throw error;
      return data;
    }
  },

  // Load adventure session
  loadAdventureSession: async (characterId: string) => {
    console.log('=== LOAD ADVENTURE SESSION ===');
    console.log('Character ID:', characterId);
    
    if (!isSupabaseConfigured()) {
      return null;
    }

    const { data, error } = await getSupabase()
      .from('story_sessions')
      .select('*')
      .eq('character_id', characterId)
      .single();

    console.log('Session loaded:', data);
    console.log('Load error:', error);

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (data) {
      return {
        ...data,
        session_data: JSON.parse(data.session_data || '{}')
      };
    }

    return null;
  },

  // Delete adventure session
  deleteAdventureSession: async (characterId: string) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured');
    }

    const { error } = await getSupabase()
      .from('story_sessions')
      .delete()
      .eq('character_id', characterId);

    if (error) throw error;
  }
};
