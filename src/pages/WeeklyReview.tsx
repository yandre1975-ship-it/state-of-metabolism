import { getEntries, getChecklist, getProfile, getTodayExercises, type DailyEntry } from '@/lib/storage';
import { getAdaptationWarnings } from '@/lib/dailyPlan';
import { TrendingDown, TrendingUp, Minus, AlertTriangle, Award, BarChart3 } from 'lucide-react';

export default function WeeklyReview() {
  const entries = getEntries();
  const profile = getProfile();
  const last7 = getLastNDays(entries, 7);
  const prev7 = getLastNDays(entries, 14).slice(0, 7);
  const warnings = getAdaptationWarnings(profile);

  const daysTracked = last7.filter(e => e.weight || e.activity > 0).length;
  const adherence = Math.round((daysTracked / 7) * 100);

  // Weight
  const weights = last7.filter(e => e.weight).map(e => e.weight!);
  const prevWeights = prev7.filter(e => e.weight).map(e => e.weight!);
  const currentAvg = weights.length > 0 ? avg(weights) : null;
  const prevAvg = prevWeights.length > 0 ? avg(prevWeights) : null;
  const weightDelta = currentAvg && prevAvg ? round(currentAvg - prevAvg, 1) : null;

  // Averages
  const avgHunger = round(avg(last7.map(e => e.hunger).filter(Boolean)), 1);
  const avgEnergy = round(avg(last7.map(e => e.energy).filter(Boolean)), 1);
  const avgActivity = Math.round(avg(last7.map(e => e.activity)));
  const proteinDays = last7.filter(e => e.protein).length;

  // Generate insight
  const insight = generateInsight(last7, weightDelta, avgHunger, avgEnergy, profile);

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      <h2 className="text-xl font-bold">📊 Обзор недели</h2>

      {/* Adherence */}
      <div className="rounded-2xl bg-card border p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Award size={18} className="text-status-green" />
            <span className="font-semibold text-sm">Приверженность</span>
          </div>
          <span className="text-2xl font-bold tabular-nums">{adherence}%</span>
        </div>
        <div className="w-full bg-secondary rounded-full h-2.5">
          <div className="bg-status-green h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${adherence}%` }} />
        </div>
        <p className="text-xs text-muted-foreground mt-2">{daysTracked} из 7 дней с данными</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Вес (средний)"
          value={currentAvg ? `${round(currentAvg, 1)} кг` : '—'}
          delta={weightDelta}
          deltaUnit="кг"
          positive={weightDelta !== null && weightDelta < 0 && profile.goal === 'lose'}
        />
        <StatCard
          label="Активность (ср.)"
          value={`${avgActivity} мин`}
          delta={null}
        />
        <StatCard
          label="Голод (ср.)"
          value={`${avgHunger}/5`}
          delta={null}
          warning={avgHunger >= 3.5}
        />
        <StatCard
          label="Энергия (ср.)"
          value={`${avgEnergy}/5`}
          delta={null}
          warning={avgEnergy <= 2.5}
        />
      </div>

      {/* Protein adherence */}
      <div className="rounded-2xl bg-card border p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">🥩 Белок в рационе</span>
          <span className="text-sm font-semibold tabular-nums">{proteinDays}/7 дней</span>
        </div>
        <div className="flex gap-1 mt-3">
          {last7.map((e, i) => (
            <div key={i} className={`flex-1 h-8 rounded-lg ${e.protein ? 'bg-status-green' : 'bg-secondary'}`} />
          ))}
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
          <span>Пн</span><span>Вт</span><span>Ср</span><span>Чт</span><span>Пт</span><span>Сб</span><span>Вс</span>
        </div>
      </div>

      {/* AI Insight */}
      <div className="rounded-2xl bg-card border p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 size={16} className="text-muted-foreground" />
          <span className="font-semibold text-sm">💡 Анализ</span>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{insight}</p>
      </div>

      {/* Adaptation Warnings */}
      {warnings.length > 0 && (
        <div className="rounded-2xl border-2 border-status-yellow/30 bg-status-yellow-bg p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-status-yellow" />
            <span className="font-semibold text-sm">Адаптация плана</span>
          </div>
          <ul className="space-y-2">
            {warnings.map((w, i) => (
              <li key={i} className="text-sm text-muted-foreground pl-4 relative before:content-['→'] before:absolute before:left-0">
                {w}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Safety */}
      <div className="rounded-2xl bg-secondary/50 p-4">
        <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
          ⚠️ AI Health Operator не заменяет медицинские консультации. При наличии симптомов обратитесь к врачу.
        </p>
      </div>
    </div>
  );
}

function StatCard({ label, value, delta, deltaUnit, positive, warning }: {
  label: string; value: string; delta: number | null; deltaUnit?: string;
  positive?: boolean; warning?: boolean;
}) {
  return (
    <div className={`rounded-2xl bg-card border p-4 shadow-sm ${warning ? 'border-status-yellow/40' : ''}`}>
      <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</span>
      <p className="text-xl font-bold tabular-nums mt-1">{value}</p>
      {delta !== null && (
        <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${positive ? 'text-status-green' : delta === 0 ? 'text-muted-foreground' : 'text-status-red'}`}>
          {delta < 0 ? <TrendingDown size={12} /> : delta > 0 ? <TrendingUp size={12} /> : <Minus size={12} />}
          <span className="tabular-nums">{delta > 0 ? '+' : ''}{delta} {deltaUnit}</span>
        </div>
      )}
    </div>
  );
}

function getLastNDays(entries: DailyEntry[], n: number): DailyEntry[] {
  const dates: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates.map(date => entries.find(e => e.date === date) || {
    date, weight: null, hunger: 0, energy: 0, coffee: 0, protein: false, activity: 0, water: 0, sleepHours: 0, sleepQuality: 3,
  });
}

function avg(arr: number[]): number {
  return arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}

function round(n: number, d: number): number {
  const f = Math.pow(10, d);
  return Math.round(n * f) / f;
}

function generateInsight(last7: DailyEntry[], weightDelta: number | null, avgHunger: number, avgEnergy: number, profile: any): string {
  const parts: string[] = [];

  if (weightDelta !== null) {
    if (weightDelta < -0.5) {
      parts.push('Отличный прогресс! Вес снижается стабильно.');
    } else if (weightDelta > 0.5) {
      parts.push('Вес увеличился за неделю. Проверьте калорийность и уровень активности.');
    } else {
      parts.push('Вес стабилен. Для снижения может потребоваться корректировка плана.');
    }
  }

  if (avgHunger >= 3.5) {
    parts.push('Основная проблема — нестабильный уровень голода. Рекомендуется увеличить белок и клетчатку.');
  }

  if (avgEnergy <= 2.5) {
    parts.push('Низкая энергия мешает следовать плану. Приоритет — качество сна и управление стрессом.');
  }

  const proteinDays = last7.filter(e => e.protein).length;
  if (proteinDays < 4) {
    parts.push('Белок присутствует менее чем в половине дней — это влияет на сытость и метаболизм.');
  }

  if (parts.length === 0) {
    parts.push('Все показатели в хорошей зоне. Продолжайте следовать текущему плану для стабильного результата.');
  }

  return parts.join(' ');
}
