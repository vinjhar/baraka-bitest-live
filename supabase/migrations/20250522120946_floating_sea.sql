/*
  # Add saved recipes table

  1. New Table
    - `saved_recipes`
      - `id` (text, primary key)
      - `user_id` (uuid, references auth.users)
      - `title` (text)
      - `description` (text, nullable)
      - `ingredients` (text array)
      - `instructions` (text array)
      - `prep_time` (text, nullable)
      - `cook_time` (text, nullable)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for SELECT, INSERT, and DELETE operations
*/

-- Create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS saved_recipes (
  id text PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  title text NOT NULL,
  description text,
  ingredients text[] NOT NULL,
  instructions text[] NOT NULL,
  prep_time text,
  cook_time text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS if not already enabled
ALTER TABLE saved_recipes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can view their own saved recipes" ON saved_recipes;
  DROP POLICY IF EXISTS "Users can insert their own recipes" ON saved_recipes;
  DROP POLICY IF EXISTS "Users can delete their own recipes" ON saved_recipes;
END $$;

-- Create policies
CREATE POLICY "Users can view their own saved recipes"
  ON saved_recipes
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own recipes"
  ON saved_recipes
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own recipes"
  ON saved_recipes
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());