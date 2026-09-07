import { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Flame, Droplets, Moon, Activity, Coffee, Drumstick, Dumbbell } from 'lucide-react';
import { getAllFood, getEntries, type DailyFood, type DailyEntry, type DailyExercises } from '@/lib/storage';

const mealLabels: Record<string, string> = {
  breakfast: '🌅 Завтрак',
  lunch: '☀️ Обед',
  dinner: '🌙 Ужин',
  snack: '🍎 Перекус',
};

interface DayData {
  date: string;
  food: DailyFood | null;
  entry: DailyEntry | null;
  exercises: DailyExercises | null;
}

export default function HistoryDiary() {
  const allFood = getAllFood();
  const allEntries = getEntries();

  // Get all exercises from localStorage
  let allExercises: DailyExercises[] = [];
  try {
    allExercises = JSON.parse(localStorage.getItem('metabolic_exercises') || '[]');
  } catch {}

  // Merge all dates
  const dateSet = new Set<string>();
  allFood.forEach(f => dateSet.add(f.date));
  allEntries.forEach(e => dateSet.add(e.date));
  allExercises.forEach(e => dateSet.add(e.date));

  const days: DayData[] = Array.from(dateSet)
    .sort((a, b) => b.localeCompare(a))
    .map(date => ({
      date,
      food: allFood.find(f => f.date === date) || null,
      entry: allEntries.find(e => e.date === date) || null,
      exercises: allExercises.find(e => e.date === date) || null,
    }))
    .filter(d => d.food?.items.length || d.entry || d.exercises?.items.length);

  if (days.length === 0) {
    return (
      <div className="space-y-4 animate-in fade-in duration-500">
        <div className="flex items-center gap-2 mb-2">
          <Calendar size={18} className="text-muted-foreground" />
          <h2 className="font-semibold">История</h2>
        </div>
        <div className="rounded-2xl bg-card border p-8 shadow-sm text-center">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-muted-foreground text-sm">Пока нет записей.</p>
          <p className="text-muted-foreground text-xs mt-1">Начните вводить данные во вкладке «Сегодня»</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="flex items-center gap-2 mb-2">
        <Calendar size={18} className="text-muted-foreground" />
        <h2 className="font-semibold">История</h2>
        <span className="text-xs text-muted-foreground ml-auto">{days.length} дней</span>
      </div>

      {days.map(day => {
        const { date, food, entry, exercises } = day;
        const dateStr = formatDate(date);

        // Food totals
        const foodTotals = food?.items.reduce(
          (a, i) => ({ cal: a.cal + i.calories, p: a.p + i.protein, c: a.c + i.carbs, f: a.f + i.fat }),
          { cal: 0, p: 0, c: 0, f: 0 }
        ) || { cal: 0, p: 0, c: 0, f: 0 };

        // Exercise stats
        const doneExercises = exercises?.items.filter(i => i.done) || [];
        const exerciseCount = doneExercises.length;

        return (
          <div key={date} className="rounded-2xl bg-card border shadow-sm overflow-hidden">
            {/* Day header */}
            <div className="px-5 py-3 border-b bg-secondary/40 flex items-center justify-between">
              <span className="text-sm font-semibold">{dateStr}</span>
              {foodTotals.cal > 0 && (
                <span className="text-xs text-muted-foreground tabular-nums">
                  {foodTotals.cal} ккал
                </span>
              )}
            </div>

            <div className="p-4 space-y-3">
              {entry?.legacy && <p className="text-xs">Старая запись: значения могли быть заданы по умолчанию.</p>}
              {/* Quick stats row */}
              {entry && (
                <div className="flex flex-wrap gap-2">
                  {entry.weight != null && (
                    <StatChip icon="⚖️" value={`${entry.weight} кг`} />
                  )}
                  {entry.water != null && (
                    <StatChip icon="💧" value={`${((entry.water || 0) * 0.25).toFixed(1)} л`} />
                  )}
                  {entry.sleepHours != null && (
                    <StatChip icon="😴" value={`${entry.sleepHours} ч`} />
                  )}
                  {entry.activity != null && (
                    <StatChip icon="🏃" value={`${entry.activity} мин`} />
                  )}
                  {entry.coffee != null && (
                    <StatChip icon="☕" value={`${entry.coffee}`} />
                  )}
                  {entry.protein != null && (
                    <StatChip icon="🥩" value={entry.protein ? "Белок: Да" : "Белок: Нет"} />
                  )}
                  <StatChip icon={entry.hunger >= 4 ? '😫' : entry.hunger <= 2 ? '😊' : '😐'} value={`Голод ${entry.hunger ?? "—"}/5`} />
                  <StatChip icon={entry.energy >= 4 ? '⚡' : entry.energy <= 2 ? '😴' : '🔋'} value={`Энергия ${entry.energy ?? "—"}/5`} />
                </div>
              )}

              {/* Food items by meal */}
              {food && food.items.length > 0 && (
                <div className="space-y-2">
                  {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map(mealId => {
                    const items = food.items.filter(i => i.meal === mealId);
                    if (items.length === 0) return null;
                    const mealCal = items.reduce((s, i) => s + i.calories, 0);
                    return (
                      <div key={mealId}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-muted-foreground">{mealLabels[mealId]}</span>
                          <span className="text-[11px] text-muted-foreground tabular-nums">{mealCal} ккал</span>
                        </div>
                        {items.map(item => (
                          <div key={item.id} className="py-1.5 pl-2 border-l-2 border-border ml-1">
                            <p className="text-sm">{item.name}</p>
                            <p className="text-[11px] text-muted-foreground tabular-nums">
                              {item.calories} ккал · Б{item.protein} · У{item.carbs} · Ж{item.fat}
                            </p>
                          </div>
                        ))}
                      </div>
                    );
                  })}

                  {/* Macro summary */}
                  <div className="flex gap-3 pt-2 border-t text-[11px] text-muted-foreground tabular-nums">
                    <span>Б{Math.round(foodTotals.p)}г</span>
                    <span>У{Math.round(foodTotals.c)}г</span>
                    <span>Ж{Math.round(foodTotals.f)}г</span>
                  </div>
                </div>
              )}

              {/* Exercises */}
              {exerciseCount > 0 && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1">
                    💪 Тренировки ({exerciseCount})
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {doneExercises.map(ex => (
                      <span key={ex.id} className="px-2 py-1 rounded-lg bg-status-green-bg text-[11px] text-status-green">
                        {ex.name}
                        {ex.sets && ex.reps ? ` ${ex.sets}×${ex.reps}` : ex.minutes ? ` ${ex.minutes}мин` : ''}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StatChip({ icon, value }: { icon: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-secondary text-[11px] font-medium tabular-nums">
      <span>{icon}</span> {value}
    </span>
  );
}

function formatDate(dateStr: string): string {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (dateStr === today) return 'Сегодня';
  if (dateStr === yesterday) return 'Вчера';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', weekday: 'short' });
}
