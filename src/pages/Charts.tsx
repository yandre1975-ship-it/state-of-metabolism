import { getEntries, getProfile, type DailyEntry } from '@/lib/storage';
import { canAccess } from '@/lib/premium';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingDown, Target, Crown } from 'lucide-react';

export default function Charts() {
  const allEntries = getEntries();
  const profile = getProfile();

  // Last 7 days for hunger/energy
  const last7 = getLast7DaysData(allEntries);

  // Weight progress data (all entries with weight)
  const weightEntries = allEntries.filter(e => e.weight !== null && e.weight !== undefined);
  const targetWeight = profile.targetWeight;
  const targetDate = profile.targetDate;

  // Build weight progress chart data with trend line
  const { progressData, trendLine, forecastDate } = buildWeightProgress(weightEntries, targetWeight, targetDate);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Weight Progress to Goal */}
      {targetWeight && weightEntries.length >= 1 && canAccess('weightForecast') && (
        <WeightProgressCard
          data={progressData}
          trendLine={trendLine}
          targetWeight={targetWeight}
          targetDate={targetDate}
          forecastDate={forecastDate}
          currentWeight={weightEntries[weightEntries.length - 1]?.weight || profile.weight}
        />
      )}
      {targetWeight && weightEntries.length >= 1 && !canAccess('weightForecast') && (
        <div className="rounded-2xl border-2 border-dashed border-status-yellow/30 p-6 flex items-center justify-center gap-3">
          <Crown size={16} className="text-status-yellow" />
          <span className="text-sm text-muted-foreground">Прогноз веса доступен в Pro</span>
        </div>
      )}

      {/* Standard charts */}
      <ChartCard title="Вес (7 дней)" dataKey="weight" data={last7} color="hsl(220, 20%, 16%)" unit=" кг" />
      <ChartCard title="Голод" dataKey="hunger" data={last7} color="hsl(0, 72%, 51%)" domain={[1, 5]} />
      <ChartCard title="Энергия" dataKey="energy" data={last7} color="hsl(152, 60%, 42%)" domain={[1, 5]} />
    </div>
  );
}

function getLast7DaysData(entries: DailyEntry[]) {
  const dates: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates.map(date => {
    const e = entries.find(x => x.date === date);
    return {
      date: date.slice(5),
      weight: e?.weight ?? null,
      hunger: e?.hunger || null,
      energy: e?.energy || null,
    };
  });
}

function linearRegression(points: { x: number; y: number }[]) {
  const n = points.length;
  if (n < 2) return null;
  let sx = 0, sy = 0, sxy = 0, sxx = 0;
  for (const p of points) {
    sx += p.x; sy += p.y; sxy += p.x * p.y; sxx += p.x * p.x;
  }
  const denom = n * sxx - sx * sx;
  if (denom === 0) return null;
  const slope = (n * sxy - sx * sy) / denom;
  const intercept = (sy - slope * sx) / n;
  return { slope, intercept };
}

function buildWeightProgress(
  entries: DailyEntry[],
  targetWeight?: number,
  targetDate?: string
) {
  if (entries.length === 0) return { progressData: [], trendLine: null, forecastDate: null };

  const firstDate = new Date(entries[0].date);
  const points = entries.map(e => ({
    x: Math.round((new Date(e.date).getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)),
    y: e.weight!,
  }));

  const reg = linearRegression(points);

  // Build chart data from entries
  const progressData = entries.map(e => ({
    date: e.date.slice(5),
    fullDate: e.date,
    weight: e.weight,
    trend: reg
      ? Math.round((reg.intercept + reg.slope * Math.round((new Date(e.date).getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24))) * 10) / 10
      : null,
  }));

  // Forecast: when will trend hit targetWeight?
  let forecastDate: string | null = null;
  if (reg && targetWeight && reg.slope < 0) {
    const daysToTarget = (targetWeight - reg.intercept) / reg.slope;
    if (daysToTarget > 0 && daysToTarget < 365 * 2) {
      const fd = new Date(firstDate);
      fd.setDate(fd.getDate() + Math.round(daysToTarget));
      forecastDate = fd.toISOString().slice(0, 10);

      // Add forecast point to chart
      progressData.push({
        date: fd.toISOString().slice(5, 10),
        fullDate: fd.toISOString().slice(0, 10),
        weight: null as any,
        trend: targetWeight,
      });
    }
  }

  // Extend trend line a bit into future if no forecast yet
  if (reg && !forecastDate && entries.length >= 2) {
    const lastEntry = entries[entries.length - 1];
    const lastDay = Math.round((new Date(lastEntry.date).getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));
    for (let d = 1; d <= 7; d++) {
      const futureDay = lastDay + d;
      const futureDate = new Date(firstDate);
      futureDate.setDate(futureDate.getDate() + futureDay);
      progressData.push({
        date: futureDate.toISOString().slice(5, 10),
        fullDate: futureDate.toISOString().slice(0, 10),
        weight: null as any,
        trend: Math.round((reg.intercept + reg.slope * futureDay) * 10) / 10,
      });
    }
  }

  return { progressData, trendLine: reg, forecastDate };
}

