import { useState, useEffect } from 'react';
import { getTodayEntry, saveEntry, getStatus, getInsights, getProfile, type DailyEntry, type Status } from '@/lib/storage';
import { generateDailyPlan, getAdaptationWarnings } from '@/lib/dailyPlan';
import { Activity, Coffee, Flame, Zap, Drumstick, Scale, Target, AlertTriangle, Droplets, Moon } from 'lucide-react';
import AgentInsightBanner from '@/components/AgentInsightBanner';

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
        const waterNormMl = Math.round((profile.weight || 75) * 30);
        const waterNormL = (waterNormMl / 1000).toFixed(1);
        const waterNormGlasses = Math.round(waterNormMl / 250);
        const glasses = entry.water || 0;
        const liters = (glasses * 250 / 1000);
        const pct = Math.min(100, Math.round((glasses / waterNormGlasses) * 100));
        return (
          <Card icon={<Droplets size={16} />} label={`Вода: ${liters.toFixed(1)} л / ${waterNormL} л`}>
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
              <div className="flex items-center justify-center gap-2">
                <span className="text-xs text-muted-foreground">или введите литры:</span>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={liters > 0 ? liters.toFixed(1) : ''}
                  placeholder="0.0"
                  onChange={e => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val) && val >= 0) {
                      update({ water: Math.round(val * 1000 / 250) });
                    } else if (e.target.value === '') {
                      update({ water: 0 });
                    }
                  }}
                  className="w-16 bg-secondary text-center text-sm font-medium rounded-lg py-1 outline-none focus:ring-2 focus:ring-ring tabular-nums"
                />
                <span className="text-xs text-muted-foreground">л</span>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                {pct >= 100 ? '✅ Норма выполнена!' : `Рекомендация: ${waterNormL} л (${waterNormGlasses} стаканов) в день`}
              </p>
            </div>
          </Card>
        );
      })()}

      {/* Sleep Tracker */}
      {(() => {
        const hours = entry.sleepHours || 0;
        const quality = entry.sleepQuality || 3;
        const qualityLabels = ['', '😫 Ужасно', '😕 Плохо', '😐 Нормально', '😊 Хорошо', '😴 Отлично'];
        const getSleepTip = () => {
          if (hours === 0) return '💤 Введите количество часов сна';
          if (hours < 6) return '⚠️ Недосып повышает кортизол и усиливает голод. Старайтесь спать 7–8 часов.';
          if (hours < 7) return '💡 Почти норма! Попробуйте ложиться на 30 минут раньше.';
          if (hours <= 9) return '✅ Отличная продолжительность сна для восстановления и метаболизма.';
          return '💡 Избыток сна может говорить об усталости. Следите за качеством.';
        };
        const getQualityTip = () => {
          if (quality <= 2) return 'Попробуйте: тёмная комната, без экранов за час до сна, прохладная температура.';
          if (quality === 3) return 'Для улучшения: регулярный режим, магний вечером, лёгкая растяжка.';
          return '';
        };
        return (
          <Card icon={<Moon size={16} />} label={`Сон: ${hours > 0 ? `${hours} ч` : '—'}`}>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-12">Часы:</span>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="24"
                  value={hours > 0 ? hours : ''}
                  placeholder="0"
                  onChange={e => {
                    const val = parseFloat(e.target.value);
                    update({ sleepHours: !isNaN(val) && val >= 0 ? Math.min(24, val) : 0 });
                  }}
                  className="w-16 bg-secondary text-center text-sm font-medium rounded-lg py-1.5 outline-none focus:ring-2 focus:ring-ring tabular-nums"
                />
                <div className="flex-1 flex gap-1">
                  {[6, 7, 8, 9].map(h => (
                    <button key={h} onClick={() => update({ sleepHours: h })}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95
                        ${hours === h ? 'bg-foreground text-background shadow-sm' : 'bg-secondary text-secondary-foreground hover:bg-secondary/70'}`}>
                      {h}ч
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-muted-foreground">Качество:</span>
                  <span className="text-xs font-medium">{qualityLabels[quality]}</span>
                </div>
                <input type="range" min={1} max={5} value={quality}
                  onChange={e => update({ sleepQuality: Number(e.target.value) })}
                  className="w-full accent-foreground h-2 rounded-full cursor-pointer" />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
                  <span>Плохо</span><span>Отлично</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{getSleepTip()}</p>
              {getQualityTip() && <p className="text-xs text-muted-foreground leading-relaxed">💡 {getQualityTip()}</p>}
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
