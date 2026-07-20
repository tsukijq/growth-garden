-- Run this if you already have the old schema.
-- This adds all new columns without dropping existing data.

-- Add new columns to habits table
ALTER TABLE habits ADD COLUMN IF NOT EXISTS plant_name text;
ALTER TABLE habits ADD COLUMN IF NOT EXISTS intention text;
ALTER TABLE habits ADD COLUMN IF NOT EXISTS rest_days integer[] DEFAULT '{}';
ALTER TABLE habits ADD COLUMN IF NOT EXISTS milestones_reached integer[] DEFAULT '{}';
ALTER TABLE habits ADD COLUMN IF NOT EXISTS released_at timestamptz DEFAULT null;

-- Add quiet_mode to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS quiet_mode boolean DEFAULT false;

-- Update plant_stage constraint to include new stages
-- (only needed if you still have the old 'seed','sprout','growing','blooming','rare_bloom' constraint)
ALTER TABLE habits DROP CONSTRAINT IF EXISTS habits_plant_stage_check;
ALTER TABLE habits ADD CONSTRAINT habits_plant_stage_check 
  CHECK (plant_stage IN ('seed','sprout','seedling','vegetative','budding','flowering','fruiting'));

-- Create reflections table if it doesn't exist
CREATE TABLE IF NOT EXISTS habit_reflections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id uuid REFERENCES habits ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL,
  note text NOT NULL,
  reflected_at date DEFAULT current_date,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on reflections
ALTER TABLE habit_reflections ENABLE ROW LEVEL SECURITY;

-- Add RLS policy for reflections (skip if exists)
DO $$ BEGIN
  CREATE POLICY "Users can manage own reflections"
    ON habit_reflections FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create water_friend_plant function if not exists
CREATE OR REPLACE FUNCTION water_friend_plant(habit_id_input uuid, health_boost integer)
RETURNS habits LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  result habits%rowtype;
  new_health integer;
  new_stage text;
BEGIN
  SELECT * INTO result FROM habits WHERE id = habit_id_input;
  IF NOT FOUND THEN RAISE EXCEPTION 'Habit not found'; END IF;

  new_health := LEAST(100, result.health_score + health_boost);

  IF result.streak_count >= 30 THEN new_stage := 'fruiting';
  ELSIF result.streak_count >= 21 THEN new_stage := 'flowering';
  ELSIF result.streak_count >= 14 THEN new_stage := 'budding';
  ELSIF result.streak_count >= 7 THEN new_stage := 'vegetative';
  ELSIF result.streak_count >= 3 THEN new_stage := 'seedling';
  ELSIF result.streak_count >= 1 THEN new_stage := 'sprout';
  ELSE new_stage := 'seed';
  END IF;

  UPDATE habits SET health_score = new_health, plant_stage = new_stage
  WHERE id = habit_id_input RETURNING * INTO result;

  RETURN result;
END;
$$;
