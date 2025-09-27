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
  current_adventure?: any;
  adventure_status?: string;
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

export interface Friend {
  id: string;
  user_id: string;
  friend_id: string;
  status: string;
  created_at: string;
  accepted_at?: string;
  user?: {
    id: string;
    username: string;
    email: string;
  };
  friend?: {
    id: string;
    username: string;
    email: string;
  };
}

export interface FriendInvitation {
  id: string;
  from_user_id: string;
  to_user_id: string;
  room_id?: string;
  message?: string;
  status: string;
  created_at: string;
  responded_at?: string;
  from_user?: {
    username: string;
  };
  room?: {
    name: string;
  };
}

export interface AdventureQueueEntry {
  id: string;
  room_id: string;
  player_id: string;
  character_id?: string;
  adventure_type: string;
  status: string;
  queued_at: string;
  started_at?: string;
  completed_at?: string;
  player?: {
    username: string;
  };
  character?: {
    name: string;
  };
}

export interface TeamChatMessage {
  id: string;
  room_id: string;
  user_id: string;
  character_id?: string;
  content: string;
  message_type: string;
  dice_roll?: any;
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

    console.log('Creating room with data:', roomData);

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

    if (error) {
      console.error('Error creating room:', error);
      throw error;
    }

    console.log('Room created successfully:', data);

    // Add the DM as the first player
    try {
      await this.joinRoom(data.id, roomData.dmId, undefined, true);
      console.log('DM added to room successfully');
    } catch (joinError) {
      console.error('Error adding DM to room:', joinError);
      // Don't throw here, room was created successfully
    }

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
  async joinRoom(roomId: string, userId: string, characterId?: string, isDm: boolean = false): Promise<RoomPlayer> {
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
        character_id: characterId,
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

    console.log('Getting players for room:', roomId);

    const { data, error } = await supabase
      .from('room_players')
      .select(`
        *,
        user:users(id, username, email),
        character:characters(id, name, race, class, level)
      `)
      .eq('room_id', roomId)
      .order('joined_at', { ascending: true });

    if (error) {
      console.error('Error getting room players:', error);
      throw error;
    }

    console.log('Room players retrieved:', data);
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
  },