function WeightProgressCard({
  data, targetWeight, targetDate, forecastDate, currentWeight,
}: {
  data: any[]; trendLine: any; targetWeight: number; targetDate?: string;
  forecastDate: string | null; currentWeight: number;
}) {
  const remaining = Math.round((currentWeight - targetWeight) * 10) / 10;
  const weights = data.map(d => d.weight).filter(Boolean);
  const trends = data.map(d => d.trend).filter(Boolean);
  const allValues = [...weights, ...trends, targetWeight];
  const minY = Math.floor(Math.min(...allValues) - 1);
  const maxY = Math.ceil(Math.max(...allValues) + 1);

  return (
    <div className="rounded-2xl bg-card border p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <Target size={18} className="text-status-green" />
        <h3 className="font-semibold">Прогресс к цели</h3>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 mb-4 mt-3">
        <div className="text-center p-2 rounded-xl bg-secondary">
          <p className="text-lg font-bold tabular-nums">{currentWeight}</p>
          <p className="text-[10px] text-muted-foreground">сейчас, кг</p>
        </div>
        <div className="text-center p-2 rounded-xl bg-secondary">
          <p className="text-lg font-bold tabular-nums text-status-green">{targetWeight}</p>
          <p className="text-[10px] text-muted-foreground">цель, кг</p>
        </div>
        <div className="text-center p-2 rounded-xl bg-secondary">
          <p className="text-lg font-bold tabular-nums">{remaining > 0 ? remaining : '✓'}</p>
          <p className="text-[10px] text-muted-foreground">{remaining > 0 ? 'осталось, кг' : 'цель достигнута'}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 18%, 89%)" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(215, 12%, 50%)" />
            <YAxis domain={[minY, maxY]} tick={{ fontSize: 11 }} stroke="hsl(215, 12%, 50%)" width={40} />
            <Tooltip
              formatter={(v: number, name: string) => [
                `${v} кг`,
                name === 'weight' ? 'Факт' : 'Тренд',
              ]}
              contentStyle={{ borderRadius: 12, border: '1px solid hsl(214, 18%, 89%)', fontSize: 13 }}
            />
            <ReferenceLine
              y={targetWeight}
              stroke="hsl(152, 60%, 42%)"
              strokeDasharray="6 4"
              strokeWidth={2}
              label={{ value: `Цель: ${targetWeight} кг`, position: 'right', fontSize: 11, fill: 'hsl(152, 60%, 42%)' }}
            />
            <Line
              type="monotone" dataKey="weight" stroke="hsl(220, 20%, 16%)"
              strokeWidth={2.5} dot={{ r: 4, fill: 'hsl(220, 20%, 16%)' }} connectNulls
              name="weight"
            />
            <Line
              type="monotone" dataKey="trend" stroke="hsl(220, 60%, 55%)"
              strokeWidth={2} strokeDasharray="5 3" dot={false} connectNulls
              name="trend"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Forecast info */}
      {forecastDate && (
        <div className="mt-3 flex items-center gap-2 p-3 rounded-xl bg-status-green-bg">
          <TrendingDown size={16} className="text-status-green flex-shrink-0" />
          <p className="text-sm">
            По текущему тренду цель будет достигнута <span className="font-semibold">{formatDate(forecastDate)}</span>
            {targetDate && (
              <span className="text-muted-foreground">
                {' '}(план: {formatDate(targetDate)})
              </span>
            )}
          </p>
        </div>
      )}
      {!forecastDate && remaining > 0 && (
        <p className="mt-3 text-xs text-muted-foreground text-center">
          Недостаточно данных для прогноза — продолжайте вносить вес ежедневно
        </p>
      )}
    </div>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
}

function ChartCard({ title, dataKey, data, color, unit = '', domain }: {
  title: string; dataKey: string; data: any[]; color: string; unit?: string; domain?: [number, number];
}) {
  return (
    <div className="rounded-2xl bg-card border p-5 shadow-sm">
      <h3 className="font-semibold mb-4">{title}</h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 18%, 89%)" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(215, 12%, 50%)" />
            <YAxis domain={domain || ['auto', 'auto']} tick={{ fontSize: 12 }} stroke="hsl(215, 12%, 50%)" width={40} />
            <Tooltip
              formatter={(v: number) => [`${v}${unit}`, title]}
              contentStyle={{ borderRadius: 12, border: '1px solid hsl(214, 18%, 89%)', fontSize: 13 }}
            />
            <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2.5} dot={{ r: 4, fill: color }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
