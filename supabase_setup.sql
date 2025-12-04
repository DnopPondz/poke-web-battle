-- Add is_active column to inventory table
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT FALSE;

-- Create a function to handle single active pokemon logic
CREATE OR REPLACE FUNCTION set_active_pokemon(p_id BIGINT, p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Reset all other pokemon for this user to is_active = false
  UPDATE inventory
  SET is_active = false
  WHERE user_id = p_user_id;

  -- Set the selected pokemon to is_active = true
  UPDATE inventory
  SET is_active = true
  WHERE id = p_id AND user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;
