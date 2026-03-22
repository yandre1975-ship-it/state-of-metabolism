import { useState, useRef } from 'react';
import { Plus, Trash2, History } from 'lucide-react';
import { getTodayFood, saveDailyFood, getTodayEntry, calcMacroTargets, getProfile, getTodayExercises, calcBurnedCalories, calcDailyDeficit, type FoodItem } from '@/lib/storage';
import { searchFoods, type FoodDBItem } from '@/lib/foodDatabase';
import FoodHistory from './FoodHistory';
import ExerciseTracker from '@/components/ExerciseTracker';

// Day schedule: meal → exercise block pairs
const daySchedule = [
  { meal: { id: 'breakfast' as const, label: '🌅 Завтрак' }, exercise: 'morning' as const },
  { meal: { id: 'lunch' as const, label: '☀️ Обед' }, exercise: 'afternoon' as const },
  { meal: { id: 'dinner' as const, label: '🌙 Ужин' }, exercise: 'evening' as const },
  { meal: { id: 'snack' as const, label: '🍎 Перекус' }, exercise: null },
];

export default function FoodDiary() {
  const entry = getTodayEntry();
  const [showHistory, setShowHistory] = useState(false);
  const [food, setFood] = useState(getTodayFood);
  const [adding, setAdding] = useState<FoodItem['meal'] | null>(null);
  const [form, setForm] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '', grams: '100' });
  // Store the "per 100g" base when a DB item is selected, so we can recalculate
  const [basePer100, setBasePer100] = useState<FoodDBItem | null>(null);
  const [suggestions, setSuggestions] = useState<FoodDBItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestRef = useRef<HTMLDivElement>(null);

  const profile = getProfile();
  const targets = calcMacroTargets(entry.weight, entry.activity, profile);

  const exercises = getTodayExercises();
  const burned = Math.round(calcBurnedCalories(exercises));

  const totals = food.items.reduce(
    (acc, i) => ({ cal: acc.cal + i.calories, p: acc.p + i.protein, c: acc.c + i.carbs, f: acc.f + i.fat }),
    { cal: 0, p: 0, c: 0, f: 0 }
  );

  const netCalories = totals.cal - burned;

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
    setForm({ name: '', calories: '', protein: '', carbs: '', fat: '', grams: '100' });
    setBasePer100(null);
    setAdding(null);
  };

  const remove = (id: string) => save(food.items.filter(i => i.id !== id));

  if (showHistory) return <FoodHistory onBack={() => setShowHistory(false)} />;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Macro Summary */}
      <div className="rounded-2xl bg-card border p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Дневная норма</h3>
          <button
            onClick={() => setShowHistory(true)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors active:scale-95"
          >
            <History size={14} /> История
          </button>
        </div>
        <div className="grid grid-cols-4 gap-3">
          <MacroRing label="Нетто" current={netCalories} target={targets.calories} unit="" color="var(--foreground)" />
          <MacroRing label="Белки" current={totals.p} target={targets.protein} unit="г" color="hsl(var(--status-green))" />
          <MacroRing label="Углев." current={totals.c} target={targets.carbs} unit="г" color="hsl(var(--status-yellow))" />
          <MacroRing label="Жиры" current={totals.f} target={targets.fat} unit="г" color="hsl(var(--status-red))" />
        </div>
        {/* Calorie breakdown */}
        <div className="flex items-center justify-center gap-4 mt-3 text-[11px] text-muted-foreground tabular-nums">
          <span>Съедено: {totals.cal} ккал</span>
          <span>—</span>
          <span className="text-status-green">Сожжено: {burned} ккал</span>
        </div>
        {(() => {
          const deficit = calcDailyDeficit(profile);
          if (!deficit) return null;
          return (
            <div className="mt-3 p-3 rounded-xl bg-secondary text-center">
              <p className="text-[11px] text-muted-foreground">Для цели нужен дефицит</p>
              <p className="text-lg font-bold tabular-nums">{deficit.dailyDeficit} <span className="text-xs font-normal text-muted-foreground">ккал/день</span></p>
              <p className="text-[11px] text-muted-foreground">{deficit.kgToLose} кг за {deficit.daysLeft} дней</p>
            </div>
          );
        })()}
        {!entry.weight && (
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Укажите вес на вкладке «Сегодня» для точного расчёта
          </p>
        )}
      </div>

      {/* Interleaved meals & exercises */}
      {daySchedule.map(({ meal, exercise }) => {
        const items = food.items.filter(i => i.meal === meal.id);
        const mealCal = items.reduce((s, i) => s + i.calories, 0);
        return (
          <div key={meal.id} className="space-y-3">
            {/* Meal card */}
            <div className="rounded-2xl bg-card border p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">{meal.label}</h3>
                <div className="flex items-center gap-3">
                  {mealCal > 0 && <span className="text-xs text-muted-foreground tabular-nums">{mealCal} ккал</span>}
                  <button
                    onClick={() => { setAdding(adding === meal.id ? null : meal.id); setForm({ name: '', calories: '', protein: '', carbs: '', fat: '', grams: '100' }); setBasePer100(null); }}
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
                  <div className="relative" ref={suggestRef}>
                    <input
                      autoFocus
                      placeholder="Название блюда"
                      value={form.name}
                      onChange={e => {
                        const v = e.target.value;
                        setForm(f => ({ ...f, name: v }));
                        const results = searchFoods(v);
                        setSuggestions(results);
                        setShowSuggestions(results.length > 0);
                      }}
                      onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                      className="w-full bg-secondary rounded-xl px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground/50"
                    />
                    {showSuggestions && (
                      <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-card border rounded-xl shadow-lg overflow-hidden max-h-48 overflow-y-auto">
                        {suggestions.map((s, idx) => (
                          <button
                            key={idx}
                            className="w-full text-left px-3 py-2.5 hover:bg-secondary/60 transition-colors border-b last:border-0"
                            onMouseDown={e => {
                              e.preventDefault();
                              setBasePer100(s);
                              setForm({
                                name: s.name,
                                grams: '100',
                                calories: String(s.calories),
                                protein: String(s.protein),
                                carbs: String(s.carbs),
                                fat: String(s.fat),
                              });
                              setShowSuggestions(false);
                            }}
                          >
                            <p className="text-sm font-medium">{s.name}</p>
                            <p className="text-[11px] text-muted-foreground tabular-nums">
                              {s.calories} ккал · Б{s.protein} · У{s.carbs} · Ж{s.fat}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Portion weight */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <label className="text-[10px] text-muted-foreground uppercase tracking-wide">Порция (г)</label>
                      <input
                        type="number"
                        inputMode="numeric"
                        value={form.grams}
                        onChange={e => {
                          const g = e.target.value;
                          setForm(f => {
                            const next = { ...f, grams: g };
                            if (basePer100 && g) {
                              const mult = Number(g) / 100;
                              next.calories = String(Math.round(basePer100.calories * mult));
                              next.protein = String(Math.round(basePer100.protein * mult * 10) / 10);
                              next.carbs = String(Math.round(basePer100.carbs * mult * 10) / 10);
                              next.fat = String(Math.round(basePer100.fat * mult * 10) / 10);
                            }
                            return next;
                          });
                        }}
                        placeholder="100"
                        className="w-full bg-secondary rounded-lg px-2 py-2 text-sm outline-none tabular-nums placeholder:text-muted-foreground/40"
                      />
                    </div>
                    {basePer100 && (
                      <div className="flex gap-1 mt-4">
                        {[50, 100, 150, 200].map(g => (
                          <button
                            key={g}
                            onClick={() => {
                              const mult = g / 100;
                              setForm(f => ({
                                ...f,
                                grams: String(g),
                                calories: String(Math.round(basePer100.calories * mult)),
                                protein: String(Math.round(basePer100.protein * mult * 10) / 10),
                                carbs: String(Math.round(basePer100.carbs * mult * 10) / 10),
                                fat: String(Math.round(basePer100.fat * mult * 10) / 10),
                              }));
                            }}
                            className={`px-2 py-1.5 rounded-lg text-[11px] font-medium transition-all active:scale-95
                              ${form.grams === String(g) ? 'bg-foreground text-background' : 'bg-secondary text-secondary-foreground'}`}
                          >
                            {g}г
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
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

            {/* Exercise block after this meal */}
            {exercise && <ExerciseTracker slot={exercise} />}
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
