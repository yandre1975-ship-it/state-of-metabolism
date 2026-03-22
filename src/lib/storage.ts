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

const ENTRIES_KEY = 'metabolic_entries';
const CHECKLIST_KEY = 'metabolic_checklist';

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
