import { getTodayEntry, getStatus, getProfile, getTodayFood, getTodayExercises, calcBurnedCalories, calcMacroTargets, getEntries, type Status } from '@/lib/storage';
import { generateDailyPlan, getAdaptationWarnings } from '@/lib/dailyPlan';
import { Target, AlertTriangle, TrendingUp, Sparkles, Zap } from 'lucide-react';
import AgentInsightBanner from '@/components/AgentInsightBanner';

const WEEKDAYS_RU = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
const MONTHS_RU = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

const MOTIVATIONS = [
  'Каждый день — это новый шанс стать лучшей версией себя 💪',
  'Маленькие шаги каждый день приводят к большим результатам 🚀',
  'Ты уже сильнее, чем вчера. Продолжай! 🔥',
  'Дисциплина — это мост между целями и результатами 🌉',
  'Твоё тело — твой главный проект. Инвестируй в него 🏗️',
  'Не сравнивай себя с другими. Сравнивай с собой вчерашним 📈',
  'Успех — это сумма маленьких усилий, повторяемых каждый день ✨',
  'Сегодня — идеальный день, чтобы начать действовать 🎯',
  'Здоровье — это не пункт назначения, а путешествие 🌿',
  'Ты можешь больше, чем думаешь. Поверь в себя! 🌟',
  'Каждое повторение, каждый шаг — это инвестиция в будущее 💎',
  'Привычки формируют характер. Характер формирует судьбу 🧭',
  'Не жди идеального момента. Создай его сам 🛠️',
  'Прогресс, а не совершенство — вот что важно 📊',
  'Твоё здоровье — это капитал, который окупится сторицей 🏆',
];

function getMotivation(): string {
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
  return MOTIVATIONS[dayOfYear % MOTIVATIONS.length];
}

function getStreak(): number {
  const entries = getEntries();
  if (entries.length === 0) return 1;
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
  const today = new Date().toISOString().slice(0, 10);
  let streak = 0;
  const d = new Date();
  for (let i = 0; i < 365; i++) {
    const dateStr = d.toISOString().slice(0, 10);
    if (sorted.find(e => e.date === dateStr)) {
      streak++;
    } else if (dateStr !== today) {
      break;
    } else {
      streak++;
      d.setDate(d.getDate() - 1);
      continue;
    }
    d.setDate(d.getDate() - 1);
  }
  return Math.max(1, streak);
}

const statusConfig: Record<Status, { gradient: string; text: string; icon: string; label: string }> = {
  unknown: { gradient: 'from-slate-500 to-slate-600', text: 'text-white', icon: '📝', label: 'Заполните или проверьте дневник' },
  green: { gradient: 'from-[hsl(152_60%_42%)] to-[hsl(170_60%_45%)]', text: 'text-white', icon: '🔥', label: 'Наблюдения, не медицинская оценка' },
  yellow: { gradient: 'from-[hsl(40_90%_50%)] to-[hsl(30_90%_55%)]', text: 'text-white', icon: '⚠️', label: 'Наблюдения, не медицинская оценка' },
  red: { gradient: 'from-[hsl(0_72%_51%)] to-[hsl(350_70%_55%)]', text: 'text-white', icon: '🛑', label: 'Требуется внимание' },
};

