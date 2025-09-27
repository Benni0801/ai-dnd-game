// Debug script for multiplayer functionality
// Run this in your browser console to test database connectivity

async function debugMultiplayer() {
  console.log('🔍 Starting multiplayer debug...');
  
  // Check if Supabase is configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  console.log('Supabase URL:', supabaseUrl);
  console.log('Supabase Key (first 20 chars):', supabaseKey?.substring(0, 20));
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase environment variables not found!');
    return;
  }
  
  // Test basic Supabase connection
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('✅ Supabase client created successfully');
    
    // Test if tables exist
    console.log('🔍 Testing table access...');
    
    // Test game_rooms table
    const { data: rooms, error: roomsError } = await supabase
      .from('game_rooms')
      .select('*')
      .limit(1);
    
    if (roomsError) {
      console.error('❌ Error accessing game_rooms table:', roomsError);
    } else {
      console.log('✅ game_rooms table accessible, found', rooms?.length || 0, 'rooms');
    }
    
    // Test room_players table
    const { data: players, error: playersError } = await supabase
      .from('room_players')
      .select('*')
      .limit(1);
    
    if (playersError) {
      console.error('❌ Error accessing room_players table:', playersError);
    } else {
      console.log('✅ room_players table accessible, found', players?.length || 0, 'players');
    }
    
    // Test users table
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (usersError) {
      console.error('❌ Error accessing users table:', usersError);
    } else {
      console.log('✅ users table accessible, found', users?.length || 0, 'users');
    }
    
    // Test characters table
    const { data: characters, error: charactersError } = await supabase
      .from('characters')
      .select('*')
      .limit(1);
    
    if (charactersError) {
      console.error('❌ Error accessing characters table:', charactersError);
    } else {
      console.log('✅ characters table accessible, found', characters?.length || 0, 'characters');
    }
    
  } catch (error) {
    console.error('❌ Error creating Supabase client:', error);
  }
}

// Run the debug function
debugMultiplayer();
