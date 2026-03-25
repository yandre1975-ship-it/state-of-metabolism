import { useState } from 'react';
import { ChevronRight, Clock, Flame, Dumbbell, Check, Plus, ArrowLeft } from 'lucide-react';
import { WORKOUT_PROGRAMS, LEVEL_META, CATEGORY_META, type WorkoutLevel, type WorkoutProgram } from '@/lib/workoutPrograms';
import { getTodayExercises, saveExercises, type ExerciseEntry } from '@/lib/storage';
import { toast } from 'sonner';

const levels: WorkoutLevel[] = ['beginner', 'intermediate', 'advanced'];

export default function WorkoutPrograms() {
  const [selectedLevel, setSelectedLevel] = useState<WorkoutLevel>('beginner');
  const [activeWorkout, setActiveWorkout] = useState<WorkoutProgram | null>(null);

  if (activeWorkout) {
    return <WorkoutDetail workout={activeWorkout} onBack={() => setActiveWorkout(null)} />;
  }

  const filtered = WORKOUT_PROGRAMS.filter(w => w.level === selectedLevel);

  return (
    <div className="space-y-5 animate-fade-up">
      <div>
        <h2 className="text-lg font-bold mb-1 gradient-text">Программы тренировок</h2>
        <p className="text-xs text-muted-foreground">Выберите уровень и тренировку</p>
      </div>

      {/* Level selector */}
      <div className="flex gap-2">
        {levels.map(lvl => {
          const meta = LEVEL_META[lvl];
          const isActive = selectedLevel === lvl;
          return (
            <button
              key={lvl}
              onClick={() => setSelectedLevel(lvl)}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all duration-300 active:scale-95
                ${isActive ? 'gradient-accent text-white shadow-lg shadow-[hsl(250_90%_60%/0.25)]' : 'glass-card hover:border-[hsl(250_90%_60%/0.3)]'}`}
            >
              <span className="mr-1">{meta.emoji}</span> {meta.label}
            </button>
          );
        })}
      </div>

      {/* Workout cards */}
      <div className="space-y-3">
        {filtered.map(w => {
          const catMeta = CATEGORY_META[w.category];
          return (
            <button
              key={w.id}
              onClick={() => setActiveWorkout(w)}
              className="w-full text-left rounded-2xl glass-card p-4 hover:border-[hsl(250_90%_60%/0.3)] transition-all active:scale-[0.98]"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xl">{catMeta?.emoji || w.emoji}</span>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{w.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{catMeta?.label} · {w.exercises.length} упр.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Clock size={10} /> {w.durationMin} мин
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Flame size={10} /> {w.totalCalories} ккал
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground/50" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{w.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WorkoutDetail({ workout, onBack }: { workout: WorkoutProgram; onBack: () => void }) {
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const levelMeta = LEVEL_META[workout.level];
  const catMeta = CATEGORY_META[workout.category];

  const toggleExercise = (idx: number) => {
    setCompleted(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const addToToday = () => {
    const exercises = getTodayExercises();
    const slotMap: Record<number, 'morning' | 'afternoon' | 'evening'> = {};
    workout.exercises.forEach((ex, i) => {
      const slot = i < workout.exercises.length / 3 ? 'morning' : i < (workout.exercises.length * 2) / 3 ? 'afternoon' : 'evening';
      slotMap[i] = slot;
    });

    const newItems: ExerciseEntry[] = workout.exercises.map((ex, i) => ({
      id: `wp-${Date.now()}-${i}`,
      name: ex.name,
      reps: ex.reps,
      sets: ex.sets,
      minutes: ex.seconds ? Math.round(ex.seconds / 60 * 10) / 10 : undefined,
      done: completed.has(i),
      slot: slotMap[i],
    }));

    saveExercises({ ...exercises, items: [...exercises.items, ...newItems] });
    toast.success(`"${workout.name}" добавлена в дневник`);
  };

  const doneCount = completed.size;
  const totalBurned = workout.exercises
    .filter((_, i) => completed.has(i))
    .reduce((s, e) => s + e.caloriesBurned, 0);

  return (
    <div className="space-y-4 animate-fade-up">
      {/* Header */}
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors active:scale-95">
        <ArrowLeft size={16} /> Назад
      </button>

      <div className="rounded-2xl glass-card p-5">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">{catMeta?.emoji || workout.emoji}</span>
          <div>
            <h2 className="font-bold text-base">{workout.name}</h2>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
              <span style={{ color: levelMeta.color }}>{levelMeta.emoji} {levelMeta.label}</span>
              <span>·</span>
              <span><Clock size={10} className="inline" /> {workout.durationMin} мин</span>
              <span>·</span>
              <span><Flame size={10} className="inline" /> {workout.totalCalories} ккал</span>
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{workout.description}</p>
      </div>

      {/* Progress */}
      <div className="rounded-xl glass-card p-3 flex items-center justify-between">
        <span className="text-xs font-medium">Прогресс: {doneCount}/{workout.exercises.length}</span>
        <span className="text-xs text-muted-foreground tabular-nums">🔥 {totalBurned} ккал</span>
      </div>

      {/* Exercises */}
      <ul className="space-y-2">
        {workout.exercises.map((ex, i) => {
          const isDone = completed.has(i);
          return (
            <li key={i}>
              <button
                onClick={() => toggleExercise(i)}
                className={`w-full text-left p-3.5 rounded-2xl transition-all duration-300 active:scale-[0.98]
                  ${isDone ? 'gradient-accent text-white shadow-lg shadow-[hsl(250_90%_60%/0.25)]' : 'glass-card hover:border-[hsl(250_90%_60%/0.3)]'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-colors
                    ${isDone ? 'bg-white/20' : 'border-2 border-muted-foreground/25'}`}>
                    {isDone && <Check size={12} strokeWidth={3} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${isDone ? 'line-through text-muted-foreground' : ''}`}>
                      {ex.name}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                      <span>{ex.sets} подх.</span>
                      {ex.reps && <span>× {ex.reps} повт.</span>}
                      {ex.seconds && <span>× {ex.seconds} сек</span>}
                      <span className="text-muted-foreground/50">|</span>
                      <span>отдых {ex.restSec}с</span>
                    </div>
                    {ex.tips && (
                      <p className="text-[10px] text-muted-foreground/70 mt-1">💡 {ex.tips}</p>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground tabular-nums flex-shrink-0">
                    {ex.caloriesBurned} ккал
                  </span>
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      {/* Add to today button */}
      <button
        onClick={addToToday}
        className="w-full py-3 rounded-2xl gradient-accent text-white text-sm font-semibold transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-[hsl(250_90%_60%/0.25)]"
      >
        <Plus size={16} /> Добавить в дневник
      </button>
    </div>
  );
}
