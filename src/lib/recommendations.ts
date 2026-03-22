import { type UserProfile, calcMacroTargets, type FoodItem } from './storage';
import { FOOD_DATABASE, type FoodDBItem } from './foodDatabase';

export interface MealRecommendation {
  meal: 'breakfast' | 'lunch' | 'dinner';
  label: string;
  targetCalories: number;
  targetProtein: number;
  suggestions: { name: string; grams: number; calories: number; protein: number; carbs: number; fat: number }[];
}

export interface SnackRecommendation {
  afterMeal: 'breakfast' | 'lunch' | 'dinner';
  targetCalories: number;
  options: { name: string; grams: number; calories: number; protein: number; carbs: number; fat: number }[];
}

export interface ExerciseRecommendation {
  slot: 'morning' | 'afternoon' | 'evening';
  label: string;
  exercises: { name: string; sets?: number; reps?: number; minutes?: number; caloriesBurned: number }[];
  totalBurn: number;
}

export interface DailyRecommendations {
  totalCalories: number;
  meals: MealRecommendation[];
  snacks: SnackRecommendation[];
  exercises: ExerciseRecommendation[];
  exerciseTotalBurn: number;
}

// ── Helper: pick foods by category ──

function findFood(name: string): FoodDBItem | undefined {
  return FOOD_DATABASE.find(f => f.name.toLowerCase().includes(name.toLowerCase()));
}

function scaleTo(food: FoodDBItem, grams: number) {
  const mult = grams / 100;
  return {
    name: food.name,
    grams,
    calories: Math.round(food.calories * mult),
    protein: Math.round(food.protein * mult * 10) / 10,
    carbs: Math.round(food.carbs * mult * 10) / 10,
    fat: Math.round(food.fat * mult * 10) / 10,
  };
}

// ── Build meal recommendations based on profile and calorie budget ──

