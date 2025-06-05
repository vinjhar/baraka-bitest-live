-- Add composite index for faster lookups
CREATE INDEX IF NOT EXISTS saved_recipes_user_id_created_at_idx 
ON saved_recipes(user_id, created_at DESC);

-- Add unique constraint to prevent duplicates
ALTER TABLE saved_recipes
ADD CONSTRAINT unique_user_recipe 
UNIQUE (user_id, id);