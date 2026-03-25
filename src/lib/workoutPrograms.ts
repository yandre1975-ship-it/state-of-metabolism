export type WorkoutLevel = 'beginner' | 'intermediate' | 'advanced';

export interface WorkoutExercise {
  name: string;
  sets: number;
  reps?: number;
  seconds?: number; // for timed exercises
  restSec: number;
  caloriesBurned: number;
  tips?: string;
}

export interface WorkoutProgram {
  id: string;
  name: string;
  level: WorkoutLevel;
  category: 'fullbody' | 'upper' | 'lower' | 'core' | 'cardio' | 'stretch';
  durationMin: number;
  totalCalories: number;
  emoji: string;
  description: string;
  exercises: WorkoutExercise[];
}

export const LEVEL_META: Record<WorkoutLevel, { label: string; emoji: string; color: string }> = {
  beginner:     { label: 'Новичок',       emoji: '🟢', color: 'hsl(var(--status-green))' },
  intermediate: { label: 'Средний',       emoji: '🟡', color: 'hsl(var(--status-yellow))' },
  advanced:     { label: 'Продвинутый',   emoji: '🔴', color: 'hsl(var(--status-red))' },
};

export const CATEGORY_META: Record<string, { label: string; emoji: string }> = {
  fullbody: { label: 'Всё тело', emoji: '🏋️' },
  upper:    { label: 'Верх тела', emoji: '💪' },
  lower:    { label: 'Ноги и ягодицы', emoji: '🦵' },
  core:     { label: 'Кор и пресс', emoji: '🔥' },
  cardio:   { label: 'Кардио', emoji: '🫀' },
  stretch:  { label: 'Растяжка', emoji: '🧘' },
};

