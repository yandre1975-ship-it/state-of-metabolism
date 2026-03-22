import { useState } from 'react';
import { getProfile, saveProfile, type UserProfile, type HealthCondition, type Goal } from '@/lib/storage';
import { Check, User } from 'lucide-react';

const conditionsList: { id: HealthCondition; label: string; description: string }[] = [
  { id: 'insulin_resistance', label: 'Инсулинорезистентность', description: 'Снижает углеводы, увеличивает белок и жиры' },
  { id: 'hypothyroid', label: 'Гипотиреоз', description: 'Учитывает замедленный метаболизм' },
  { id: 'pcos', label: 'СПКЯ', description: 'Оптимизирует макросы для гормонального баланса' },
  { id: 'high_cortisol', label: 'Повышенный кортизол', description: 'Корректирует калории для снижения стресса' },
];

export default function Profile() {
  const [profile, setProfile] = useState<UserProfile>(getProfile);
  const [saved, setSaved] = useState(false);

  const update = (patch: Partial<UserProfile>) => {
    const next = { ...profile, ...patch };
    setProfile(next);
    saveProfile(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const toggleCondition = (id: HealthCondition) => {
    const conditions = profile.conditions.includes(id)
      ? profile.conditions.filter(c => c !== id)
      : [...profile.conditions, id];
    update({ conditions });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Sex */}
      <div className="rounded-2xl bg-card border p-5 shadow-sm">
        <div className="flex items-center gap-2 text-muted-foreground mb-3">
          <User size={16} />
          <span className="text-xs font-medium uppercase tracking-wide">Пол</span>
        </div>
        <div className="flex gap-2">
          {([
            { value: 'male' as const, label: 'Мужской' },
            { value: 'female' as const, label: 'Женский' },
          ]).map(opt => (
            <button
              key={opt.value}
              onClick={() => update({ sex: opt.value })}
              className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all duration-150 active:scale-95
                ${profile.sex === opt.value
                  ? 'bg-foreground text-background shadow-md'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/70'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Age & Height */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl bg-card border p-5 shadow-sm">
          <label className="flex items-center gap-2 text-muted-foreground mb-3">
            <span className="text-xs font-medium uppercase tracking-wide">Возраст</span>
          </label>
          <input
            type="number"
            inputMode="numeric"
            value={profile.age}
            onChange={e => update({ age: Math.max(10, Math.min(120, Number(e.target.value) || 0)) })}
            className="w-full bg-transparent text-2xl font-semibold outline-none tabular-nums"
          />
          <span className="text-xs text-muted-foreground">лет</span>
        </div>
        <div className="rounded-2xl bg-card border p-5 shadow-sm">
          <label className="flex items-center gap-2 text-muted-foreground mb-3">
            <span className="text-xs font-medium uppercase tracking-wide">Рост</span>
          </label>
          <input
            type="number"
            inputMode="numeric"
            value={profile.height}
            onChange={e => update({ height: Math.max(100, Math.min(250, Number(e.target.value) || 0)) })}
            className="w-full bg-transparent text-2xl font-semibold outline-none tabular-nums"
          />
          <span className="text-xs text-muted-foreground">см</span>
        </div>
      </div>

      {/* Health Conditions */}
      <div className="rounded-2xl bg-card border p-5 shadow-sm">
        <h3 className="font-semibold mb-1">Состояние здоровья</h3>
        <p className="text-xs text-muted-foreground mb-4">Выберите, если применимо — это скорректирует расчёт нормы</p>
        <ul className="space-y-2">
          {conditionsList.map(cond => {
            const active = profile.conditions.includes(cond.id);
            return (
              <li key={cond.id}>
                <button
                  onClick={() => toggleCondition(cond.id)}
                  className={`w-full flex items-start gap-3 p-4 rounded-xl transition-all duration-150 active:scale-[0.98] text-left
                    ${active ? 'bg-status-yellow-bg' : 'bg-secondary hover:bg-secondary/70'}`}
                >
                  <div className={`w-5 h-5 mt-0.5 rounded-md flex items-center justify-center flex-shrink-0 transition-colors
                    ${active ? 'bg-status-yellow text-white' : 'border-2 border-muted-foreground/25'}`}>
                    {active && <Check size={12} strokeWidth={3} />}
                  </div>
                  <div>
                    <span className="text-sm font-medium">{cond.label}</span>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{cond.description}</p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Save feedback */}
      {saved && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 bg-status-green text-white px-4 py-2 rounded-xl text-sm font-medium shadow-lg animate-in fade-in slide-in-from-top-2 duration-200 z-50">
          ✓ Сохранено
        </div>
      )}
    </div>
  );
}
