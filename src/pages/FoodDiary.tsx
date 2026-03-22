import { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';
import AgentInsightBanner from '@/components/AgentInsightBanner';
import { getTodayFood, saveDailyFood, getTodayEntry, saveEntry, calcMacroTargets, getProfile, getTodayExercises, calcBurnedCalories, calcDailyDeficit, type FoodItem, type DailyEntry } from '@/lib/storage';
import { searchFoods, type FoodDBItem } from '@/lib/foodDatabase';
import { canAccess } from '@/lib/premium';
import { generateRecommendations } from '@/lib/recommendations';
import FoodHistory from './FoodHistory';
import ExerciseTracker from '@/components/ExerciseTracker';

// Day schedule: meal → snack → exercise, repeating
const mealSlots = [
  { meal: 'breakfast' as const, label: '🌅 Завтрак', exercise: 'morning' as const },
  { meal: 'lunch' as const, label: '☀️ Обед', exercise: 'afternoon' as const },
  { meal: 'dinner' as const, label: '🌙 Ужин', exercise: 'evening' as const },
];

export default function FoodDiary() {
  const [entry, setEntry] = useState<DailyEntry>(getTodayEntry);
  const updateEntry = (patch: Partial<DailyEntry>) => {
    setEntry(prev => {
      const next = { ...prev, ...patch };
      saveEntry(next);
      return next;
    });
  };
  const entryData = entry;
  const [showHistory, setShowHistory] = useState(false);
  const [food, setFood] = useState(getTodayFood);
  const [adding, setAdding] = useState<FoodItem['meal'] | null>(null);
  const [form, setForm] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '', grams: '100' });
  const [basePer100, setBasePer100] = useState<FoodDBItem | null>(null);
  const [suggestions, setSuggestions] = useState<FoodDBItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [expandedRecs, setExpandedRecs] = useState<Record<string, boolean>>({});
  const suggestRef = useRef<HTMLDivElement>(null);

  const profile = getProfile();
  const targets = calcMacroTargets(entry.weight, entry.activity, profile);
  const recs = generateRecommendations(profile, entry.activity);

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

  const addFromRecommendation = (mealId: FoodItem['meal'], rec: { name: string; grams: number; calories: number; protein: number; carbs: number; fat: number }) => {
    const item: FoodItem = {
      id: Date.now().toString() + Math.random().toString(36).slice(2, 5),
      name: `${rec.name} (${rec.grams}г)`,
      calories: rec.calories,
      protein: rec.protein,
      carbs: rec.carbs,
      fat: rec.fat,
      meal: mealId,
    };
    save([...food.items, item]);
  };

  const remove = (id: string) => save(food.items.filter(i => i.id !== id));

  // History is now in a separate tab (HistoryDiary)

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* Macro Summary */}
      <div className="rounded-2xl bg-card border p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Дневная норма</h3>
          {canAccess('foodHistory') ? (
            <button onClick={() => setShowHistory(true)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors active:scale-95">
              <History size={14} /> История
            </button>
          ) : (
            <span className="flex items-center gap-1 text-[10px] text-status-yellow">
              <Crown size={10} /> Pro
            </span>
          )}
        </div>
        <div className="grid grid-cols-4 gap-3">
          <MacroRing label="Нетто" current={netCalories} target={targets.calories} unit="" color="var(--foreground)" />
          <MacroRing label="Белки" current={totals.p} target={targets.protein} unit="г" color="hsl(var(--status-green))" />
          <MacroRing label="Углев." current={totals.c} target={targets.carbs} unit="г" color="hsl(var(--status-yellow))" />
          <MacroRing label="Жиры" current={totals.f} target={targets.fat} unit="г" color="hsl(var(--status-red))" />
        </div>
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
      </div>

      {/* Exercise burn target */}
      <div className="rounded-2xl bg-secondary/60 p-4">
        <div className="flex items-center gap-2 mb-1">
          <Lightbulb size={14} className="text-status-yellow" />
          <span className="text-xs font-medium">Рекомендация по нагрузке</span>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Сожгите ~{recs.exerciseTotalBurn} ккал упражнениями сегодня для оптимального баланса
        </p>
      </div>

      {/* Coffee Tracker */}
      <div className="rounded-2xl bg-card border p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Coffee size={16} className="text-muted-foreground" />
            <span className="font-semibold text-sm">Кофе</span>
          </div>
          <span className="text-xs text-muted-foreground tabular-nums">{entryData.coffee} чашек</span>
        </div>
        <div className="flex gap-2">
          {[0, 1, 2, 3, 4, 5].map(n => (
            <button key={n} onClick={() => updateEntry({ coffee: n })}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 active:scale-95
                ${entryData.coffee === n ? 'bg-foreground text-background shadow-md' : 'bg-secondary text-secondary-foreground hover:bg-secondary/70'}`}>
              {n}
            </button>
          ))}
        </div>
        {entryData.coffee > 2 && (
          <p className="text-[10px] text-status-yellow mt-2">⚠️ Более 2 чашек может влиять на сон и аппетит</p>
        )}
      </div>

      {/* Interleaved: meal → recommendations → snack → exercises */}
      {mealSlots.map(({ meal, label, exercise }, slotIdx) => {
        const items = food.items.filter(i => i.meal === meal);
        const mealCal = items.reduce((s, i) => s + i.calories, 0);
        const mealRec = recs.meals.find(m => m.meal === meal);
        const snackRec = recs.snacks.find(s => s.afterMeal === meal);
        const snackItems = food.items.filter(i => i.meal === 'snack' && i.id.startsWith(`snack_${meal}`));
        const exRec = recs.exercises.find(e => e.slot === exercise);
        const recKey = `rec_${meal}`;
        const isRecExpanded = expandedRecs[recKey];

        return (
          <div key={meal} className="space-y-3">
            {/* Meal card */}
            <div className="rounded-2xl bg-card border p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold">{label}</h3>
                  {mealRec && (
                    <p className="text-[10px] text-muted-foreground tabular-nums">
                      Цель: ~{mealRec.targetCalories} ккал · Б{mealRec.targetProtein}г
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {mealCal > 0 && <span className="text-xs text-muted-foreground tabular-nums">{mealCal} ккал</span>}
                  <button
                    onClick={() => { setAdding(adding === meal ? null : meal); setForm({ name: '', calories: '', protein: '', carbs: '', fat: '', grams: '100' }); setBasePer100(null); }}
                    className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center hover:bg-secondary/70 transition-colors active:scale-95"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              {/* Recommendations toggle */}
              {mealRec && mealRec.suggestions.length > 0 && (
                <div className="mb-3">
                  <button
                    onClick={() => setExpandedRecs(prev => ({ ...prev, [recKey]: !prev[recKey] }))}
                    className="flex items-center gap-1.5 text-[11px] text-status-green font-medium active:scale-95 transition-all"
                  >
                    <Lightbulb size={12} />
                    Рекомендации
                    {isRecExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                  {isRecExpanded && (
                    <div className="mt-2 space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                      {mealRec.suggestions.map((s, i) => (
                        <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-status-green-bg">
                          <div>
                            <p className="text-xs font-medium">{s.name}</p>
                            <p className="text-[10px] text-muted-foreground tabular-nums">
                              {s.grams}г · {s.calories} ккал · Б{s.protein}
                            </p>
                          </div>
                          <button
                            onClick={() => addFromRecommendation(meal, s)}
                            className="w-7 h-7 rounded-lg bg-status-green text-white flex items-center justify-center active:scale-90 transition-all"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {items.length === 0 && adding !== meal && (
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
              {adding === meal && <AddFoodForm form={form} setForm={setForm} basePer100={basePer100} setBasePer100={setBasePer100} suggestions={suggestions} setSuggestions={setSuggestions} showSuggestions={showSuggestions} setShowSuggestions={setShowSuggestions} suggestRef={suggestRef} onAdd={addItem} onCancel={() => setAdding(null)} />}
            </div>

            {/* Snack slot */}
            <SnackSlot
              afterMeal={meal}
              snackRec={snackRec}
              food={food}
              onAddFromRec={(rec) => {
                const item: FoodItem = {
                  id: `snack_${meal}_${Date.now()}`,
                  name: `${rec.name} (${rec.grams}г)`,
                  calories: rec.calories,
                  protein: rec.protein,
                  carbs: rec.carbs,
                  fat: rec.fat,
                  meal: 'snack',
                };
                save([...food.items, item]);
              }}
              onRemove={remove}
              adding={adding}
              setAdding={setAdding}
              form={form}
              setForm={setForm}
              basePer100={basePer100}
              setBasePer100={setBasePer100}
              suggestions={suggestions}
              setSuggestions={setSuggestions}
              showSuggestions={showSuggestions}
              setShowSuggestions={setShowSuggestions}
              suggestRef={suggestRef}
              onAddCustom={() => {
                if (!form.name) return;
                const item: FoodItem = {
                  id: `snack_${meal}_${Date.now()}`,
                  name: form.name,
                  calories: Number(form.calories) || 0,
                  protein: Number(form.protein) || 0,
                  carbs: Number(form.carbs) || 0,
                  fat: Number(form.fat) || 0,
                  meal: 'snack',
                };
                save([...food.items, item]);
                setForm({ name: '', calories: '', protein: '', carbs: '', fat: '', grams: '100' });
                setBasePer100(null);
                setAdding(null);
              }}
            />

            {/* Exercise block */}
            <ExerciseTracker slot={exercise} />

            {/* Exercise recommendation */}
            {exRec && (
              <div className="rounded-xl bg-secondary/40 p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">{exRec.label} рекомендация (~{exRec.totalBurn} ккал)</p>
                <div className="space-y-1">
                  {exRec.exercises.map((ex, i) => (
                    <p key={i} className="text-xs text-muted-foreground">
                      • {ex.name}: {ex.sets && ex.reps ? `${ex.sets}×${ex.reps}` : `${ex.minutes} мин`} (~{ex.caloriesBurned} ккал)
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Snack Slot Component ──

function SnackSlot({ afterMeal, snackRec, food, onAddFromRec, onRemove, adding, setAdding, form, setForm, basePer100, setBasePer100, suggestions, setSuggestions, showSuggestions, setShowSuggestions, suggestRef, onAddCustom }: {
  afterMeal: string;
  snackRec?: { targetCalories: number; options: { name: string; grams: number; calories: number; protein: number; carbs: number; fat: number }[] };
  food: any;
  onAddFromRec: (rec: any) => void;
  onRemove: (id: string) => void;
  adding: string | null;
  setAdding: (v: any) => void;
  form: any;
  setForm: (v: any) => void;
  basePer100: any;
  setBasePer100: (v: any) => void;
  suggestions: any;
  setSuggestions: (v: any) => void;
  showSuggestions: boolean;
  setShowSuggestions: (v: boolean) => void;
  suggestRef: any;
  onAddCustom: () => void;
}) {
  const snackId = `snack_${afterMeal}` as any;
  const snackItems = food.items.filter((i: FoodItem) => i.meal === 'snack' && i.id.startsWith(`snack_${afterMeal}`));
  const snackCal = snackItems.reduce((s: number, i: FoodItem) => s + i.calories, 0);

  return (
    <div className="rounded-2xl bg-card/60 border border-dashed p-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h4 className="text-sm font-medium text-muted-foreground">🍎 Перекус</h4>
          {snackRec && <p className="text-[10px] text-muted-foreground tabular-nums">~{snackRec.targetCalories} ккал</p>}
        </div>
        <div className="flex items-center gap-2">
          {snackCal > 0 && <span className="text-[10px] text-muted-foreground tabular-nums">{snackCal} ккал</span>}
          <button
            onClick={() => { setAdding(adding === snackId ? null : snackId); setForm({ name: '', calories: '', protein: '', carbs: '', fat: '', grams: '100' }); setBasePer100(null); }}
            className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/70 transition-colors active:scale-95"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* Quick add from recommendations */}
      {snackRec && snackRec.options.length > 0 && snackItems.length === 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {snackRec.options.map((opt, i) => (
            <button key={i} onClick={() => onAddFromRec(opt)}
              className="px-2.5 py-1.5 rounded-lg bg-secondary text-[11px] font-medium active:scale-95 transition-all hover:bg-secondary/70">
              + {opt.name} ({opt.calories} ккал)
            </button>
          ))}
        </div>
      )}

      {snackItems.map((item: FoodItem) => (
        <div key={item.id} className="flex items-center justify-between py-2 border-b last:border-0">
          <div>
            <p className="text-sm font-medium">{item.name}</p>
            <p className="text-[10px] text-muted-foreground tabular-nums">{item.calories} ккал · Б{item.protein} · У{item.carbs} · Ж{item.fat}</p>
          </div>
          <button onClick={() => onRemove(item.id)} className="text-muted-foreground/40 hover:text-destructive transition-colors active:scale-95 p-1">
            <Trash2 size={14} />
          </button>
        </div>
      ))}

      {adding === snackId && <AddFoodForm form={form} setForm={setForm} basePer100={basePer100} setBasePer100={setBasePer100} suggestions={suggestions} setSuggestions={setSuggestions} showSuggestions={showSuggestions} setShowSuggestions={setShowSuggestions} suggestRef={suggestRef} onAdd={onAddCustom} onCancel={() => setAdding(null)} />}
    </div>
  );
}

// ── Reusable Add Food Form ──

function AddFoodForm({ form, setForm, basePer100, setBasePer100, suggestions, setSuggestions, showSuggestions, setShowSuggestions, suggestRef, onAdd, onCancel }: {
  form: any; setForm: any; basePer100: any; setBasePer100: any;
  suggestions: any; setSuggestions: any; showSuggestions: boolean; setShowSuggestions: any;
  suggestRef: any; onAdd: () => void; onCancel: () => void;
}) {
  return (
    <div className="mt-3 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="relative" ref={suggestRef}>
        <input
          autoFocus
          placeholder="Название блюда"
          value={form.name}
          onChange={(e: any) => {
            const v = e.target.value;
            setForm((f: any) => ({ ...f, name: v }));
            const results = searchFoods(v);
            setSuggestions(results);
            setShowSuggestions(results.length > 0);
          }}
          onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
          className="w-full bg-secondary rounded-xl px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground/50"
        />
        {showSuggestions && (
          <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-card border rounded-xl shadow-lg overflow-hidden max-h-48 overflow-y-auto">
            {suggestions.map((s: FoodDBItem, idx: number) => (
              <button key={idx}
                className="w-full text-left px-3 py-2.5 hover:bg-secondary/60 transition-colors border-b last:border-0"
                onMouseDown={(e: any) => {
                  e.preventDefault();
                  setBasePer100(s);
                  setForm({ name: s.name, grams: '100', calories: String(s.calories), protein: String(s.protein), carbs: String(s.carbs), fat: String(s.fat) });
                  setShowSuggestions(false);
                }}
              >
                <p className="text-sm font-medium">{s.name}</p>
                <p className="text-[11px] text-muted-foreground tabular-nums">{s.calories} ккал · Б{s.protein} · У{s.carbs} · Ж{s.fat}</p>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <label className="text-[10px] text-muted-foreground uppercase tracking-wide">Порция (г)</label>
          <input type="number" inputMode="numeric" value={form.grams}
            onChange={(e: any) => {
              const g = e.target.value;
              setForm((f: any) => {
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
              <button key={g}
                onClick={() => {
                  const mult = g / 100;
                  setForm((f: any) => ({
                    ...f, grams: String(g),
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
        <NumInput label="Ккал" value={form.calories} onChange={(v: string) => setForm((f: any) => ({ ...f, calories: v }))} />
        <NumInput label="Белки" value={form.protein} onChange={(v: string) => setForm((f: any) => ({ ...f, protein: v }))} />
        <NumInput label="Углев." value={form.carbs} onChange={(v: string) => setForm((f: any) => ({ ...f, carbs: v }))} />
        <NumInput label="Жиры" value={form.fat} onChange={(v: string) => setForm((f: any) => ({ ...f, fat: v }))} />
      </div>
      <div className="flex gap-2">
        <button onClick={onAdd} disabled={!form.name}
          className="flex-1 py-2.5 rounded-xl bg-foreground text-background text-sm font-medium transition-all active:scale-95 disabled:opacity-40">
          Добавить
        </button>
        <button onClick={onCancel}
          className="px-4 py-2.5 rounded-xl bg-secondary text-sm font-medium transition-all active:scale-95">
          Отмена
        </button>
      </div>
    </div>
  );
}

function NumInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</label>
      <input type="number" inputMode="numeric" value={value} onChange={e => onChange(e.target.value)}
        placeholder="0" className="w-full bg-secondary rounded-lg px-2 py-2 text-sm outline-none tabular-nums placeholder:text-muted-foreground/40" />
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
          <circle cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={offset} className="transition-all duration-500" />
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