export default function Dashboard() {
  const entry = getTodayEntry();
  const profile = getProfile();
  const { status, message } = getStatus(entry);
  const cfg = statusConfig[status];
  const plan = generateDailyPlan(entry, profile);
  const warnings = getAdaptationWarnings(profile);

  const food = getTodayFood();
  const exercises = getTodayExercises();
  const burned = Math.round(calcBurnedCalories(exercises));
  const targets = calcMacroTargets(entry.weight, entry.activity, profile);
  const foodTotals = food.items.reduce(
    (a, i) => ({ cal: a.cal + i.calories, p: a.p + i.protein, c: a.c + i.carbs, f: a.f + i.fat }),
    { cal: 0, p: 0, c: 0, f: 0 }
  );
  const doneExercises = exercises.items.filter(i => i.done).length;
  const waterLiters = (entry.water == null ? "—" : (entry.water * 0.25).toFixed(1));
  const waterNormL = ((Math.round((profile.weight || 75) * 30)) / 1000).toFixed(1);

  return (
    <div className="space-y-5 animate-fade-up">
      {/* Greeting */}
      <div className="rounded-2xl glass-card p-5 space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center shadow-md shadow-[hsl(250_90%_60%/0.2)]">
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold">
              Привет{profile.name ? `, ${profile.name}` : ''} 👋
            </p>
            <p className="text-xs text-muted-foreground">
              Сегодня {WEEKDAYS_RU[new Date().getDay()]}, {new Date().getDate()} {MONTHS_RU[new Date().getMonth()]} — <span className="font-semibold gradient-text">{getStreak()}-й день</span>
            </p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground/80 italic leading-relaxed">{getMotivation()}</p>
      </div>

      <AgentInsightBanner tab="dashboard" />

      {/* Status Card */}
      <div className={`rounded-2xl bg-gradient-to-r ${cfg.gradient} p-5 shadow-lg transition-all duration-300`}>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{cfg.icon}</span>
          <div>
            <p className={`text-lg font-bold ${cfg.text}`}>{message}</p>
            <p className={`text-xs ${cfg.text} opacity-80 mt-0.5`}>{cfg.label}</p>
          </div>
        </div>
      </div>

      {/* Today's Progress */}
      <div className="rounded-2xl glass-card p-5 animate-fade-up-delay">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg gradient-accent-soft flex items-center justify-center">
            <TrendingUp size={16} className="text-[hsl(250_90%_60%)]" />
          </div>
          <h3 className="font-bold text-sm">Прогресс сегодня</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <ProgressChip label="Калории" value={`${food.items.length ? foodTotals.cal : "—"} / ${targets.calories}`} unit="ккал" pct={food.items.length === 0 ? null : Math.min(100, Math.round(foodTotals.cal / targets.calories * 100))} />
          <ProgressChip label="Белки" value={`${food.items.length ? Math.round(foodTotals.p) : "—"} / ${targets.protein}`} unit="г" pct={food.items.length === 0 ? null : Math.min(100, Math.round(foodTotals.p / targets.protein * 100))} />
          <ProgressChip label="Вода" value={`${waterLiters} / ${waterNormL}`} unit="л" pct={entry.water == null ? null : Math.min(100, Math.round(parseFloat(waterLiters) / parseFloat(waterNormL) * 100))} />
          <ProgressChip label="Сожжено" value={String(burned)} unit="ккал" pct={Math.min(100, Math.round(burned / 300 * 100))} />
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {entry.weight != null && <ReadChip icon="⚖️" text={`${entry.weight} кг`} />}
          {entry.sleepHours != null && <ReadChip icon="😴" text={`${entry.sleepHours} ч сна`} />}
          {entry.activity != null && <ReadChip icon="🏃" text={`${entry.activity} мин`} />}
          {entry.coffee != null && <ReadChip icon="☕" text={`${entry.coffee} чашек`} />}
          <ReadChip icon="🥩" text={`Белок: ${entry.protein == null ? "—" : entry.protein ? "Да" : "Нет"}`} />
          <ReadChip icon={entry.hunger >= 4 ? '😫' : '😊'} text={`Голод ${entry.hunger ?? "—"}/5`} />
          <ReadChip icon={entry.energy >= 4 ? '⚡' : '🔋'} text={`Энергия ${entry.energy ?? "—"}/5`} />
          {doneExercises > 0 && <ReadChip icon="💪" text={`${doneExercises} упр.`} />}
        </div>
      </div>

      {/* Daily Plan */}
      <div className="rounded-2xl glass-card p-5 animate-fade-up-delay">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg gradient-accent-soft flex items-center justify-center">
            <Target size={16} className="text-[hsl(250_90%_60%)]" />
          </div>
          <h3 className="font-bold text-sm">План на сегодня</h3>
        </div>
        <ul className="space-y-2">
          {plan.actions.map((action, i) => (
            <li key={i} className="text-sm leading-relaxed p-3 rounded-xl glass-card">
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
        <div className="rounded-2xl glass-card border-[hsl(40_90%_50%/0.3)] bg-status-yellow-bg/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={14} className="text-status-yellow" />
            <p className="text-xs font-semibold text-status-yellow">Адаптация</p>
          </div>
          {warnings.map((w, i) => (
            <p key={i} className="text-xs text-muted-foreground">{w}</p>
          ))}
        </div>
      )}

      {/* Safety */}
      <div className="rounded-2xl glass-card p-4">
        <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
          ⚠️ Не является медицинской рекомендацией. При наличии симптомов обратитесь к врачу.
        </p>
      </div>
    </div>
  );
}

function ProgressChip({ label, value, unit, pct }: { label: string; value: string; unit: string; pct: number | null }) {
  return (
    <div className="rounded-xl glass-card p-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{label}</span>
        <span className="text-[10px] text-muted-foreground tabular-nums">{pct == null ? "—" : `${pct ?? 0}%`}</span>
      </div>
      <div className="h-1.5 rounded-full bg-border/50 overflow-hidden mb-1.5">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${pct ?? 0}%`,
            background: pct >= 80
              ? 'linear-gradient(90deg, hsl(152 60% 42%), hsl(170 60% 45%))'
              : pct >= 40
              ? 'linear-gradient(90deg, hsl(40 90% 50%), hsl(30 90% 55%))'
              : 'linear-gradient(135deg, hsl(250 90% 60%), hsl(190 95% 50%))',
          }}
        />
      </div>
      <p className="text-xs font-semibold tabular-nums">{value} <span className="text-muted-foreground font-normal">{unit}</span></p>
    </div>
  );
}

function ReadChip({ icon, text }: { icon: string; text: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg glass-card text-[11px] font-medium tabular-nums">
      <span>{icon}</span> {text}
    </span>
  );
}
