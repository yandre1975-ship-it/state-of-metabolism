export interface DailyEntry {
  date: string; // YYYY-MM-DD
  weight: number | null;
  hunger: number;
  energy: number;
  coffee: number;
  protein: boolean;
  activity: number;
}

export interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

export interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  meal: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}

export interface DailyFood {
  date: string;
  items: FoodItem[];
}

export interface ExerciseEntry {
  id: string;
  name: string;
  reps?: number;
  sets?: number;
  minutes?: number;
  done: boolean;
}

export interface DailyExercises {
  date: string;
  items: ExerciseEntry[];
}

const ENTRIES_KEY = 'metabolic_entries';
const CHECKLIST_KEY = 'metabolic_checklist';
const FOOD_KEY = 'metabolic_food';
const EXERCISE_KEY = 'metabolic_exercises';

const DEFAULT_EXERCISES: Omit<ExerciseEntry, 'id' | 'done'>[] = [
  { name: 'Отжимания', reps: 20, sets: 3 },
  { name: 'Приседания', reps: 20, sets: 3 },
  { name: 'Планка', minutes: 1 },
  { name: 'Скручивания', reps: 15, sets: 3 },
  { name: 'Выпады', reps: 12, sets: 3 },
  { name: 'Берпи', reps: 10, sets: 2 },
];

export function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getEntries(): DailyEntry[] {
  try {
    return JSON.parse(localStorage.getItem(ENTRIES_KEY) || '[]');
  } catch { return []; }
}

export function getTodayEntry(): DailyEntry {
  const today = getToday();
  const entries = getEntries();
  return entries.find(e => e.date === today) || {
    date: today, weight: null, hunger: 2, energy: 3, coffee: 0, protein: false, activity: 0,
  };
}

export function saveEntry(entry: DailyEntry) {
  const entries = getEntries().filter(e => e.date !== entry.date);
  entries.push(entry);
  entries.sort((a, b) => a.date.localeCompare(b.date));
  localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
}

export function getLast7Days(): DailyEntry[] {
  const entries = getEntries();
  const dates: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates.map(date => entries.find(e => e.date === date) || {
    date, weight: null, hunger: 0, energy: 0, coffee: 0, protein: false, activity: 0,
  });
}

const DEFAULT_CHECKLIST: ChecklistItem[] = [
  { id: '1', label: 'Выпить стакан воды утром', checked: false },
  { id: '2', label: 'Съесть завтрак с белком', checked: false },
  { id: '3', label: 'Прогулка 20+ минут', checked: false },
  { id: '4', label: 'Не больше 2 чашек кофе', checked: false },
  { id: '5', label: 'Ужин за 3 часа до сна', checked: false },
  { id: '6', label: 'Трекинг еды', checked: false },
  { id: '7', label: '7+ часов сна', checked: false },
];

export function getChecklist(): ChecklistItem[] {
  try {
    const stored = localStorage.getItem(CHECKLIST_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return DEFAULT_CHECKLIST.map(i => ({ ...i }));
}

export function saveChecklist(items: ChecklistItem[]) {
  localStorage.setItem(CHECKLIST_KEY, JSON.stringify(items));
}

export type Status = 'green' | 'yellow' | 'red';

export function getStatus(entry: DailyEntry): { status: Status; message: string } {
  if (entry.hunger >= 4) return { status: 'red', message: 'Риск переедания' };
  if (entry.energy <= 2) return { status: 'red', message: 'Низкая энергия / стресс' };
  if (entry.hunger <= 3 && entry.energy >= 3 && entry.coffee <= 2 && entry.protein)
    return { status: 'green', message: 'Жиросжигание активно' };
  return { status: 'yellow', message: 'Пограничное состояние' };
}

export function getInsights(entry: DailyEntry): string[] {
  const tips: string[] = [];
  if (entry.hunger >= 4) tips.push('Высокий голод увеличивает риск срыва. Попробуйте добавить белок и клетчатку.');
  if (entry.energy <= 2) tips.push('Низкая энергия может говорить о стрессе или недосыпе. Приоритет — восстановление.');
  if (!entry.protein) tips.push('Белок в каждом приёме пищи помогает контролировать аппетит.');
  if (entry.coffee > 2) tips.push('Избыток кофе повышает кортизол. Попробуйте снизить до 1–2 чашек.');
  if (entry.activity < 20) tips.push('Даже 20 минут ходьбы значительно улучшают метаболизм.');
  if (tips.length === 0) tips.push('Отличные показатели! Продолжайте в том же духе.');
  return tips;
}

// ── Food diary ──

export function getTodayFood(): DailyFood {
  const today = getToday();
  try {
    const all: DailyFood[] = JSON.parse(localStorage.getItem(FOOD_KEY) || '[]');
    return all.find(d => d.date === today) || { date: today, items: [] };
  } catch { return { date: today, items: [] }; }
}

export function saveDailyFood(day: DailyFood) {
  try {
    const all: DailyFood[] = JSON.parse(localStorage.getItem(FOOD_KEY) || '[]').filter((d: DailyFood) => d.date !== day.date);
    all.push(day);
    all.sort((a, b) => a.date.localeCompare(b.date));
    localStorage.setItem(FOOD_KEY, JSON.stringify(all));
  } catch {}
}

export function getAllFood(): DailyFood[] {
  try {
    const all: DailyFood[] = JSON.parse(localStorage.getItem(FOOD_KEY) || '[]');
    return all.sort((a, b) => b.date.localeCompare(a.date));
  } catch { return []; }
}

export function getFoodByDate(date: string): DailyFood {
  try {
    const all: DailyFood[] = JSON.parse(localStorage.getItem(FOOD_KEY) || '[]');
    return all.find(d => d.date === date) || { date, items: [] };
  } catch { return { date, items: [] }; }
}

/**
 * Calculate daily macro targets based on weight (kg) and activity (min).
 * Uses Mifflin-St Jeor BMR estimate (male default) + activity factor.
 */
export function calcMacroTargets(weight: number | null, activityMin: number) {
  const w = weight || 75;
  // Simplified BMR ≈ 10 * weight + 600 (rough mid estimate)
  const bmr = 10 * w + 600;
  // Activity calories: ~5 kcal per minute of moderate activity
  const activityCal = activityMin * 5;
  // Slight deficit for fat loss
  const totalCal = Math.round(bmr + activityCal - 300);

  // Macro split: 30% protein, 40% carbs, 30% fat
  const proteinG = Math.round((totalCal * 0.3) / 4);
  const carbsG = Math.round((totalCal * 0.4) / 4);
  const fatG = Math.round((totalCal * 0.3) / 9);

  return { calories: Math.max(totalCal, 1200), protein: proteinG, carbs: carbsG, fat: fatG };
}

// ── Exercises ──

export function getTodayExercises(): DailyExercises {
  const today = getToday();
  try {
    const all: DailyExercises[] = JSON.parse(localStorage.getItem(EXERCISE_KEY) || '[]');
    const found = all.find(d => d.date === today);
    if (found) return found;
  } catch {}
  return {
    date: today,
    items: DEFAULT_EXERCISES.map((e, i) => ({ ...e, id: String(i + 1), done: false })),
  };
}

export function saveExercises(day: DailyExercises) {
  try {
    const all: DailyExercises[] = JSON.parse(localStorage.getItem(EXERCISE_KEY) || '[]').filter((d: DailyExercises) => d.date !== day.date);
    all.push(day);
    localStorage.setItem(EXERCISE_KEY, JSON.stringify(all));
  } catch {}
}
