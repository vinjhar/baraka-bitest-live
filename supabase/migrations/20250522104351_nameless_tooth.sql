/*
  # Add Share Analytics Table

  1. New Table
    - `share_analytics`: Tracks recipe sharing events
      - Includes user_id (optional, for authenticated users)
      - Records recipe_id and sharing platform
      - Timestamps for analytics

  2. Security
    - Enables Row Level Security (RLS)
    - Allows inserts from authenticated and anonymous users
    - Restricts viewing to authenticated users
*/

CREATE TABLE IF NOT EXISTS share_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  recipe_id text NOT NULL,
  share_platform text NOT NULL,
  created_at timestamptz DEFAULT now(),
  ip_address text
);

ALTER TABLE share_analytics ENABLE ROW LEVEL SECURITY;

-- Allow inserts from any user (authenticated or anonymous)
CREATE POLICY "Anyone can insert share analytics"
  ON share_analytics
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Only authenticated users can view analytics
CREATE POLICY "Authenticated users can view share analytics"
  ON share_analytics
  FOR SELECT
  TO authenticated
  USING (true);