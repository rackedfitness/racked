export type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
};

export type Exercise = {
  id: string;
  name: string;
  category: string | null;
  equipment: string | null;
  created_by: string | null;
  created_at: string;
};

export type Workout = {
  id: string;
  user_id: string;
  title: string;
  notes: string | null;
  started_at: string;
  finished_at: string | null;
  created_at: string;
};

export type WorkoutExercise = {
  id: string;
  workout_id: string;
  exercise_id: string;
  order_index: number;
  notes: string | null;
};

export type WorkoutSet = {
  id: string;
  workout_exercise_id: string;
  set_index: number;
  weight: number | null;
  reps: number | null;
  distance_km: number | null;
  duration_seconds: number | null;
  is_warmup: boolean;
  completed: boolean;
};

export type Follow = {
  follower_id: string;
  following_id: string;
  created_at: string;
};

