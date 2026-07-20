export type PlantStage = 'seed' | 'sprout' | 'seedling' | 'vegetative' | 'budding' | 'flowering' | 'fruiting';

export type RareVariant = 'crystal_sprout' | 'moonbell_orchid' | 'black_moonflower' | null;

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  plant_name: string | null;
  intention: string | null;
  streak_count: number;
  last_completed: string | null;
  plant_stage: PlantStage;
  health_score: number;
  rest_days: number[];
  milestones_reached: number[];
  released_at?: string | null;
  created_at: string;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  user_id: string;
  completed_at: string;
}

export interface HabitReflection {
  id: string;
  habit_id: string;
  user_id: string;
  note: string;
  reflected_at: string;
}

export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  total_rare_blooms: number;
  quiet_mode: boolean;
}

export interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: 'pending' | 'accepted';
  created_at: string;
}

export interface Watering {
  id: string;
  from_user_id: string;
  to_user_id: string;
  habit_id: string;
  watered_at: string;
}

export interface FriendWithProfile extends Friendship {
  profile: Profile;
  habits?: Habit[];
}
