/*
  # Add Recipe History Tracking

  1. New Table
    - `recipe_history`: Tracks generated recipes per user
      - Includes user_id, recipe details, and generation timestamp
      - Stores recipe hash for duplicate detection
      - Implements automatic cleanup of old records

  2. Security
    - Enables Row Level Security (RLS)
    - Allows authenticated users to view their own history
*/

CREATE TABLE IF NOT EXISTS recipe_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  recipe_hash text NOT NULL,
  title text NOT NULL,
  ingredients text[] NOT NULL,
  meal_type text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX recipe_history_user_lookup ON recipe_history(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE recipe_history ENABLE ROW LEVEL SECURITY;

-- Only allow users to see their own history
CREATE POLICY "Users can view their own recipe history"
  ON recipe_history
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Create function to clean up old recipe history
CREATE OR REPLACE FUNCTION cleanup_recipe_history() RETURNS trigger AS $$
BEGIN
  -- Keep only the last 50 recipes per user
  DELETE FROM recipe_history
  WHERE id IN (
    SELECT id
    FROM (
      SELECT id,
             ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
      FROM recipe_history
    ) sq
    WHERE rn > 50
  );
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for cleanup
CREATE TRIGGER cleanup_recipe_history_trigger
  AFTER INSERT ON recipe_history
  FOR EACH STATEMENT
  EXECUTE FUNCTION cleanup_recipe_history();