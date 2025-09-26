import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// Global singleton instance to prevent multiple GoTrueClient instances
declare global {
  var __supabaseClient: any;
}

function createSupabaseClient() {
  console.log('=== SUPABASE CLIENT DEBUG ===');
  console.log('Supabase URL:', supabaseUrl);
  console.log('Supabase Key (first 20 chars):', supabaseAnonKey.substring(0, 20) + '...');
  console.log('Window available:', typeof window !== 'undefined');
  console.log('Has global client:', typeof window !== 'undefined' && !!(window as any).__supabaseClient);
  
  // Check if we already have a global instance
  if (typeof window !== 'undefined' && (window as any).__supabaseClient) {
    console.log('Returning existing global client');
    return (window as any).__supabaseClient;
  }
  
  if (supabaseUrl.includes('placeholder') || supabaseAnonKey.includes('placeholder')) {
    console.log('Supabase not configured - using placeholders');
    return null;
  }
  
  // Only create client on the client side
  if (typeof window === 'undefined') {
    console.log('Server side - returning null');
    return null;
  }
  
  console.log('Creating new Supabase client...');
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: window.localStorage
    }
  });
  
  // Store globally to prevent multiple instances
  (window as any).__supabaseClient = client;
  
  console.log('Supabase client created successfully');
  console.log('===============================');
  return client;
}

export const supabase = createSupabaseClient();

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          username: string;
          email: string;
          created_at: string;
          last_login: string | null;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          username: string;
          email: string;
          created_at?: string;
          last_login?: string | null;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          username?: string;
          email?: string;
          created_at?: string;
          last_login?: string | null;
          is_active?: boolean;
        };
      };
      characters: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          race: string | null;
          class: string | null;
          level: number;
          xp: number;
          max_xp: number;
          hp: number;
          max_hp: number;
          str: number;
          dex: number;
          con: number;
          int: number;
          wis: number;
          cha: number;
          proficiency_bonus: number;
          background: string | null;
          backstory: string | null;
          skills: string;
          abilities: string;
          spells: string;
          inventory: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          race?: string | null;
          class?: string | null;
          level?: number;
          xp?: number;
          max_xp?: number;
          hp?: number;
          max_hp?: number;
          str?: number;
          dex?: number;
          con?: number;
          int?: number;
          wis?: number;
          cha?: number;
          proficiency_bonus?: number;
          background?: string | null;
          backstory?: string | null;
          skills?: string;
          abilities?: string;
          spells?: string;
          inventory?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          race?: string | null;
          class?: string | null;
          level?: number;
          xp?: number;
          max_xp?: number;
          hp?: number;
          max_hp?: number;
          str?: number;
          dex?: number;
          con?: number;
          int?: number;
          wis?: number;
          cha?: number;
          proficiency_bonus?: number;
          background?: string | null;
          backstory?: string | null;
          skills?: string;
          abilities?: string;
          spells?: string;
          inventory?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      stories: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          genre: string;
          current_location: string | null;
          current_mission: string | null;
          main_quest: string | null;
          game_state: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          genre?: string;
          current_location?: string | null;
          current_mission?: string | null;
          main_quest?: string | null;
          game_state?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          genre?: string;
          current_location?: string | null;
          current_mission?: string | null;
          main_quest?: string | null;
          game_state?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      story_sessions: {
        Row: {
          id: string;
          story_id: string;
          character_id: string;
          session_data: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          story_id: string;
          character_id: string;
          session_data?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          story_id?: string;
          character_id?: string;
          session_data?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

// Typed Supabase client (using the same singleton instance)
export const supabaseTyped = typeof window !== 'undefined' ? (window as any).__supabaseClient : null;
