-- Enhanced Multiplayer Schema with Friends, Team Chat, and Adventure Queue
-- Run this in Supabase SQL Editor

-- Create friends table
CREATE TABLE IF NOT EXISTS friends (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'accepted', 'blocked'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, friend_id),
    CHECK (user_id != friend_id)
);

-- Create friend invitations table
CREATE TABLE IF NOT EXISTS friend_invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    to_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    room_id UUID REFERENCES game_rooms(id) ON DELETE CASCADE,
    message TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'accepted', 'declined'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    responded_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(from_user_id, to_user_id, room_id)
);

-- Create adventure queue table
CREATE TABLE IF NOT EXISTS adventure_queue (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID NOT NULL REFERENCES game_rooms(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    character_id UUID REFERENCES characters(id) ON DELETE SET NULL,
    adventure_type VARCHAR(50) DEFAULT 'general', -- 'general', 'combat', 'exploration', 'social'
    status VARCHAR(20) DEFAULT 'waiting', -- 'waiting', 'active', 'completed'
    queued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(room_id, player_id)
);

-- Create team chat messages table (separate from room messages)
CREATE TABLE IF NOT EXISTS team_chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID NOT NULL REFERENCES game_rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    character_id UUID REFERENCES characters(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'chat', -- 'chat', 'dice_roll', 'system'
    dice_roll JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add adventure state to game_rooms
ALTER TABLE game_rooms 
ADD COLUMN IF NOT EXISTS current_adventure JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS adventure_status VARCHAR(20) DEFAULT 'idle'; -- 'idle', 'queued', 'active'

-- Disable RLS for new tables
ALTER TABLE friends DISABLE ROW LEVEL SECURITY;
ALTER TABLE friend_invitations DISABLE ROW LEVEL SECURITY;
ALTER TABLE adventure_queue DISABLE ROW LEVEL SECURITY;
ALTER TABLE team_chat_messages DISABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_friends_user_id ON friends(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend_id ON friends(friend_id);
CREATE INDEX IF NOT EXISTS idx_friend_invitations_to_user ON friend_invitations(to_user_id);
CREATE INDEX IF NOT EXISTS idx_adventure_queue_room_id ON adventure_queue(room_id);
CREATE INDEX IF NOT EXISTS idx_adventure_queue_status ON adventure_queue(status);
CREATE INDEX IF NOT EXISTS idx_team_chat_messages_room_id ON team_chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_team_chat_messages_created_at ON team_chat_messages(created_at);

-- Insert some test data
INSERT INTO friends (user_id, friend_id, status) VALUES 
('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111', 'accepted')
ON CONFLICT (user_id, friend_id) DO NOTHING;

-- Verify tables were created
SELECT 'friends' as table_name, count(*) as row_count FROM friends
UNION ALL
SELECT 'friend_invitations' as table_name, count(*) as row_count FROM friend_invitations
UNION ALL
SELECT 'adventure_queue' as table_name, count(*) as row_count FROM adventure_queue
UNION ALL
SELECT 'team_chat_messages' as table_name, count(*) as row_count FROM team_chat_messages;
