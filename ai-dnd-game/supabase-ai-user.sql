-- Create AI Dungeon Master user for system messages
-- Run this in Supabase SQL Editor

-- Insert AI user if it doesn't exist
INSERT INTO users (id, username, email, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'AI Dungeon Master',
  'ai@dungeonmaster.local',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Verify the AI user was created
SELECT id, username, email FROM users WHERE id = '00000000-0000-0000-0000-000000000000';

