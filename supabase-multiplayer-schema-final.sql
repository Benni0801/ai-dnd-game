-- Multiplayer Game Rooms and Related Tables (FINAL VERSION)
-- Run this in your Supabase SQL Editor

-- First, drop existing policies and tables if they exist
DROP POLICY IF EXISTS "Players can view room players" ON room_players;
DROP POLICY IF EXISTS "Users can join rooms" ON room_players;
DROP POLICY IF EXISTS "Users can leave rooms" ON room_players;
DROP POLICY IF EXISTS "Users can update last seen" ON room_players;
DROP POLICY IF EXISTS "Players can view room messages" ON room_messages;
DROP POLICY IF EXISTS "Players can send messages" ON room_messages;
DROP POLICY IF EXISTS "Anyone can view active rooms" ON game_rooms;
DROP POLICY IF EXISTS "Authenticated users can create rooms" ON game_rooms;
DROP POLICY IF EXISTS "DM can update their room" ON game_rooms;
DROP POLICY IF EXISTS "DM can delete their room" ON game_rooms;

-- Drop tables if they exist
DROP TABLE IF EXISTS room_messages CASCADE;
DROP TABLE IF EXISTS room_players CASCADE;
DROP TABLE IF EXISTS game_rooms CASCADE;

-- Drop functions if they exist
DROP FUNCTION IF EXISTS update_room_player_count() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Game Rooms Table
CREATE TABLE game_rooms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    dm_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    max_players INTEGER DEFAULT 6 CHECK (max_players > 0 AND max_players <= 10),
    current_players INTEGER DEFAULT 0 CHECK (current_players >= 0),
    is_active BOOLEAN DEFAULT true,
    game_state JSONB DEFAULT '{}',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Room Players Table
CREATE TABLE room_players (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID NOT NULL REFERENCES game_rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    character_id UUID REFERENCES characters(id) ON DELETE SET NULL,
    is_dm BOOLEAN DEFAULT false,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(room_id, user_id)
);

-- Room Messages Table
CREATE TABLE room_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID NOT NULL REFERENCES game_rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    character_id UUID REFERENCES characters(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'chat' CHECK (message_type IN ('chat', 'action', 'dice_roll', 'system')),
    dice_roll JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_game_rooms_active ON game_rooms(is_active) WHERE is_active = true;
CREATE INDEX idx_game_rooms_dm ON game_rooms(dm_id);
CREATE INDEX idx_room_players_room ON room_players(room_id);
CREATE INDEX idx_room_players_user ON room_players(user_id);
CREATE INDEX idx_room_messages_room ON room_messages(room_id);
CREATE INDEX idx_room_messages_created ON room_messages(created_at DESC);

-- Row Level Security Policies

-- Game Rooms RLS
ALTER TABLE game_rooms ENABLE ROW LEVEL SECURITY;

-- Anyone can read active rooms
CREATE POLICY "Anyone can view active rooms" ON game_rooms
    FOR SELECT USING (is_active = true);

-- Only authenticated users can create rooms
CREATE POLICY "Authenticated users can create rooms" ON game_rooms
    FOR INSERT WITH CHECK (auth.uid() = dm_id);

-- Only DM can update their room
CREATE POLICY "DM can update their room" ON game_rooms
    FOR UPDATE USING (auth.uid() = dm_id);

-- Only DM can delete their room
CREATE POLICY "DM can delete their room" ON game_rooms
    FOR DELETE USING (auth.uid() = dm_id);

-- Room Players RLS
ALTER TABLE room_players ENABLE ROW LEVEL SECURITY;

-- Anyone can view players in active rooms (for player list)
CREATE POLICY "Anyone can view room players" ON room_players
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM game_rooms gr 
            WHERE gr.id = room_players.room_id 
            AND gr.is_active = true
        )
    );

-- Users can join rooms
CREATE POLICY "Users can join rooms" ON room_players
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can leave rooms
CREATE POLICY "Users can leave rooms" ON room_players
    FOR DELETE USING (auth.uid() = user_id);

-- Users can update their own last_seen
CREATE POLICY "Users can update last seen" ON room_players
    FOR UPDATE USING (auth.uid() = user_id);

-- Room Messages RLS
ALTER TABLE room_messages ENABLE ROW LEVEL SECURITY;

-- Anyone can view messages in active rooms (for player chat)
CREATE POLICY "Anyone can view room messages" ON room_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM game_rooms gr 
            WHERE gr.id = room_messages.room_id 
            AND gr.is_active = true
        )
    );

-- Users can send messages to rooms they're part of
CREATE POLICY "Users can send messages" ON room_messages
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM room_players rp 
            WHERE rp.room_id = room_messages.room_id 
            AND rp.user_id = auth.uid()
        )
    );

-- Functions for automatic updates

-- Function to update room current_players count
CREATE OR REPLACE FUNCTION update_room_player_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE game_rooms 
        SET current_players = current_players + 1,
            updated_at = NOW()
        WHERE id = NEW.room_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE game_rooms 
        SET current_players = current_players - 1,
            updated_at = NOW()
        WHERE id = OLD.room_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic player count updates
CREATE TRIGGER trigger_update_room_player_count_insert
    AFTER INSERT ON room_players
    FOR EACH ROW EXECUTE FUNCTION update_room_player_count();

CREATE TRIGGER trigger_update_room_player_count_delete
    AFTER DELETE ON room_players
    FOR EACH ROW EXECUTE FUNCTION update_room_player_count();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for game_rooms updated_at
CREATE TRIGGER trigger_game_rooms_updated_at
    BEFORE UPDATE ON game_rooms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
