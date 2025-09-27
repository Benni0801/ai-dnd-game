import { getSupabase, isSupabaseConfigured } from './supabase-auth';

export interface GameRoom {
  id: string;
  name: string;
  description?: string;
  dm_id: string;
  max_players: number;
  current_players: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  game_state?: any;
  settings?: any;
}

export interface RoomPlayer {
  id: string;
  room_id: string;
  user_id: string;
  character_id?: string;
  is_dm: boolean;
  joined_at: string;
  last_seen: string;
  user?: {
    id: string;
    username: string;
    email: string;
  };
  character?: {
    id: string;
    name: string;
    race: string;
    class: string;
    level: number;
  };
}

export interface RoomMessage {
  id: string;
  room_id: string;
  user_id: string;
  character_id?: string;
  content: string;
  message_type: 'chat' | 'action' | 'dice_roll' | 'system';
  dice_roll?: {
    dice: string;
    result: number;
    modifier?: number;
    total: number;
  };
  created_at: string;
  user?: {
    username: string;
  };
  character?: {
    name: string;
  };
}

export const multiplayerService = {
  // Room Management
  async createRoom(roomData: {
    name: string;
    description?: string;
    dmId: string;
    maxPlayers?: number;
    settings?: any;
  }): Promise<GameRoom> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured');
    }

    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('game_rooms')
      .insert({
        name: roomData.name,
        description: roomData.description || '',
        dm_id: roomData.dmId,
        max_players: roomData.maxPlayers || 6,
        current_players: 1,
        is_active: true,
        game_state: roomData.settings || {},
        settings: roomData.settings || {}
      })
      .select()
      .single();

    if (error) throw error;

    // Add the DM as the first player
    await this.joinRoom(data.id, roomData.dmId, true);

    return data;
  },

  async getRooms(): Promise<GameRoom[]> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured');
    }

    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('game_rooms')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getRoom(roomId: string): Promise<GameRoom | null> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured');
    }

    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('game_rooms')
      .select('*')
      .eq('id', roomId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data;
  },

  async updateRoom(roomId: string, updates: Partial<GameRoom>): Promise<GameRoom> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured');
    }

    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('game_rooms')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', roomId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteRoom(roomId: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured');
    }

    const supabase = getSupabase();

    // Delete all related data
    await supabase.from('room_messages').delete().eq('room_id', roomId);
    await supabase.from('room_players').delete().eq('room_id', roomId);
    await supabase.from('game_rooms').delete().eq('id', roomId);
  },

  // Player Management
  async joinRoom(roomId: string, userId: string, isDm: boolean = false): Promise<RoomPlayer> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured');
    }

    const supabase = getSupabase();

    // Check if room exists and has space
    const room = await this.getRoom(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    if (room.current_players >= room.max_players) {
      throw new Error('Room is full');
    }

    // Check if user is already in the room
    const { data: existingPlayer } = await supabase
      .from('room_players')
      .select('*')
      .eq('room_id', roomId)
      .eq('user_id', userId)
      .single();

    if (existingPlayer) {
      // Update last seen
      await supabase
        .from('room_players')
        .update({ last_seen: new Date().toISOString() })
        .eq('id', existingPlayer.id);
      return existingPlayer;
    }

    // Add player to room
    const { data, error } = await supabase
      .from('room_players')
      .insert({
        room_id: roomId,
        user_id: userId,
        is_dm: isDm,
        joined_at: new Date().toISOString(),
        last_seen: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // Update room player count
    await supabase
      .from('game_rooms')
      .update({ current_players: room.current_players + 1 })
      .eq('id', roomId);

    return data;
  },

  async leaveRoom(roomId: string, userId: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured');
    }

    const supabase = getSupabase();

    // Remove player from room
    const { error } = await supabase
      .from('room_players')
      .delete()
      .eq('room_id', roomId)
      .eq('user_id', userId);

    if (error) throw error;

    // Update room player count
    const room = await this.getRoom(roomId);
    if (room) {
      await supabase
        .from('game_rooms')
        .update({ current_players: Math.max(0, room.current_players - 1) })
        .eq('id', roomId);
    }
  },

  async getRoomPlayers(roomId: string): Promise<RoomPlayer[]> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured');
    }

    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('room_players')
      .select(`
        *,
        user:users(id, username, email),
        character:characters(id, name, race, class, level)
      `)
      .eq('room_id', roomId)
      .order('joined_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Messaging
  async sendMessage(roomId: string, messageData: {
    userId: string;
    characterId?: string;
    content: string;
    messageType: 'chat' | 'action' | 'dice_roll' | 'system';
    diceRoll?: {
      dice: string;
      result: number;
      modifier?: number;
      total: number;
    };
  }): Promise<RoomMessage> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured');
    }

    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('room_messages')
      .insert({
        room_id: roomId,
        user_id: messageData.userId,
        character_id: messageData.characterId,
        content: messageData.content,
        message_type: messageData.messageType,
        dice_roll: messageData.diceRoll ? JSON.stringify(messageData.diceRoll) : null
      })
      .select(`
        *,
        user:users(username),
        character:characters(name)
      `)
      .single();

    if (error) throw error;

    return {
      ...data,
      dice_roll: data.dice_roll ? JSON.parse(data.dice_roll) : undefined
    };
  },

  async getRoomMessages(roomId: string, limit: number = 50): Promise<RoomMessage[]> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured');
    }

    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('room_messages')
      .select(`
        *,
        user:users(username),
        character:characters(name)
      `)
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map((msg: any) => ({
      ...msg,
      dice_roll: msg.dice_roll ? JSON.parse(msg.dice_roll) : undefined
    })).reverse();
  },

  // Real-time subscriptions
  subscribeToRoom(roomId: string, callbacks: {
    onMessage?: (message: RoomMessage) => void;
    onPlayerJoin?: (player: RoomPlayer) => void;
    onPlayerLeave?: (player: RoomPlayer) => void;
    onRoomUpdate?: (room: GameRoom) => void;
  }) {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured');
    }

    const supabase = getSupabase();

    const subscriptions: any[] = [];

    // Subscribe to messages
    if (callbacks.onMessage) {
      const messageSub = supabase
        .channel(`room-messages-${roomId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'room_messages',
          filter: `room_id=eq.${roomId}`
        }, (payload: any) => {
          callbacks.onMessage?.(payload.new as RoomMessage);
        })
        .subscribe();

      subscriptions.push(messageSub);
    }

    // Subscribe to player changes
    if (callbacks.onPlayerJoin || callbacks.onPlayerLeave) {
      const playerSub = supabase
        .channel(`room-players-${roomId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'room_players',
          filter: `room_id=eq.${roomId}`
        }, (payload: any) => {
          callbacks.onPlayerJoin?.(payload.new as RoomPlayer);
        })
        .on('postgres_changes', {
          event: 'DELETE',
          schema: 'public',
          table: 'room_players',
          filter: `room_id=eq.${roomId}`
        }, (payload: any) => {
          callbacks.onPlayerLeave?.(payload.old as RoomPlayer);
        })
        .subscribe();

      subscriptions.push(playerSub);
    }

    // Subscribe to room updates
    if (callbacks.onRoomUpdate) {
      const roomSub = supabase
        .channel(`room-updates-${roomId}`)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'game_rooms',
          filter: `id=eq.${roomId}`
        }, (payload: any) => {
          callbacks.onRoomUpdate?.(payload.new as GameRoom);
        })
        .subscribe();

      subscriptions.push(roomSub);
    }

    return {
      unsubscribe: () => {
        subscriptions.forEach(sub => sub.unsubscribe());
      }
    };
  }
};
