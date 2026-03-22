import { getAllFood, type DailyFood } from '@/lib/storage';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

const mealLabels: Record<string, string> = {
  breakfast: '🌅 Завтрак',
  lunch: '☀️ Обед',
  dinner: '🌙 Ужин',
  snack: '🍎 Перекус',
};

export default function FoodHistory({ onBack }: { onBack: () => void }) {
  const allFood = getAllFood().filter(d => d.items.length > 0);

  if (allFood.length === 0) {
    return (
      <div className="space-y-4 animate-in fade-in duration-500">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors active:scale-95">
          <ChevronLeft size={16} /> Назад
        </button>
        <div className="rounded-2xl bg-card border p-8 shadow-sm text-center">
          <p className="text-muted-foreground">Пока нет записей. Начните добавлять еду во вкладке «Еда».</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors active:scale-95">
        <ChevronLeft size={16} /> Назад
      </button>

      {allFood.map(day => {
        const totals = day.items.reduce(
          (a, i) => ({ cal: a.cal + i.calories, p: a.p + i.protein, c: a.c + i.carbs, f: a.f + i.fat }),
          { cal: 0, p: 0, c: 0, f: 0 }
        );
        const dateStr = formatDate(day.date);

        return (
          <div key={day.date} className="rounded-2xl bg-card border shadow-sm overflow-hidden">
            {/* Day header */}
            <div className="px-5 py-3 border-b bg-secondary/40 flex items-center justify-between">
              <span className="text-sm font-semibold">{dateStr}</span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {totals.cal} ккал · Б{Math.round(totals.p)} · У{Math.round(totals.c)} · Ж{Math.round(totals.f)}
              </span>
            </div>

            {/* Meals */}
            <div className="p-5 space-y-3">
              {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map(mealId => {
                const items = day.items.filter(i => i.meal === mealId);
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
            </div>
          </div>
        );
      })}
    </div>
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
