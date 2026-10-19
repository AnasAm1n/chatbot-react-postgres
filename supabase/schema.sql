-- Create threads table
-- This table stores individual chat conversations
CREATE TABLE threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create messages table
-- This table stores individual messages within chat threads
CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('user', 'bot')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create index for faster queries on thread_id
CREATE INDEX messages_thread_id_idx ON messages(thread_id);