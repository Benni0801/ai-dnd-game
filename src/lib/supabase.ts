import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// Create a singleton instance to avoid multiple GoTrueClient instances
let supabaseInstance: any = null;

export const supabase = (() => {
  if (supabaseInstance) {
    return supabaseInstance;
  }
  
  if (supabaseUrl.includes('placeholder') || supabaseAnonKey.includes('placeholder')) {
    return null;
  }
  
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined
    }
  });
  
  return supabaseInstance;
})();

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

// Typed Supabase client
export const supabaseTyped = supabaseUrl.includes('placeholder') || supabaseAnonKey.includes('placeholder')
  ? null
  : createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    });
