import { useState } from 'react';
import { Check, Dumbbell } from 'lucide-react';
import { getTodayExercises, saveExercises, type ExerciseEntry } from '@/lib/storage';

export default function ExerciseTracker() {
  const [data, setData] = useState(getTodayExercises);

  const toggle = (id: string) => {
    const next = {
      ...data,
      items: data.items.map(i => i.id === id ? { ...i, done: !i.done } : i),
    };
    setData(next);
    saveExercises(next);
  };

  const done = data.items.filter(i => i.done).length;

  return (
    <div className="rounded-2xl bg-card border p-5 shadow-sm">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Dumbbell size={16} className="text-muted-foreground" />
          <h3 className="font-semibold">Тренировка</h3>
        </div>
        <span className="text-sm text-muted-foreground tabular-nums">{done}/{data.items.length}</span>
      </div>
      <div className="w-full bg-secondary rounded-full h-1.5 mb-4">
        <div
          className="bg-status-green h-1.5 rounded-full transition-all duration-300"
          style={{ width: `${(done / data.items.length) * 100}%` }}
        />
      </div>
      <ul className="space-y-2">
        {data.items.map(item => (
          <li key={item.id}>
            <button
              onClick={() => toggle(item.id)}
              className={`w-full flex items-center justify-between p-3.5 rounded-xl transition-all duration-150 active:scale-[0.98] text-left
                ${item.done ? 'bg-status-green-bg' : 'bg-secondary hover:bg-secondary/70'}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors
                  ${item.done ? 'bg-status-green text-white' : 'border-2 border-muted-foreground/30'}`}>
                  {item.done && <Check size={14} strokeWidth={3} />}
                </div>
                <span className={`text-sm ${item.done ? 'line-through text-muted-foreground' : ''}`}>
                  {item.name}
                </span>
              </div>
              <span className="text-xs text-muted-foreground tabular-nums">
                {item.sets && item.reps && `${item.sets}×${item.reps}`}
                {item.minutes && `${item.minutes} мин`}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
