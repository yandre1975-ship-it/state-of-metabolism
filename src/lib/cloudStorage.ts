import { supabase } from '@/integrations/supabase/client';
import type { UserProfile, DailyEntry, DailyFood, DailyExercises } from './storage';

// ── Profile ──

export async function getCloudProfile(): Promise<UserProfile | null> {
  const { data } = await supabase.from('profiles').select('*').single();
  if (!data) return null;
  return {
    name: data.name,
    sex: data.sex as 'male' | 'female',
    age: data.age,
    height: data.height,
    weight: Number(data.weight),
    goal: data.goal as UserProfile['goal'],
    activityLevel: (data.activity_level || 'light') as UserProfile['activityLevel'],
    conditions: (data.conditions || []) as UserProfile['conditions'],
    targetWeight: data.target_weight ? Number(data.target_weight) : undefined,
    targetDate: data.target_date || undefined,
  };
}

export async function saveCloudProfile(profile: UserProfile) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('profiles').upsert({
    id: user.id,
    name: profile.name,
    sex: profile.sex,
    age: profile.age,
    height: profile.height,
    weight: profile.weight,
    goal: profile.goal,
    activity_level: profile.activityLevel,
    conditions: profile.conditions,
    target_weight: profile.targetWeight ?? null,
    target_date: profile.targetDate ?? null,
    updated_at: new Date().toISOString(),
  });
}

// ── Daily Entries ──

export async function getCloudEntries(): Promise<DailyEntry[]> {
  const { data } = await supabase
    .from('daily_entries')
    .select('*')
    .order('date', { ascending: true });

  return (data || []).map(d => ({
    date: d.date,
    weight: d.weight ? Number(d.weight) : null,
    hunger: d.hunger,
    energy: d.energy,
    coffee: d.coffee,
    protein: d.protein,
    activity: d.activity,
  }));
}

export async function saveCloudEntry(entry: DailyEntry) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('daily_entries').upsert({
    user_id: user.id,
    date: entry.date,
    weight: entry.weight,
    hunger: entry.hunger,
    energy: entry.energy,
    coffee: entry.coffee,
    protein: entry.protein,
    activity: entry.activity,
  }, { onConflict: 'user_id,date' });
}

// ── Food ──

export async function getCloudFood(date: string): Promise<DailyFood> {
  const { data } = await supabase
    .from('food_entries')
    .select('*')
    .eq('date', date)
    .maybeSingle();

  return { date, items: (data?.items as unknown as DailyFood['items']) || [] };
}

export async function getAllCloudFood(): Promise<DailyFood[]> {
  const { data } = await supabase
    .from('food_entries')
    .select('*')
    .order('date', { ascending: false });

  return (data || []).map(d => ({
    date: d.date,
    items: (d.items as unknown as DailyFood['items']) || [],
  }));
}

export async function saveCloudFood(day: DailyFood) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('food_entries').upsert({
    user_id: user.id,
    date: day.date,
    items: day.items as any,
  }, { onConflict: 'user_id,date' });
}

// ── Exercises ──

export async function getCloudExercises(date: string): Promise<DailyExercises | null> {
  const { data } = await supabase
    .from('exercise_entries')
    .select('*')
    .eq('date', date)
    .maybeSingle();

  if (!data) return null;
  return { date: data.date, items: (data.items as unknown as DailyExercises['items']) || [] };
}

export async function saveCloudExercises(day: DailyExercises) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('exercise_entries').upsert({
    user_id: user.id,
    date: day.date,
    items: day.items as any,
  }, { onConflict: 'user_id,date' });
}

// ── Migration: localStorage → cloud ──

export async function migrateLocalToCloud() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Migrate profile
  try {
    const stored = localStorage.getItem('metabolic_profile');
    if (stored) {
      const profile = JSON.parse(stored) as UserProfile;
      if (profile.name) {
        await saveCloudProfile(profile);
      }
    }
  } catch {}

  // Migrate entries
  try {
    const stored = localStorage.getItem('metabolic_entries');
    if (stored) {
      const entries = JSON.parse(stored) as DailyEntry[];
      for (const entry of entries) {
        await saveCloudEntry(entry);
      }
    }
  } catch {}

  // Migrate food
  try {
    const stored = localStorage.getItem('metabolic_food');
    if (stored) {
      const foods = JSON.parse(stored) as DailyFood[];
      for (const food of foods) {
        await saveCloudFood(food);
      }
    }
  } catch {}

  // Migrate exercises
  try {
    const stored = localStorage.getItem('metabolic_exercises');
    if (stored) {
      const exercises = JSON.parse(stored) as DailyExercises[];
      for (const ex of exercises) {
        await saveCloudExercises(ex);
      }
    }
  } catch {}
}