export const WORKOUT_PROGRAMS: WorkoutProgram[] = [
  // ══════════════ BEGINNER ══════════════
  {
    id: 'b-fullbody-1',
    name: 'Первые шаги',
    level: 'beginner',
    category: 'fullbody',
    durationMin: 15,
    totalCalories: 80,
    emoji: '🏋️',
    description: 'Базовая тренировка на всё тело для начинающих. Простые упражнения с минимальной нагрузкой.',
    exercises: [
      { name: 'Приседания без веса', sets: 2, reps: 10, restSec: 45, caloriesBurned: 12, tips: 'Колени не выходят за носки' },
      { name: 'Отжимания с колен', sets: 2, reps: 8, restSec: 45, caloriesBurned: 10, tips: 'Держите корпус прямым' },
      { name: 'Планка', sets: 2, seconds: 20, restSec: 30, caloriesBurned: 8, tips: 'Не прогибайте поясницу' },
      { name: 'Ягодичный мост', sets: 2, reps: 12, restSec: 30, caloriesBurned: 10, tips: 'Сжимайте ягодицы в верхней точке' },
      { name: 'Подъём на носки', sets: 2, reps: 15, restSec: 20, caloriesBurned: 6 },
    ],
  },
  {
    id: 'b-core-1',
    name: 'Крепкий центр',
    level: 'beginner',
    category: 'core',
    durationMin: 12,
    totalCalories: 60,
    emoji: '🔥',
    description: 'Мягкая тренировка пресса и кора для новичков.',
    exercises: [
      { name: 'Скручивания', sets: 2, reps: 12, restSec: 30, caloriesBurned: 10 },
      { name: 'Планка', sets: 2, seconds: 20, restSec: 30, caloriesBurned: 8 },
      { name: 'Велосипед лёжа', sets: 2, reps: 10, restSec: 30, caloriesBurned: 12, tips: 'Каждое касание = 1 повтор' },
      { name: 'Подъём таза лёжа', sets: 2, reps: 10, restSec: 30, caloriesBurned: 8 },
      { name: 'Мёртвый жук', sets: 2, reps: 8, restSec: 30, caloriesBurned: 8, tips: 'Поясница прижата к полу' },
    ],
  },
  {
    id: 'b-cardio-1',
    name: 'Лёгкое кардио',
    level: 'beginner',
    category: 'cardio',
    durationMin: 15,
    totalCalories: 90,
    emoji: '🫀',
    description: 'Низкоинтенсивное кардио без прыжков — бережёт суставы.',
    exercises: [
      { name: 'Марш на месте', sets: 3, seconds: 60, restSec: 20, caloriesBurned: 15 },
      { name: 'Шаги в сторону', sets: 3, reps: 20, restSec: 20, caloriesBurned: 12 },
      { name: 'Подъём коленей', sets: 3, reps: 15, restSec: 20, caloriesBurned: 15 },
      { name: 'Боксирование воздуха', sets: 2, seconds: 30, restSec: 15, caloriesBurned: 10 },
    ],
  },
  {
    id: 'b-stretch-1',
    name: 'Утренняя растяжка',
    level: 'beginner',
    category: 'stretch',
    durationMin: 10,
    totalCalories: 30,
    emoji: '🧘',
    description: 'Нежная растяжка на всё тело — идеально утром или перед сном.',
    exercises: [
      { name: 'Наклон к ногам стоя', sets: 1, seconds: 30, restSec: 10, caloriesBurned: 4 },
      { name: 'Кошка-корова', sets: 1, reps: 10, restSec: 10, caloriesBurned: 5 },
      { name: 'Растяжка квадрицепса', sets: 1, seconds: 30, restSec: 10, caloriesBurned: 3, tips: 'По 30 сек на каждую ногу' },
      { name: 'Повороты корпуса сидя', sets: 1, seconds: 30, restSec: 10, caloriesBurned: 4 },
      { name: 'Поза ребёнка', sets: 1, seconds: 45, restSec: 0, caloriesBurned: 3 },
    ],
  },

  // ══════════════ INTERMEDIATE ══════════════
  {
    id: 'i-fullbody-1',
    name: 'Функциональная сила',
    level: 'intermediate',
    category: 'fullbody',
    durationMin: 25,
    totalCalories: 180,
    emoji: '🏋️',
    description: 'Комплексная тренировка на всё тело. Развивает силу и выносливость.',
    exercises: [
      { name: 'Приседания', sets: 3, reps: 15, restSec: 45, caloriesBurned: 25 },
      { name: 'Отжимания', sets: 3, reps: 12, restSec: 45, caloriesBurned: 22 },
      { name: 'Выпады', sets: 3, reps: 12, restSec: 45, caloriesBurned: 25, tips: 'По 12 на каждую ногу' },
      { name: 'Тяга в наклоне (бутылки)', sets: 3, reps: 12, restSec: 45, caloriesBurned: 20, tips: 'Можно с бутылками воды' },
      { name: 'Планка', sets: 3, seconds: 40, restSec: 30, caloriesBurned: 15 },
      { name: 'Берпи', sets: 2, reps: 8, restSec: 60, caloriesBurned: 30 },
    ],
  },
  {
    id: 'i-upper-1',
    name: 'Мощный верх',
    level: 'intermediate',
    category: 'upper',
    durationMin: 20,
    totalCalories: 140,
    emoji: '💪',
    description: 'Тренировка плеч, груди, рук и спины.',
    exercises: [
      { name: 'Отжимания', sets: 3, reps: 15, restSec: 45, caloriesBurned: 25 },
      { name: 'Отжимания от скамьи (трицепс)', sets: 3, reps: 12, restSec: 40, caloriesBurned: 20 },
      { name: 'Планка с касанием плеча', sets: 3, reps: 10, restSec: 40, caloriesBurned: 18, tips: '10 касаний на каждую руку' },
      { name: 'Алмазные отжимания', sets: 2, reps: 8, restSec: 50, caloriesBurned: 18 },
      { name: 'Супермен', sets: 3, reps: 12, restSec: 30, caloriesBurned: 15 },
    ],
  },
  {
    id: 'i-lower-1',
    name: 'Стальные ноги',
    level: 'intermediate',
    category: 'lower',
    durationMin: 22,
    totalCalories: 160,
    emoji: '🦵',
    description: 'Интенсивная тренировка ног и ягодиц.',
    exercises: [
      { name: 'Приседания с паузой', sets: 3, reps: 15, restSec: 45, caloriesBurned: 28 },
      { name: 'Выпады назад', sets: 3, reps: 12, restSec: 40, caloriesBurned: 25, tips: 'По 12 на ногу' },
      { name: 'Ягодичный мост (одна нога)', sets: 3, reps: 10, restSec: 40, caloriesBurned: 20, tips: 'По 10 на ногу' },
      { name: 'Приседания сумо', sets: 3, reps: 15, restSec: 40, caloriesBurned: 25 },
      { name: 'Прыжки из приседа', sets: 2, reps: 10, restSec: 50, caloriesBurned: 22 },
    ],
  },
  {
    id: 'i-cardio-1',
    name: 'HIIT Базовый',
    level: 'intermediate',
    category: 'cardio',
    durationMin: 18,
    totalCalories: 170,
    emoji: '🫀',
    description: 'Интервальная тренировка средней интенсивности.',
    exercises: [
      { name: 'Jumping Jacks', sets: 3, seconds: 40, restSec: 20, caloriesBurned: 30 },
      { name: 'Бег на месте', sets: 3, seconds: 40, restSec: 20, caloriesBurned: 28 },
      { name: 'Скалолаз', sets: 3, reps: 20, restSec: 25, caloriesBurned: 30 },
      { name: 'Прыжки с выпадами', sets: 2, reps: 10, restSec: 30, caloriesBurned: 25 },
      { name: 'Берпи (без прыжка)', sets: 2, reps: 8, restSec: 40, caloriesBurned: 22 },
    ],
  },

  // ══════════════ ADVANCED ══════════════
  {
    id: 'a-fullbody-1',
    name: 'Тотальное разрушение',
    level: 'advanced',
    category: 'fullbody',
    durationMin: 35,
    totalCalories: 320,
    emoji: '🏋️',
    description: 'Тяжёлая тренировка для опытных. Высокая интенсивность.',
    exercises: [
      { name: 'Берпи', sets: 4, reps: 12, restSec: 45, caloriesBurned: 50 },
      { name: 'Пистолетик (приседания на одной ноге)', sets: 3, reps: 6, restSec: 60, caloriesBurned: 30, tips: 'По 6 на ногу, можно с опорой' },
      { name: 'Отжимания с хлопком', sets: 3, reps: 10, restSec: 50, caloriesBurned: 30 },
      { name: 'Прыжки из приседа', sets: 4, reps: 15, restSec: 40, caloriesBurned: 40 },
      { name: 'Планка с подъёмом ног', sets: 3, seconds: 45, restSec: 30, caloriesBurned: 20 },
      { name: 'Скалолаз (быстрый)', sets: 3, reps: 30, restSec: 30, caloriesBurned: 35 },
      { name: 'V-складка', sets: 3, reps: 12, restSec: 30, caloriesBurned: 20 },
    ],
  },
  {
    id: 'a-upper-1',
    name: 'Верх: Максимум',
    level: 'advanced',
    category: 'upper',
    durationMin: 28,
    totalCalories: 220,
    emoji: '💪',
    description: 'Продвинутая тренировка верхней части тела.',
    exercises: [
      { name: 'Отжимания узким хватом', sets: 4, reps: 15, restSec: 40, caloriesBurned: 35 },
      { name: 'Отжимания "пайк" (плечи)', sets: 3, reps: 10, restSec: 50, caloriesBurned: 25, tips: 'Ноги на возвышении' },
      { name: 'Отжимания с хлопком', sets: 3, reps: 8, restSec: 50, caloriesBurned: 25 },
      { name: 'Планка коммандос', sets: 3, reps: 12, restSec: 40, caloriesBurned: 22, tips: 'С локтей на ладони и обратно' },
      { name: 'Супермен с задержкой', sets: 3, seconds: 30, restSec: 30, caloriesBurned: 15 },
      { name: 'Бриллиантовые отжимания', sets: 3, reps: 10, restSec: 45, caloriesBurned: 25 },
    ],
  },
  {
    id: 'a-lower-1',
    name: 'Ноги: Без пощады',
    level: 'advanced',
    category: 'lower',
    durationMin: 30,
    totalCalories: 260,
    emoji: '🦵',
    description: 'Мощная нагрузка на ноги и ягодицы для продвинутых.',
    exercises: [
      { name: 'Приседания с прыжком', sets: 4, reps: 15, restSec: 40, caloriesBurned: 40 },
      { name: 'Болгарские выпады', sets: 3, reps: 12, restSec: 50, caloriesBurned: 35, tips: 'По 12 на каждую ногу' },
      { name: 'Пистолетик', sets: 3, reps: 6, restSec: 60, caloriesBurned: 25, tips: 'По 6 на ногу' },
      { name: 'Ягодичный мост (одна нога)', sets: 4, reps: 12, restSec: 35, caloriesBurned: 25 },
      { name: 'Прыжки с выпадами', sets: 3, reps: 12, restSec: 40, caloriesBurned: 30 },
      { name: 'Стенка (присед у стены)', sets: 3, seconds: 45, restSec: 30, caloriesBurned: 20 },
    ],
  },
  {
    id: 'a-cardio-1',
    name: 'HIIT Экстрим',
    level: 'advanced',
    category: 'cardio',
    durationMin: 25,
    totalCalories: 300,
    emoji: '🫀',
    description: 'Максимально интенсивная интервальная тренировка. Не для слабонервных.',
    exercises: [
      { name: 'Берпи', sets: 4, reps: 12, restSec: 30, caloriesBurned: 50 },
      { name: 'Скалолаз (быстрый)', sets: 4, seconds: 40, restSec: 20, caloriesBurned: 40 },
      { name: 'Прыжки на месте (высокие)', sets: 4, seconds: 30, restSec: 20, caloriesBurned: 35 },
      { name: 'Звёздочка (star jumps)', sets: 3, reps: 15, restSec: 25, caloriesBurned: 30 },
      { name: 'Спринт на месте', sets: 4, seconds: 30, restSec: 15, caloriesBurned: 35 },
      { name: 'Планка с прыжком ног', sets: 3, reps: 12, restSec: 30, caloriesBurned: 25 },
    ],
  },
  {
    id: 'a-core-1',
    name: 'Пресс: Железный',
    level: 'advanced',
    category: 'core',
    durationMin: 20,
    totalCalories: 160,
    emoji: '🔥',
    description: 'Жёсткая тренировка кора для опытных атлетов.',
    exercises: [
      { name: 'V-складка', sets: 4, reps: 15, restSec: 30, caloriesBurned: 25 },
      { name: 'Планка коммандос', sets: 3, reps: 14, restSec: 30, caloriesBurned: 22 },
      { name: 'Русский твист', sets: 3, reps: 20, restSec: 30, caloriesBurned: 22 },
      { name: 'Подъём ног лёжа', sets: 3, reps: 15, restSec: 30, caloriesBurned: 20 },
      { name: 'Боковая планка', sets: 2, seconds: 40, restSec: 20, caloriesBurned: 15, tips: 'По 40 сек на каждую сторону' },
      { name: 'Дровосек (без веса)', sets: 3, reps: 12, restSec: 25, caloriesBurned: 18 },
    ],
  },
];

export function getWorkoutsByLevel(level: WorkoutLevel): WorkoutProgram[] {
  return WORKOUT_PROGRAMS.filter(w => w.level === level);
}

export function getWorkoutById(id: string): WorkoutProgram | undefined {
  return WORKOUT_PROGRAMS.find(w => w.id === id);
}