export function generateRecommendations(profile: UserProfile, activityMin: number = 0): DailyRecommendations {
  const targets = calcMacroTargets(profile.weight, activityMin, profile);
  const totalCal = targets.calories;
  const hasIR = profile.conditions.includes('insulin_resistance');

  // Split calories: breakfast 25%, lunch 35%, dinner 25%, snacks 15%
  const breakfastCal = Math.round(totalCal * 0.25);
  const lunchCal = Math.round(totalCal * 0.35);
  const dinnerCal = Math.round(totalCal * 0.25);
  const snackCal = Math.round(totalCal * 0.15);
  const snackPerSlot = Math.round(snackCal / 3);

  // Protein targets per meal (proportional)
  const totalP = targets.protein;
  const bP = Math.round(totalP * 0.25);
  const lP = Math.round(totalP * 0.35);
  const dP = Math.round(totalP * 0.30);

  // ── Breakfast suggestions ──
  const breakfastOptions = hasIR
    ? [
        { food: 'Яйцо куриное', g: 150 }, // ~2 eggs
        { food: 'Творог 5%', g: 150 },
        { food: 'Авокадо', g: 70 },
      ]
    : [
        { food: 'Овсянка на воде', g: 200 },
        { food: 'Яйцо куриное', g: 100 },
        { food: 'Банан', g: 120 },
      ];

  // ── Lunch suggestions ──
  const lunchOptions = [
    { food: 'Куриная грудка', g: 150 },
    { food: hasIR ? 'Гречка варёная' : 'Рис варёный', g: 150 },
    { food: 'Салат листовой', g: 100 },
    { food: 'Огурец', g: 100 },
  ];

  // ── Dinner suggestions ──
  const dinnerOptions = [
    { food: profile.conditions.includes('insulin_resistance') ? 'Лосось' : 'Треска', g: 200 },
    { food: 'Брокколи', g: 150 },
    { food: 'Помидор', g: 100 },
  ];

  // ── Snack options ──
  const snackItems = [
    { food: 'Творог 0%', g: 100 },
    { food: 'Миндаль (30г)', g: 30 },
    { food: 'Яблоко', g: 150 },
    { food: 'Кефир 1%', g: 200 },
    { food: 'Протеиновый коктейль', g: 100 },
    { food: 'Черника', g: 100 },
  ];

  function buildSuggestions(items: { food: string; g: number }[]) {
    return items
      .map(({ food, g }) => {
        const found = findFood(food);
        if (!found) return null;
        return scaleTo(found, g);
      })
      .filter(Boolean) as MealRecommendation['suggestions'];
  }

  const meals: MealRecommendation[] = [
    {
      meal: 'breakfast',
      label: '🌅 Завтрак',
      targetCalories: breakfastCal,
      targetProtein: bP,
      suggestions: buildSuggestions(breakfastOptions),
    },
    {
      meal: 'lunch',
      label: '☀️ Обед',
      targetCalories: lunchCal,
      targetProtein: lP,
      suggestions: buildSuggestions(lunchOptions),
    },
    {
      meal: 'dinner',
      label: '🌙 Ужин',
      targetCalories: dinnerCal,
      targetProtein: dP,
      suggestions: buildSuggestions(dinnerOptions),
    },
  ];

  const snacks: SnackRecommendation[] = [
    { afterMeal: 'breakfast', targetCalories: snackPerSlot, options: buildSuggestions(snackItems.slice(0, 2)) },
    { afterMeal: 'lunch', targetCalories: snackPerSlot, options: buildSuggestions(snackItems.slice(2, 4)) },
    { afterMeal: 'dinner', targetCalories: snackPerSlot, options: buildSuggestions(snackItems.slice(4, 6)) },
  ];

  // ── Exercise recommendations ──
  // Target: burn enough to create additional deficit
  const actLevel = profile.activityLevel || 'light';
  const exerciseMinTarget: Record<string, number> = {
    sedentary: 15,
    light: 25,
    moderate: 35,
    active: 45,
  };
  const minPerSlot = Math.round((exerciseMinTarget[actLevel] || 25) / 3);

  const exercises: ExerciseRecommendation[] = [
    {
      slot: 'morning',
      label: '🌅 Утро',
      exercises: [
        { name: 'Планка', minutes: Math.max(1, Math.round(minPerSlot * 0.3)), caloriesBurned: Math.round(minPerSlot * 0.3 * 8) },
        { name: 'Приседания', sets: 3, reps: Math.round(12 + (actLevel === 'active' ? 8 : actLevel === 'moderate' ? 5 : 0)), caloriesBurned: Math.round(3 * 15 * 0.5) },
      ],
      totalBurn: 0,
    },
    {
      slot: 'afternoon',
      label: '☀️ День',
      exercises: [
        { name: 'Отжимания', sets: 3, reps: Math.round(10 + (actLevel === 'active' ? 10 : actLevel === 'moderate' ? 5 : 0)), caloriesBurned: Math.round(3 * 12 * 0.5) },
        { name: 'Выпады', sets: 3, reps: Math.round(10 + (actLevel === 'active' ? 6 : actLevel === 'moderate' ? 3 : 0)), caloriesBurned: Math.round(3 * 12 * 0.5) },
      ],
      totalBurn: 0,
    },
    {
      slot: 'evening',
      label: '🌙 Вечер',
      exercises: [
        { name: 'Скручивания', sets: 3, reps: 15, caloriesBurned: Math.round(3 * 15 * 0.5) },
        { name: actLevel === 'sedentary' ? 'Прогулка' : 'Берпи', ...(actLevel === 'sedentary' ? { minutes: 15 } : { sets: 2, reps: 8 }), caloriesBurned: actLevel === 'sedentary' ? 60 : Math.round(2 * 8 * 0.5) },
      ],
      totalBurn: 0,
    },
  ];

  // Calculate total burns
  exercises.forEach(slot => {
    slot.totalBurn = slot.exercises.reduce((s, e) => s + e.caloriesBurned, 0);
  });

  const exerciseTotalBurn = exercises.reduce((s, slot) => s + slot.totalBurn, 0);

  return { totalCalories: totalCal, meals, snacks, exercises, exerciseTotalBurn };
}
