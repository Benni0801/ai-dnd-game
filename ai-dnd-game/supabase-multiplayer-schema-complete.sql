-- Complete Multiplayer Schema with Foreign Key Relationships
-- Run this in Supabase SQL Editor

-- Drop existing tables if they exist (to start fresh)
DROP TABLE IF EXISTS room_messages CASCADE;
DROP TABLE IF EXISTS room_players CASCADE;
DROP TABLE IF EXISTS game_rooms CASCADE;

-- Create game_rooms table
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

-- Create room_players table with proper foreign keys
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

-- Create room_messages table with proper foreign keys
CREATE TABLE room_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID NOT NULL REFERENCES game_rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    character_id UUID REFERENCES characters(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'chat',
    dice_roll JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable RLS for now (we'll enable it later)
ALTER TABLE game_rooms DISABLE ROW LEVEL SECURITY;
ALTER TABLE room_players DISABLE ROW LEVEL SECURITY;
ALTER TABLE room_messages DISABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX idx_room_players_room_id ON room_players(room_id);
CREATE INDEX idx_room_players_user_id ON room_players(user_id);
CREATE INDEX idx_room_messages_room_id ON room_messages(room_id);
CREATE INDEX idx_room_messages_created_at ON room_messages(created_at);

-- Create function to update current_players count
CREATE OR REPLACE FUNCTION update_room_player_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE game_rooms 
        SET current_players = current_players + 1 
        WHERE id = NEW.room_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE game_rooms 
        SET current_players = current_players - 1 
        WHERE id = OLD.room_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update player count
CREATE TRIGGER trigger_update_room_player_count
    AFTER INSERT OR DELETE ON room_players
    FOR EACH ROW EXECUTE FUNCTION update_room_player_count();

-- Insert some test data (optional)
INSERT INTO game_rooms (name, description, dm_id) VALUES 
('Test Room', 'A test room for debugging', '00000000-0000-0000-0000-000000000000');

-- Verify tables were created
SELECT 'game_rooms' as table_name, count(*) as row_count FROM game_rooms
UNION ALL
SELECT 'room_players' as table_name, count(*) as row_count FROM room_players
UNION ALL
SELECT 'room_messages' as table_name, count(*) as row_count FROM room_messages;
