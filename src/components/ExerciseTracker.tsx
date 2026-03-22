import { useState } from 'react';
import { Check, Dumbbell, Plus, Trash2, Minus, ChevronUp, ChevronDown, Pencil } from 'lucide-react';
import { getTodayExercises, saveExercises, type ExerciseEntry } from '@/lib/storage';

interface Props {
  slot: 'morning' | 'afternoon' | 'evening';
}

const slotLabels = {
  morning: '💪 Утренняя разминка',
  afternoon: '💪 Дневная тренировка',
  evening: '💪 Вечерняя тренировка',
};

export default function ExerciseTracker({ slot }: Props) {
  const [data, setData] = useState(getTodayExercises);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', reps: '', sets: '', minutes: '' });

  const items = data.items.filter(i => i.slot === slot);

  const persist = (next: typeof data) => {
    setData(next);
    saveExercises(next);
  };

  const toggle = (id: string) => {
    persist({ ...data, items: data.items.map(i => i.id === id ? { ...i, done: !i.done } : i) });
  };

  const remove = (id: string) => {
    persist({ ...data, items: data.items.filter(i => i.id !== id) });
    if (editingId === id) setEditingId(null);
  };

  const adjustSets = (id: string, delta: number) => {
    persist({
      ...data,
      items: data.items.map(i =>
        i.id === id && i.sets ? { ...i, sets: Math.max(1, i.sets + delta) } : i
      ),
    });
  };

  const adjustReps = (id: string, delta: number) => {
    persist({
      ...data,
      items: data.items.map(i =>
        i.id === id && i.reps ? { ...i, reps: Math.max(1, i.reps + delta) } : i
      ),
    });
  };

  const adjustMinutes = (id: string, delta: number) => {
    persist({
      ...data,
      items: data.items.map(i =>
        i.id === id && i.minutes != null ? { ...i, minutes: Math.max(0.5, (i.minutes || 1) + delta) } : i
      ),
    });
  };

  const addExercise = () => {
    if (!form.name.trim()) return;
    const newItem: ExerciseEntry = {
      id: Date.now().toString(),
      name: form.name.trim(),
      reps: form.reps ? Number(form.reps) : undefined,
      sets: form.sets ? Number(form.sets) : undefined,
      minutes: form.minutes ? Number(form.minutes) : undefined,
      done: false,
      slot,
    };
    persist({ ...data, items: [...data.items, newItem] });
    setForm({ name: '', reps: '', sets: '', minutes: '' });
    setAdding(false);
  };

  const done = items.filter(i => i.done).length;

  return (
    <div className="rounded-2xl bg-card border p-4 shadow-sm border-dashed border-muted-foreground/20">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Dumbbell size={14} className="text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">{slotLabels[slot]}</span>
        </div>
        <div className="flex items-center gap-2">
          {items.length > 0 && (
            <span className="text-[11px] text-muted-foreground tabular-nums">{done}/{items.length}</span>
          )}
          <button
            onClick={() => { setAdding(!adding); setForm({ name: '', reps: '', sets: '', minutes: '' }); }}
            className="w-6 h-6 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/70 transition-colors active:scale-95"
          >
            <Plus size={12} />
          </button>
        </div>
      </div>

      {items.length === 0 && !adding && (
        <p className="text-xs text-muted-foreground/50 py-1">Нажмите + чтобы добавить упражнение</p>
      )}

      <ul className="space-y-1.5">
        {items.map(item => (
          <li key={item.id}>
            <div
              className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-150 text-left
                ${item.done ? 'bg-status-green-bg' : 'bg-secondary'}`}
            >
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <button
                  onClick={() => toggle(item.id)}
                  className="flex-shrink-0 active:scale-95"
                >
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors
                    ${item.done ? 'bg-status-green text-white' : 'border-2 border-muted-foreground/25'}`}>
                    {item.done && <Check size={12} strokeWidth={3} />}
                  </div>
                </button>
                <span className={`text-sm truncate ${item.done ? 'line-through text-muted-foreground' : ''}`}>
                  {item.name}
                </span>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                {/* Inline adjuster for sets×reps */}
                {item.sets && item.reps && (
                  <div className="flex items-center gap-0.5">
                    <button onClick={() => adjustSets(item.id, -1)} className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground hover:bg-background/60 active:scale-90">
                      <Minus size={10} />
                    </button>
                    <span className="text-[11px] tabular-nums min-w-[32px] text-center text-muted-foreground">
                      {item.sets}×{item.reps}
                    </span>
                    <button onClick={() => adjustSets(item.id, 1)} className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground hover:bg-background/60 active:scale-90">
                      <Plus size={10} />
                    </button>
                  </div>
                )}
                {item.minutes != null && !item.sets && (
                  <div className="flex items-center gap-0.5">
                    <button onClick={() => adjustMinutes(item.id, -0.5)} className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground hover:bg-background/60 active:scale-90">
                      <Minus size={10} />
                    </button>
                    <span className="text-[11px] tabular-nums min-w-[28px] text-center text-muted-foreground">
                      {item.minutes} мин
                    </span>
                    <button onClick={() => adjustMinutes(item.id, 0.5)} className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground hover:bg-background/60 active:scale-90">
                      <Plus size={10} />
                    </button>
                  </div>
                )}
                <button onClick={() => remove(item.id)} className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground/30 hover:text-destructive transition-colors active:scale-90 ml-1">
                  <Trash2 size={11} />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* Add exercise form */}
      {adding && (
        <div className="mt-3 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <input
            autoFocus
            placeholder="Название упражнения"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="w-full bg-secondary rounded-xl px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground/50"
          />
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wide">Подходы</label>
              <input type="number" inputMode="numeric" value={form.sets} onChange={e => setForm(f => ({ ...f, sets: e.target.value }))}
                placeholder="3" className="w-full bg-secondary rounded-lg px-2 py-2 text-sm outline-none tabular-nums placeholder:text-muted-foreground/40" />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wide">Повторы</label>
              <input type="number" inputMode="numeric" value={form.reps} onChange={e => setForm(f => ({ ...f, reps: e.target.value }))}
                placeholder="15" className="w-full bg-secondary rounded-lg px-2 py-2 text-sm outline-none tabular-nums placeholder:text-muted-foreground/40" />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wide">Минуты</label>
              <input type="number" inputMode="numeric" value={form.minutes} onChange={e => setForm(f => ({ ...f, minutes: e.target.value }))}
                placeholder="—" className="w-full bg-secondary rounded-lg px-2 py-2 text-sm outline-none tabular-nums placeholder:text-muted-foreground/40" />
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground">Укажите подходы+повторы или минуты</p>
          <div className="flex gap-2">
            <button onClick={addExercise} disabled={!form.name.trim()}
              className="flex-1 py-2 rounded-xl bg-foreground text-background text-sm font-medium transition-all active:scale-95 disabled:opacity-40">
              Добавить
            </button>
            <button onClick={() => setAdding(false)}
              className="px-4 py-2 rounded-xl bg-secondary text-sm font-medium transition-all active:scale-95">
              Отмена
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