  // Friends Management
  async getFriends(userId: string): Promise<Friend[]> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured');
    }

    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('friends')
      .select(`
        *,
        friend:users!friends_friend_id_fkey(id, username, email)
      `)
      .eq('user_id', userId)
      .eq('status', 'accepted');

    if (error) throw error;
    return data || [];
  },

  async sendFriendRequest(userId: string, friendId: string): Promise<Friend> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured');
    }

    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('friends')
      .insert({
        user_id: userId,
        friend_id: friendId,
        status: 'pending'
      })
      .select(`
        *,
        friend:users!friends_friend_id_fkey(id, username, email)
      `)
      .single();

    if (error) throw error;
    return data;
  },

  async acceptFriendRequest(friendshipId: string): Promise<Friend> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured');
    }

    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('friends')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString()
      })
      .eq('id', friendshipId)
      .select(`
        *,
        friend:users!friends_friend_id_fkey(id, username, email)
      `)
      .single();

    if (error) throw error;
    return data;
  },

  // Friend Invitations
  async inviteFriendToRoom(fromUserId: string, toUserId: string, roomId: string, message?: string): Promise<FriendInvitation> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured');
    }

    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('friend_invitations')
      .insert({
        from_user_id: fromUserId,
        to_user_id: toUserId,
        room_id: roomId,
        message: message || '',
        status: 'pending'
      })
      .select(`
        *,
        from_user:users!friend_invitations_from_user_id_fkey(username),
        room:game_rooms(name)
      `)
      .single();

    if (error) throw error;
    return data;
  },

  async getFriendInvitations(userId: string): Promise<FriendInvitation[]> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured');
    }

    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('friend_invitations')
      .select(`
        *,
        from_user:users!friend_invitations_from_user_id_fkey(username),
        room:game_rooms(name)
      `)
      .eq('to_user_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async respondToInvitation(invitationId: string, accepted: boolean): Promise<void> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured');
    }

    const supabase = getSupabase();

    const { error } = await supabase
      .from('friend_invitations')
      .update({
        status: accepted ? 'accepted' : 'declined',
        responded_at: new Date().toISOString()
      })
      .eq('id', invitationId);

    if (error) throw error;
  },

  // Adventure Queue
  async joinAdventureQueue(roomId: string, playerId: string, characterId?: string, adventureType: string = 'general'): Promise<AdventureQueueEntry> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured');
    }

    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('adventure_queue')
      .insert({
        room_id: roomId,
        player_id: playerId,
        character_id: characterId,
        adventure_type: adventureType,
        status: 'waiting'
      })
      .select(`
        *,
        player:users(username),
        character:characters(name)
      `)
      .single();

    if (error) throw error;
    return data;
  },

  async getAdventureQueue(roomId: string): Promise<AdventureQueueEntry[]> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured');
    }

    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('adventure_queue')
      .select(`
        *,
        player:users(username),
        character:characters(name)
      `)
      .eq('room_id', roomId)
      .order('queued_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async leaveAdventureQueue(roomId: string, playerId: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured');
    }

    const supabase = getSupabase();

    const { error } = await supabase
      .from('adventure_queue')
      .delete()
      .eq('room_id', roomId)
      .eq('player_id', playerId);

    if (error) throw error;
  },

  // Team Chat (Players Only)
  async sendTeamMessage(roomId: string, messageData: {
    userId: string;
    characterId?: string;
    content: string;
    messageType: string;
    diceRoll?: any;
  }): Promise<TeamChatMessage> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured');
    }

    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('team_chat_messages')
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

  async getTeamMessages(roomId: string, limit: number = 50): Promise<TeamChatMessage[]> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured');
    }

    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('team_chat_messages')
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

  // AI Chat Integration
  async sendAIMessage(roomId: string, message: string, characterData?: any): Promise<RoomMessage> {
    try {
      // Send the message to AI API in the correct format
      const response = await fetch('/api/ai-dnd', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: message
            }
          ],
          characterStats: characterData
        }),
      });

      if (!response.ok) {
        throw new Error(`AI API error: ${response.status}`);
      }

      const aiResponse = await response.json();
      console.log('AI Response:', aiResponse);
      
      // Create a special AI message without using sendMessage (to avoid UUID issues)
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase is not configured');
      }

      const supabase = getSupabase();

      // Extract the AI response content
      let aiContent = '';
      if (aiResponse.response) {
        aiContent = aiResponse.response;
      } else if (aiResponse.message) {
        aiContent = aiResponse.message;
      } else if (typeof aiResponse === 'string') {
        aiContent = aiResponse;
      } else {
        aiContent = 'AI response received';
      }

      // Insert AI message directly with a special user_id that doesn't need to exist in users table
      const { data, error } = await supabase
        .from('room_messages')
        .insert({
          room_id: roomId,
          user_id: '00000000-0000-0000-0000-000000000000', // Special UUID for AI
          content: aiContent,
          message_type: 'system'
        })
        .select(`
          *,
          user:users(username),
          character:characters(name)
        `)
        .single();

      if (error) {
        console.error('Error saving AI message:', error);
        throw error;
      }

      return {
        ...data,
        user: data.user || { username: 'AI Dungeon Master' }, // Use actual user data if available
        character: undefined
      };
    } catch (error: any) {
      console.error('AI chat error:', error);
      
      // Fallback: create error message
      try {
        const supabase = getSupabase();
        const { data } = await supabase
          .from('room_messages')
          .insert({
            room_id: roomId,
            user_id: '00000000-0000-0000-0000-000000000000',
            content: `AI Error: ${error.message}`,
            message_type: 'system'
          })
          .select()
          .single();

        return {
          ...data,
          user: data.user || { username: 'AI Dungeon Master' },
          character: undefined
        };
      } catch (fallbackError) {
        console.error('Fallback error:', fallbackError);
        throw error;
      }
    }
  },

  // Enhanced real-time subscriptions with better error handling
  subscribeToRoomEnhanced(roomId: string, callbacks: {
    onMessage?: (message: RoomMessage) => void;
    onPlayerJoin?: (player: RoomPlayer) => void;
    onPlayerLeave?: (player: RoomPlayer) => void;
    onRoomUpdate?: (room: GameRoom) => void;
    onTeamMessage?: (message: TeamChatMessage) => void;
    onAdventureQueueUpdate?: (entry: AdventureQueueEntry) => void;
  }) {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured');
    }

    const supabase = getSupabase();
    const subscriptions: any[] = [];

    // Subscribe to main room messages
    if (callbacks.onMessage) {
      const messageSub = supabase
        .channel(`room-messages-${roomId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'room_messages',
          filter: `room_id=eq.${roomId}`
        }, (payload: any) => {
          console.log('New message received:', payload.new);
          callbacks.onMessage?.(payload.new as RoomMessage);
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'room_messages',
          filter: `room_id=eq.${roomId}`
        }, (payload: any) => {
          console.log('Message updated:', payload.new);
          callbacks.onMessage?.(payload.new as RoomMessage);
        })
        .subscribe();

      subscriptions.push(messageSub);
    }

    // Subscribe to team messages
    if (callbacks.onTeamMessage) {
      const teamMessageSub = supabase
        .channel(`team-messages-${roomId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'team_chat_messages',
          filter: `room_id=eq.${roomId}`
        }, (payload: any) => {
          console.log('New team message received:', payload.new);
          callbacks.onTeamMessage?.(payload.new as TeamChatMessage);
        })
        .subscribe();

      subscriptions.push(teamMessageSub);
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
          console.log('Player joined:', payload.new);
          callbacks.onPlayerJoin?.(payload.new as RoomPlayer);
        })
        .on('postgres_changes', {
          event: 'DELETE',
          schema: 'public',
          table: 'room_players',
          filter: `room_id=eq.${roomId}`
        }, (payload: any) => {
          console.log('Player left:', payload.old);
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
          console.log('Room updated:', payload.new);
          callbacks.onRoomUpdate?.(payload.new as GameRoom);
        })
        .subscribe();

      subscriptions.push(roomSub);
    }

    // Subscribe to adventure queue updates
    if (callbacks.onAdventureQueueUpdate) {
      const queueSub = supabase
        .channel(`adventure-queue-${roomId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'adventure_queue',
          filter: `room_id=eq.${roomId}`
        }, (payload: any) => {
          console.log('Adventure queue updated:', payload);
          if (payload.eventType === 'INSERT') {
            callbacks.onAdventureQueueUpdate?.(payload.new as AdventureQueueEntry);
          }
        })
        .subscribe();

      subscriptions.push(queueSub);
    }

    return {
      unsubscribe: () => {
        console.log('Unsubscribing from room subscriptions');
        subscriptions.forEach(sub => sub.unsubscribe());
      }
    };
  }
};
