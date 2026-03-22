import { useState, useRef, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { getTodayFood, saveDailyFood, getTodayEntry, calcMacroTargets, type FoodItem } from '@/lib/storage';
import { searchFoods, type FoodDBItem } from '@/lib/foodDatabase';

const meals = [
  { id: 'breakfast' as const, label: '🌅 Завтрак' },
  { id: 'lunch' as const, label: '☀️ Обед' },
  { id: 'dinner' as const, label: '🌙 Ужин' },
  { id: 'snack' as const, label: '🍎 Перекус' },
];

export default function FoodDiary() {
  const entry = getTodayEntry();
  const [food, setFood] = useState(getTodayFood);
  const [adding, setAdding] = useState<FoodItem['meal'] | null>(null);
  const [form, setForm] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '' });

  const targets = calcMacroTargets(entry.weight, entry.activity);

  const totals = food.items.reduce(
    (acc, i) => ({ cal: acc.cal + i.calories, p: acc.p + i.protein, c: acc.c + i.carbs, f: acc.f + i.fat }),
    { cal: 0, p: 0, c: 0, f: 0 }
  );

  const save = (items: FoodItem[]) => {
    const next = { ...food, items };
    setFood(next);
    saveDailyFood(next);
  };

  const addItem = () => {
    if (!adding || !form.name) return;
    const item: FoodItem = {
      id: Date.now().toString(),
      name: form.name,
      calories: Number(form.calories) || 0,
      protein: Number(form.protein) || 0,
      carbs: Number(form.carbs) || 0,
      fat: Number(form.fat) || 0,
      meal: adding,
    };
    save([...food.items, item]);
    setForm({ name: '', calories: '', protein: '', carbs: '', fat: '' });
    setAdding(null);
  };

  const remove = (id: string) => save(food.items.filter(i => i.id !== id));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Macro Summary */}
      <div className="rounded-2xl bg-card border p-5 shadow-sm">
        <h3 className="font-semibold mb-4">Дневная норма</h3>
        <div className="grid grid-cols-4 gap-3">
          <MacroRing label="Ккал" current={totals.cal} target={targets.calories} unit="" color="var(--foreground)" />
          <MacroRing label="Белки" current={totals.p} target={targets.protein} unit="г" color="hsl(var(--status-green))" />
          <MacroRing label="Углев." current={totals.c} target={targets.carbs} unit="г" color="hsl(var(--status-yellow))" />
          <MacroRing label="Жиры" current={totals.f} target={targets.fat} unit="г" color="hsl(var(--status-red))" />
        </div>
        {!entry.weight && (
          <p className="text-xs text-muted-foreground mt-3 text-center">
            Укажите вес на вкладке «Сегодня» для точного расчёта
          </p>
        )}
      </div>

      {/* Meals */}
      {meals.map(meal => {
        const items = food.items.filter(i => i.meal === meal.id);
        const mealCal = items.reduce((s, i) => s + i.calories, 0);
        return (
          <div key={meal.id} className="rounded-2xl bg-card border p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">{meal.label}</h3>
              <div className="flex items-center gap-3">
                {mealCal > 0 && <span className="text-xs text-muted-foreground tabular-nums">{mealCal} ккал</span>}
                <button
                  onClick={() => { setAdding(adding === meal.id ? null : meal.id); setForm({ name: '', calories: '', protein: '', carbs: '', fat: '' }); }}
                  className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center hover:bg-secondary/70 transition-colors active:scale-95"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {items.length === 0 && adding !== meal.id && (
              <p className="text-sm text-muted-foreground/50">Пока пусто</p>
            )}

            {items.map(item => (
              <div key={item.id} className="flex items-center justify-between py-2.5 border-b last:border-0">
                <div>
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {item.calories} ккал · Б{item.protein} · У{item.carbs} · Ж{item.fat}
                  </p>
                </div>
                <button onClick={() => remove(item.id)} className="text-muted-foreground/40 hover:text-destructive transition-colors active:scale-95 p-1">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}

            {/* Add form */}
            {adding === meal.id && (
              <div className="mt-3 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                <input
                  autoFocus
                  placeholder="Название блюда"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full bg-secondary rounded-xl px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground/50"
                />
                <div className="grid grid-cols-4 gap-2">
                  <NumInput label="Ккал" value={form.calories} onChange={v => setForm(f => ({ ...f, calories: v }))} />
                  <NumInput label="Белки" value={form.protein} onChange={v => setForm(f => ({ ...f, protein: v }))} />
                  <NumInput label="Углев." value={form.carbs} onChange={v => setForm(f => ({ ...f, carbs: v }))} />
                  <NumInput label="Жиры" value={form.fat} onChange={v => setForm(f => ({ ...f, fat: v }))} />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={addItem}
                    disabled={!form.name}
                    className="flex-1 py-2.5 rounded-xl bg-foreground text-background text-sm font-medium transition-all active:scale-95 disabled:opacity-40"
                  >
                    Добавить
                  </button>
                  <button
                    onClick={() => setAdding(null)}
                    className="px-4 py-2.5 rounded-xl bg-secondary text-sm font-medium transition-all active:scale-95"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function NumInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</label>
      <input
        type="number"
        inputMode="numeric"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="0"
        className="w-full bg-secondary rounded-lg px-2 py-2 text-sm outline-none tabular-nums placeholder:text-muted-foreground/40"
      />
    </div>
  );
}

function MacroRing({ label, current, target, unit, color }: {
  label: string; current: number; target: number; unit: string; color: string;
}) {
  const pct = Math.min((current / target) * 100, 100);
  const r = 28;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-16 h-16">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r={r} fill="none" stroke="hsl(var(--border))" strokeWidth="4" />
          <circle
            cx="32" cy="32" r={r} fill="none"
            stroke={color} strokeWidth="4" strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={offset}
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-semibold tabular-nums">{current}</span>
        </div>
      </div>
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <span className="text-[10px] text-muted-foreground tabular-nums">/ {target}{unit}</span>
    </div>
  );
}
