import { useState } from 'react';
import { Check, Dumbbell } from 'lucide-react';
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
  const items = data.items.filter(i => i.slot === slot);

  if (items.length === 0) return null;

  const toggle = (id: string) => {
    const next = {
      ...data,
      items: data.items.map(i => i.id === id ? { ...i, done: !i.done } : i),
    };
    setData(next);
    saveExercises(next);
  };

  const done = items.filter(i => i.done).length;

  return (
    <div className="rounded-2xl bg-card border p-4 shadow-sm border-dashed border-muted-foreground/20">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Dumbbell size={14} className="text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">{slotLabels[slot]}</span>
        </div>
        <span className="text-[11px] text-muted-foreground tabular-nums">{done}/{items.length}</span>
      </div>
      <ul className="space-y-1.5">
        {items.map(item => (
          <li key={item.id}>
            <button
              onClick={() => toggle(item.id)}
              className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-150 active:scale-[0.98] text-left
                ${item.done ? 'bg-status-green-bg' : 'bg-secondary hover:bg-secondary/70'}`}
            >
              <div className="flex items-center gap-2.5">
                <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-colors
                  ${item.done ? 'bg-status-green text-white' : 'border-2 border-muted-foreground/25'}`}>
                  {item.done && <Check size={12} strokeWidth={3} />}
                </div>
                <span className={`text-sm ${item.done ? 'line-through text-muted-foreground' : ''}`}>
                  {item.name}
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground tabular-nums">
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
