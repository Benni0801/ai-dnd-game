-- WORKING Multiplayer Schema - Run this in Supabase SQL Editor
-- This version removes complex RLS policies that might be causing issues

-- Drop existing tables and policies first
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

DROP TABLE IF EXISTS room_messages CASCADE;
DROP TABLE IF EXISTS room_players CASCADE;
DROP TABLE IF EXISTS game_rooms CASCADE;

DROP FUNCTION IF EXISTS update_room_player_count() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Create tables with simple structure
CREATE TABLE game_rooms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    dm_id UUID NOT NULL,
    max_players INTEGER DEFAULT 6,
    current_players INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    game_state JSONB DEFAULT '{}',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE room_players (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID NOT NULL REFERENCES game_rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    character_id UUID,
    is_dm BOOLEAN DEFAULT false,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(room_id, user_id)
);

CREATE TABLE room_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID NOT NULL REFERENCES game_rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    character_id UUID,
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'chat',
    dice_roll JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_game_rooms_active ON game_rooms(is_active) WHERE is_active = true;
CREATE INDEX idx_room_players_room ON room_players(room_id);
CREATE INDEX idx_room_players_user ON room_players(user_id);
CREATE INDEX idx_room_messages_room ON room_messages(room_id);
CREATE INDEX idx_room_messages_created ON room_messages(created_at DESC);

-- Enable RLS but with very permissive policies for testing
ALTER TABLE game_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_messages ENABLE ROW LEVEL SECURITY;

-- Very permissive policies for testing
CREATE POLICY "Allow all operations on game_rooms" ON game_rooms FOR ALL USING (true);
CREATE POLICY "Allow all operations on room_players" ON room_players FOR ALL USING (true);
CREATE POLICY "Allow all operations on room_messages" ON room_messages FOR ALL USING (true);

-- Functions for automatic updates
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

-- Triggers
CREATE TRIGGER trigger_update_room_player_count_insert
    AFTER INSERT ON room_players
    FOR EACH ROW EXECUTE FUNCTION update_room_player_count();

CREATE TRIGGER trigger_update_room_player_count_delete
    AFTER DELETE ON room_players
    FOR EACH ROW EXECUTE FUNCTION update_room_player_count();

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_game_rooms_updated_at
    BEFORE UPDATE ON game_rooms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


