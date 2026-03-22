import { useState, useEffect } from 'react';
import { getTodayEntry, saveEntry, getStatus, getInsights, type DailyEntry, type Status } from '@/lib/storage';
import { Activity, Coffee, Flame, Zap, Drumstick, Scale } from 'lucide-react';

const statusConfig: Record<Status, { bg: string; border: string; text: string; icon: string }> = {
  green: { bg: 'bg-status-green-bg', border: 'border-status-green/30', text: 'text-status-green', icon: '🔥' },
  yellow: { bg: 'bg-status-yellow-bg', border: 'border-status-yellow/30', text: 'text-status-yellow', icon: '⚠️' },
  red: { bg: 'bg-status-red-bg', border: 'border-status-red/30', text: 'text-status-red', icon: '🛑' },
};

export default function Dashboard() {
  const [entry, setEntry] = useState<DailyEntry>(getTodayEntry);

  useEffect(() => { saveEntry(entry); }, [entry]);

  const update = (patch: Partial<DailyEntry>) => setEntry(prev => ({ ...prev, ...patch }));
  const { status, message } = getStatus(entry);
  const cfg = statusConfig[status];
  const insights = getInsights(entry);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Status Card */}
      <div className={`rounded-2xl border-2 ${cfg.border} ${cfg.bg} p-6 transition-colors duration-300`}>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{cfg.icon}</span>
          <div>
            <p className={`text-xl font-semibold ${cfg.text}`}>{message}</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {status === 'green' ? 'Все показатели в норме' : status === 'red' ? 'Требуется внимание' : 'Есть что улучшить'}
            </p>
          </div>
        </div>
      </div>

      {/* Input Cards */}
      <div className="grid grid-cols-2 gap-4">
        {/* Weight */}
        <Card icon={<Scale size={18} />} label="Вес (кг)">
          <input
            type="number"
            step="0.1"
            value={entry.weight ?? ''}
            onChange={e => update({ weight: e.target.value ? Number(e.target.value) : null })}
            placeholder="—"
            className="w-full bg-transparent text-2xl font-semibold outline-none tabular-nums placeholder:text-muted-foreground/40"
          />
        </Card>

        {/* Activity */}
        <Card icon={<Activity size={18} />} label="Активность (мин)">
          <input
            type="number"
            value={entry.activity || ''}
            onChange={e => update({ activity: Math.max(0, Number(e.target.value)) })}
            placeholder="0"
            className="w-full bg-transparent text-2xl font-semibold outline-none tabular-nums placeholder:text-muted-foreground/40"
          />
        </Card>
      </div>

      {/* Hunger Slider */}
      <Card icon={<Flame size={18} />} label={`Голод: ${entry.hunger}/5`}>
        <input
          type="range" min={1} max={5} value={entry.hunger}
          onChange={e => update({ hunger: Number(e.target.value) })}
          className="w-full accent-foreground h-2 rounded-full cursor-pointer"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>Нет</span><span>Сильный</span>
        </div>
      </Card>

      {/* Energy Slider */}
      <Card icon={<Zap size={18} />} label={`Энергия: ${entry.energy}/5`}>
        <input
          type="range" min={1} max={5} value={entry.energy}
          onChange={e => update({ energy: Number(e.target.value) })}
          className="w-full accent-foreground h-2 rounded-full cursor-pointer"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>Низкая</span><span>Высокая</span>
        </div>
      </Card>

      {/* Coffee */}
      <Card icon={<Coffee size={18} />} label="Кофе">
        <div className="flex gap-2">
          {[0, 1, 2, 3].map(n => (
            <button
              key={n}
              onClick={() => update({ coffee: n })}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 active:scale-95
                ${entry.coffee === n
                  ? 'bg-foreground text-background shadow-md'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/70'}`}
            >
              {n}
            </button>
          ))}
        </div>
      </Card>

      {/* Protein */}
      <Card icon={<Drumstick size={18} />} label="Белок в рационе">
        <button
          onClick={() => update({ protein: !entry.protein })}
          className={`w-full py-3 rounded-xl text-sm font-medium transition-all duration-150 active:scale-95
            ${entry.protein
              ? 'bg-status-green text-white shadow-md'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/70'}`}
        >
          {entry.protein ? '✓ Да' : 'Нет'}
        </button>
      </Card>

      {/* Insights */}
      <div className="rounded-2xl bg-card border p-5 shadow-sm">
        <h3 className="font-semibold mb-3">💡 Рекомендации</h3>
        <ul className="space-y-2">
          {insights.map((tip, i) => (
            <li key={i} className="text-sm text-muted-foreground leading-relaxed pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-foreground/30">
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Card({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-card border p-5 shadow-sm">
      <div className="flex items-center gap-2 text-muted-foreground mb-3">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      {children}
    </div>
  );
}
