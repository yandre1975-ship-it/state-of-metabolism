import { getTodayEntry, getStatus, getProfile, getTodayFood, getTodayExercises, calcBurnedCalories, calcMacroTargets, type Status } from '@/lib/storage';
import { generateDailyPlan, getAdaptationWarnings } from '@/lib/dailyPlan';
import { Target, AlertTriangle, TrendingUp } from 'lucide-react';
import AgentInsightBanner from '@/components/AgentInsightBanner';

const statusConfig: Record<Status, { bg: string; border: string; text: string; icon: string }> = {
  green: { bg: 'bg-status-green-bg', border: 'border-status-green/30', text: 'text-status-green', icon: '🔥' },
  yellow: { bg: 'bg-status-yellow-bg', border: 'border-status-yellow/30', text: 'text-status-yellow', icon: '⚠️' },
  red: { bg: 'bg-status-red-bg', border: 'border-status-red/30', text: 'text-status-red', icon: '🛑' },
};

export default function Dashboard() {
  const entry = getTodayEntry();
  const profile = getProfile();
  const { status, message } = getStatus(entry);
  const cfg = statusConfig[status];
  const plan = generateDailyPlan(entry, profile);
  const warnings = getAdaptationWarnings(profile);

  // Today's food & exercise summary
  const food = getTodayFood();
  const exercises = getTodayExercises();
  const burned = Math.round(calcBurnedCalories(exercises));
  const targets = calcMacroTargets(entry.weight, entry.activity, profile);
  const foodTotals = food.items.reduce(
    (a, i) => ({ cal: a.cal + i.calories, p: a.p + i.protein, c: a.c + i.carbs, f: a.f + i.fat }),
    { cal: 0, p: 0, c: 0, f: 0 }
  );
  const doneExercises = exercises.items.filter(i => i.done).length;
  const waterLiters = ((entry.water || 0) * 0.25).toFixed(1);
  const waterNormL = ((Math.round((profile.weight || 75) * 30)) / 1000).toFixed(1);

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      {/* Greeting */}
      {profile.name && (
        <p className="text-muted-foreground text-sm">Привет, <span className="font-semibold text-foreground">{profile.name}</span> 👋</p>
      )}

      {/* AI Agent Insights */}
      <AgentInsightBanner tab="dashboard" />

      {/* Status Card */}
      <div className={`rounded-2xl border-2 ${cfg.border} ${cfg.bg} p-5 transition-colors duration-300`}>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{cfg.icon}</span>
          <div>
            <p className={`text-lg font-semibold ${cfg.text}`}>{message}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {status === 'green' ? 'Все показатели в норме' : status === 'red' ? 'Требуется внимание' : 'Есть что улучшить'}
            </p>
          </div>
        </div>
      </div>

      {/* Today's Progress Summary */}
      <div className="rounded-2xl bg-card border p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={16} className="text-foreground" />
          <h3 className="font-semibold text-sm">Прогресс сегодня</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <ProgressChip label="Калории" value={`${foodTotals.cal} / ${targets.calories}`} unit="ккал" pct={Math.min(100, Math.round(foodTotals.cal / targets.calories * 100))} />
          <ProgressChip label="Белки" value={`${Math.round(foodTotals.p)} / ${targets.protein}`} unit="г" pct={Math.min(100, Math.round(foodTotals.p / targets.protein * 100))} />
          <ProgressChip label="Вода" value={`${waterLiters} / ${waterNormL}`} unit="л" pct={Math.min(100, Math.round(parseFloat(waterLiters) / parseFloat(waterNormL) * 100))} />
          <ProgressChip label="Сожжено" value={String(burned)} unit="ккал" pct={Math.min(100, Math.round(burned / 300 * 100))} />
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {entry.weight && <ReadChip icon="⚖️" text={`${entry.weight} кг`} />}
          {(entry.sleepHours || 0) > 0 && <ReadChip icon="😴" text={`${entry.sleepHours} ч сна`} />}
          {(entry.activity || 0) > 0 && <ReadChip icon="🏃" text={`${entry.activity} мин`} />}
          {(entry.coffee || 0) > 0 && <ReadChip icon="☕" text={`${entry.coffee} чашек`} />}
          {entry.protein && <ReadChip icon="🥩" text="Белок ✓" />}
          <ReadChip icon={entry.hunger >= 4 ? '😫' : '😊'} text={`Голод ${entry.hunger}/5`} />
          <ReadChip icon={entry.energy >= 4 ? '⚡' : '🔋'} text={`Энергия ${entry.energy}/5`} />
          {doneExercises > 0 && <ReadChip icon="💪" text={`${doneExercises} упр.`} />}
        </div>
      </div>

      {/* Daily Plan */}
      <div className="rounded-2xl bg-card border p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Target size={16} className="text-foreground" />
          <h3 className="font-semibold text-sm">План на сегодня</h3>
        </div>
        <ul className="space-y-2">
          {plan.actions.map((action, i) => (
            <li key={i} className="text-sm leading-relaxed p-3 rounded-xl bg-secondary">
              {action}
            </li>
          ))}
        </ul>
        {plan.risk && (
          <div className="mt-3 flex items-start gap-2 p-3 rounded-xl bg-status-red-bg">
            <AlertTriangle size={14} className="text-status-red flex-shrink-0 mt-0.5" />
            <p className="text-xs text-status-red">{plan.risk}</p>
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-3 leading-relaxed">💡 {plan.insight}</p>
      </div>

      {/* Adaptation Warnings */}
      {warnings.length > 0 && (
        <div className="rounded-2xl border border-status-yellow/30 bg-status-yellow-bg p-4">
          <p className="text-xs font-medium text-status-yellow mb-2">🔄 Адаптация</p>
          {warnings.map((w, i) => (
            <p key={i} className="text-xs text-muted-foreground">{w}</p>
          ))}
        </div>
      )}

      {/* Safety */}
      <div className="rounded-2xl bg-secondary/50 p-4">
        <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
          ⚠️ Не является медицинской рекомендацией. При наличии симптомов обратитесь к врачу.
        </p>
      </div>
    </div>
  );
}

function ProgressChip({ label, value, unit, pct }: { label: string; value: string; unit: string; pct: number }) {
  return (
    <div className="rounded-xl bg-secondary p-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</span>
        <span className="text-[10px] text-muted-foreground tabular-nums">{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-background/60 overflow-hidden mb-1.5">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            backgroundColor: pct >= 80 ? 'hsl(var(--status-green))' : pct >= 40 ? 'hsl(var(--status-yellow))' : 'hsl(var(--muted-foreground))',
          }}
        />
      </div>
      <p className="text-xs font-medium tabular-nums">{value} <span className="text-muted-foreground font-normal">{unit}</span></p>
    </div>
  );
}

function ReadChip({ icon, text }: { icon: string; text: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-secondary text-[11px] font-medium tabular-nums">
      <span>{icon}</span> {text}
    </span>
  );
}
