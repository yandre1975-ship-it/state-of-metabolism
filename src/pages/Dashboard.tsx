import { useState, useEffect } from 'react';
import { getTodayEntry, saveEntry, getStatus, getInsights, getProfile, type DailyEntry, type Status } from '@/lib/storage';
import { generateDailyPlan, getAdaptationWarnings } from '@/lib/dailyPlan';
import { Activity, Coffee, Flame, Zap, Drumstick, Scale, Target, AlertTriangle, Droplets } from 'lucide-react';

const statusConfig: Record<Status, { bg: string; border: string; text: string; icon: string }> = {
  green: { bg: 'bg-status-green-bg', border: 'border-status-green/30', text: 'text-status-green', icon: '🔥' },
  yellow: { bg: 'bg-status-yellow-bg', border: 'border-status-yellow/30', text: 'text-status-yellow', icon: '⚠️' },
  red: { bg: 'bg-status-red-bg', border: 'border-status-red/30', text: 'text-status-red', icon: '🛑' },
};

export default function Dashboard() {
  const [entry, setEntry] = useState<DailyEntry>(getTodayEntry);
  const profile = getProfile();

  useEffect(() => { saveEntry(entry); }, [entry]);

  const update = (patch: Partial<DailyEntry>) => setEntry(prev => ({ ...prev, ...patch }));
  const { status, message } = getStatus(entry);
  const cfg = statusConfig[status];
  const plan = generateDailyPlan(entry, profile);
  const warnings = getAdaptationWarnings(profile);

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      {/* Greeting */}
      {profile.name && (
        <p className="text-muted-foreground text-sm">Привет, <span className="font-semibold text-foreground">{profile.name}</span> 👋</p>
      )}

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

      {/* Input Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card icon={<Scale size={16} />} label="Вес (кг)">
          <input
            type="number" step="0.1"
            value={entry.weight ?? ''}
            onChange={e => update({ weight: e.target.value ? Number(e.target.value) : null })}
            placeholder="—"
            className="w-full bg-transparent text-2xl font-semibold outline-none tabular-nums placeholder:text-muted-foreground/40"
          />
        </Card>
        <Card icon={<Activity size={16} />} label="Активность (мин)">
          <input
            type="number"
            value={entry.activity || ''}
            onChange={e => update({ activity: Math.max(0, Number(e.target.value)) })}
            placeholder="0"
            className="w-full bg-transparent text-2xl font-semibold outline-none tabular-nums placeholder:text-muted-foreground/40"
          />
        </Card>
      </div>

      {/* Hunger */}
      <Card icon={<Flame size={16} />} label={`Голод: ${entry.hunger}/5`}>
        <input type="range" min={1} max={5} value={entry.hunger}
          onChange={e => update({ hunger: Number(e.target.value) })}
          className="w-full accent-foreground h-2 rounded-full cursor-pointer" />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>Нет</span><span>Сильный</span>
        </div>
      </Card>

      {/* Energy */}
      <Card icon={<Zap size={16} />} label={`Энергия: ${entry.energy}/5`}>
        <input type="range" min={1} max={5} value={entry.energy}
          onChange={e => update({ energy: Number(e.target.value) })}
          className="w-full accent-foreground h-2 rounded-full cursor-pointer" />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>Низкая</span><span>Высокая</span>
        </div>
      </Card>

      {/* Coffee */}
      <Card icon={<Coffee size={16} />} label="Кофе">
        <div className="flex gap-2">
          {[0, 1, 2, 3].map(n => (
            <button key={n} onClick={() => update({ coffee: n })}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 active:scale-95
                ${entry.coffee === n ? 'bg-foreground text-background shadow-md' : 'bg-secondary text-secondary-foreground hover:bg-secondary/70'}`}>
              {n}
            </button>
          ))}
        </div>
      </Card>

      {/* Protein */}
      <Card icon={<Drumstick size={16} />} label="Белок в рационе">
        <button onClick={() => update({ protein: !entry.protein })}
          className={`w-full py-3 rounded-xl text-sm font-medium transition-all duration-150 active:scale-95
            ${entry.protein ? 'bg-status-green text-white shadow-md' : 'bg-secondary text-secondary-foreground hover:bg-secondary/70'}`}>
          {entry.protein ? '✓ Да' : 'Нет'}
        </button>
      </Card>

      {/* Water Tracker */}
      {(() => {
        const waterNorm = Math.round((profile.weight || 75) * 30 / 250); // 30ml per kg, 250ml per glass
        const glasses = entry.water || 0;
        const pct = Math.min(100, Math.round((glasses / waterNorm) * 100));
        return (
          <Card icon={<Droplets size={16} />} label={`Вода: ${glasses} / ${waterNorm} стаканов`}>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <button onClick={() => update({ water: Math.max(0, glasses - 1) })}
                  className="w-10 h-10 rounded-xl bg-secondary text-secondary-foreground font-bold text-lg transition-all active:scale-95 hover:bg-secondary/70">−</button>
                <div className="flex-1">
                  <div className="h-3 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${pct}%`, backgroundColor: pct >= 100 ? 'hsl(var(--status-green))' : pct >= 60 ? 'hsl(var(--status-yellow))' : 'hsl(210, 80%, 55%)' }} />
                  </div>
                </div>
                <button onClick={() => update({ water: glasses + 1 })}
                  className="w-10 h-10 rounded-xl bg-secondary text-secondary-foreground font-bold text-lg transition-all active:scale-95 hover:bg-secondary/70">+</button>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                {pct >= 100 ? '✅ Норма выполнена!' : `Рекомендация: ${waterNorm} стаканов (${Math.round((profile.weight || 75) * 30 / 1000)} л) в день`}
              </p>
            </div>
          </Card>
        );
      })()}

      {/* Safety */}
      <div className="rounded-2xl bg-secondary/50 p-4">
        <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
          ⚠️ Не является медицинской рекомендацией. При наличии симптомов обратитесь к врачу.
        </p>
      </div>
    </div>
  );
}

function Card({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-card border p-4 shadow-sm">
      <div className="flex items-center gap-2 text-muted-foreground mb-3">
        {icon}
        <span className="text-[10px] font-medium uppercase tracking-wide">{label}</span>
      </div>
      {children}
    </div>
  );
}
