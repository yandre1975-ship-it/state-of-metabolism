import { useState } from 'react';
import { getProfile, saveProfile, calcDailyDeficit, type UserProfile, type HealthCondition, type Goal } from '@/lib/storage';
import { Check, User, Target } from 'lucide-react';
import NotificationSettings from '@/components/NotificationSettings';

const conditionsList: { id: HealthCondition; label: string; description: string }[] = [
  { id: 'insulin_resistance', label: 'Инсулинорезистентность', description: 'Снижает углеводы, увеличивает белок и жиры' },
  { id: 'hypothyroid', label: 'Гипотиреоз', description: 'Учитывает замедленный метаболизм' },
  { id: 'pcos', label: 'СПКЯ', description: 'Оптимизирует макросы для гормонального баланса' },
  { id: 'high_cortisol', label: 'Повышенный кортизол', description: 'Корректирует калории для снижения стресса' },
];

export default function Profile() {
  const [profile, setProfile] = useState<UserProfile>(getProfile);
  const [saved, setSaved] = useState(false);
  const [nameStr, setNameStr] = useState(profile.name || '');
  const [ageStr, setAgeStr] = useState(String(profile.age));
  const [heightStr, setHeightStr] = useState(String(profile.height));
  const [weightStr, setWeightStr] = useState(String(profile.weight));
  const [targetWeightStr, setTargetWeightStr] = useState(String(profile.targetWeight || ''));
  const [targetDate, setTargetDate] = useState(profile.targetDate || '');

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
      {/* Name */}
      <div className="rounded-2xl bg-card border p-5 shadow-sm">
        <div className="flex items-center gap-2 text-muted-foreground mb-3">
          <User size={16} />
          <span className="text-xs font-medium uppercase tracking-wide">Имя</span>
        </div>
        <input
          type="text"
          value={nameStr}
          onChange={e => setNameStr(e.target.value)}
          onBlur={() => update({ name: nameStr.trim() })}
          placeholder="Введите ваше имя"
          className="w-full bg-transparent text-xl font-semibold outline-none border-b border-input pb-1 placeholder:text-muted-foreground/40"
        />
      </div>

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

      {/* Age, Height, Weight */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-card border p-4 shadow-sm">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Возраст</span>
          <input type="number" inputMode="numeric" value={ageStr}
            onChange={e => setAgeStr(e.target.value)}
            onBlur={() => { const v = Math.max(10, Math.min(120, Number(ageStr) || 30)); setAgeStr(String(v)); update({ age: v }); }}
            className="w-full bg-transparent text-xl font-semibold outline-none tabular-nums mt-1 border-b border-input pb-1" />
          <span className="text-[11px] text-muted-foreground">лет</span>
        </div>
        <div className="rounded-2xl bg-card border p-4 shadow-sm">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Рост</span>
          <input type="number" inputMode="numeric" value={heightStr}
            onChange={e => setHeightStr(e.target.value)}
            onBlur={() => { const v = Math.max(100, Math.min(250, Number(heightStr) || 170)); setHeightStr(String(v)); update({ height: v }); }}
            className="w-full bg-transparent text-xl font-semibold outline-none tabular-nums mt-1 border-b border-input pb-1" />
          <span className="text-[11px] text-muted-foreground">см</span>
        </div>
        <div className="rounded-2xl bg-card border p-4 shadow-sm">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Вес</span>
          <input type="number" inputMode="decimal" step="0.1" value={weightStr}
            onChange={e => setWeightStr(e.target.value)}
            onBlur={() => { const v = Math.max(30, Math.min(300, Number(weightStr) || 75)); setWeightStr(String(v)); update({ weight: v }); }}
            className="w-full bg-transparent text-xl font-semibold outline-none tabular-nums mt-1 border-b border-input pb-1" />
          <span className="text-[11px] text-muted-foreground">кг</span>
        </div>
      </div>

      {/* Goal */}
      <div className="rounded-2xl bg-card border p-5 shadow-sm">
        <div className="flex items-center gap-2 text-muted-foreground mb-3">
          <span className="text-xs font-medium uppercase tracking-wide">Цель</span>
        </div>
        <div className="flex gap-2">
          {([
            { value: 'lose' as Goal, label: '🔥 Похудение', desc: '−400 ккал' },
            { value: 'maintain' as Goal, label: '⚖️ Поддержание', desc: '±0 ккал' },
            { value: 'gain' as Goal, label: '💪 Набор', desc: '+300 ккал' },
          ]).map(opt => (
            <button
              key={opt.value}
              onClick={() => update({ goal: opt.value })}
              className={`flex-1 py-3 px-2 rounded-xl text-center transition-all duration-150 active:scale-95
                ${profile.goal === opt.value
                  ? 'bg-foreground text-background shadow-md'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/70'}`}
            >
              <span className="text-sm font-medium block">{opt.label}</span>
              <span className="text-[10px] opacity-70">{opt.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Target Weight & Date */}
      <div className="rounded-2xl bg-card border p-5 shadow-sm">
        <div className="flex items-center gap-2 text-muted-foreground mb-3">
          <Target size={16} />
          <span className="text-xs font-medium uppercase tracking-wide">Целевой вес и сроки</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Целевой вес</span>
            <input type="number" inputMode="decimal" step="0.1" value={targetWeightStr}
              onChange={e => setTargetWeightStr(e.target.value)}
              onBlur={() => {
                const v = targetWeightStr ? Math.max(30, Math.min(300, Number(targetWeightStr) || 0)) : undefined;
                if (v) setTargetWeightStr(String(v));
                update({ targetWeight: v });
              }}
              placeholder="—"
              className="w-full bg-transparent text-xl font-semibold outline-none tabular-nums mt-1 border-b border-input pb-1" />
            <span className="text-[11px] text-muted-foreground">кг</span>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">К дате</span>
            <input type="date" value={targetDate}
              onChange={e => {
                setTargetDate(e.target.value);
                update({ targetDate: e.target.value || undefined });
              }}
              min={new Date().toISOString().slice(0, 10)}
              className="w-full bg-transparent text-lg font-semibold outline-none tabular-nums mt-1 border-b border-input pb-1" />
          </div>
        </div>

        {/* Deficit calculation */}
        {(() => {
          const deficit = calcDailyDeficit(profile);
          if (!deficit) return null;
          const safe = deficit.dailyDeficit <= 1000;
          return (
            <div className={`mt-4 rounded-xl p-4 ${safe ? 'bg-status-green-bg' : 'bg-status-red-bg'}`}>
              <p className="text-sm font-semibold mb-2">📊 План достижения цели</p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-lg font-bold tabular-nums">{deficit.kgToLose}</p>
                  <p className="text-[10px] text-muted-foreground">кг сбросить</p>
                </div>
                <div>
                  <p className="text-lg font-bold tabular-nums">{deficit.daysLeft}</p>
                  <p className="text-[10px] text-muted-foreground">дней осталось</p>
                </div>
                <div>
                  <p className={`text-lg font-bold tabular-nums ${safe ? 'text-status-green' : 'text-status-red'}`}>{deficit.dailyDeficit}</p>
                  <p className="text-[10px] text-muted-foreground">ккал/день дефицит</p>
                </div>
              </div>
              {!safe && (
                <p className="text-xs text-status-red mt-2">⚠️ Дефицит &gt;1000 ккал/день небезопасен. Увеличьте срок или скорректируйте цель.</p>
              )}
              {safe && (
                <p className="text-xs text-status-green mt-2">✓ Безопасный темп похудения</p>
              )}
            </div>
          );
        })()}
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
