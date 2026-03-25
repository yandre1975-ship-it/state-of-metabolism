import { useState } from 'react';
import { getProfile, saveProfile, calcDailyDeficit, type UserProfile, type HealthCondition, type Goal } from '@/lib/storage';
import { saveCloudProfile } from '@/lib/cloudStorage';
import { useAuth } from '@/contexts/AuthContext';
import { Check, User, Target, LogOut, Heart, Zap } from 'lucide-react';
import NotificationSettings from '@/components/NotificationSettings';
import AgentInsightBanner from '@/components/AgentInsightBanner';

const conditionsList: { id: HealthCondition; label: string; description: string }[] = [
  { id: 'insulin_resistance', label: 'Инсулинорезистентность', description: 'Снижает углеводы, увеличивает белок и жиры' },
  { id: 'hypothyroid', label: 'Гипотиреоз', description: 'Учитывает замедленный метаболизм' },
  { id: 'pcos', label: 'СПКЯ', description: 'Оптимизирует макросы для гормонального баланса' },
  { id: 'high_cortisol', label: 'Повышенный кортизол', description: 'Корректирует калории для снижения стресса' },
];

export default function Profile() {
  const { signOut } = useAuth();
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
    saveCloudProfile(next);
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
    <div className="space-y-6 animate-fade-up">
      <AgentInsightBanner tab="profile" />

      {/* Name */}
      <div className="rounded-2xl glass-card p-5">
        <div className="flex items-center gap-2 text-muted-foreground mb-3">
          <div className="w-8 h-8 rounded-lg gradient-accent-soft flex items-center justify-center">
            <User size={16} className="text-[hsl(250_90%_60%)]" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider">Имя</span>
        </div>
        <input
          type="text"
          value={nameStr}
          onChange={e => setNameStr(e.target.value)}
          onBlur={() => update({ name: nameStr.trim() })}
          placeholder="Введите ваше имя"
          className="w-full bg-transparent text-xl font-bold outline-none border-b border-border/50 pb-1 focus:border-[hsl(250_90%_60%/0.5)] placeholder:text-muted-foreground/40 transition-colors"
        />
      </div>

      {/* Sex */}
      <div className="rounded-2xl glass-card p-5">
        <div className="flex items-center gap-2 text-muted-foreground mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider">Пол</span>
        </div>
        <div className="flex gap-3">
          {([
            { value: 'male' as const, label: '♂ Мужской' },
            { value: 'female' as const, label: '♀ Женский' },
          ]).map(opt => (
            <button
              key={opt.value}
              onClick={() => update({ sex: opt.value })}
              className={`flex-1 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-300 active:scale-[0.96]
                ${profile.sex === opt.value
                  ? 'gradient-accent text-white shadow-lg shadow-[hsl(250_90%_60%/0.25)]'
                  : 'glass-card hover:border-[hsl(250_90%_60%/0.3)]'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Age, Height, Weight */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Возраст', value: ageStr, set: setAgeStr, unit: 'лет', blur: () => { const v = Math.max(10, Math.min(120, Number(ageStr) || 30)); setAgeStr(String(v)); update({ age: v }); } },
          { label: 'Рост', value: heightStr, set: setHeightStr, unit: 'см', blur: () => { const v = Math.max(100, Math.min(250, Number(heightStr) || 170)); setHeightStr(String(v)); update({ height: v }); } },
          { label: 'Вес', value: weightStr, set: setWeightStr, unit: 'кг', blur: () => { const v = Math.max(30, Math.min(300, Number(weightStr) || 75)); setWeightStr(String(v)); update({ weight: v }); } },
        ].map(f => (
          <div key={f.label} className="rounded-2xl glass-card p-4 hover:border-[hsl(250_90%_60%/0.3)] transition-colors">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{f.label}</span>
            <input type="number" value={f.value}
              onChange={e => f.set(e.target.value)}
              onBlur={f.blur}
              className="w-full bg-transparent text-2xl font-bold outline-none tabular-nums mt-1 border-b border-border/50 pb-1 focus:border-[hsl(250_90%_60%/0.5)] transition-colors" />
            <span className="text-[11px] text-muted-foreground">{f.unit}</span>
          </div>
        ))}
      </div>

      {/* Goal */}
      <div className="rounded-2xl glass-card p-5">
        <div className="flex items-center gap-2 text-muted-foreground mb-3">
          <div className="w-8 h-8 rounded-lg gradient-accent-soft flex items-center justify-center">
            <Zap size={16} className="text-[hsl(250_90%_60%)]" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider">Цель</span>
        </div>
        <div className="space-y-2">
          {([
            { value: 'lose' as Goal, label: '🔥 Похудение', desc: '−400 ккал' },
            { value: 'maintain' as Goal, label: '⚖️ Поддержание', desc: '±0 ккал' },
            { value: 'gain' as Goal, label: '💪 Набор', desc: '+300 ккал' },
          ]).map(opt => (
            <button
              key={opt.value}
              onClick={() => update({ goal: opt.value })}
              className={`w-full text-left p-4 rounded-2xl transition-all duration-300 active:scale-[0.98]
                ${profile.goal === opt.value
                  ? 'gradient-accent text-white shadow-lg shadow-[hsl(250_90%_60%/0.25)]'
                  : 'glass-card hover:border-[hsl(250_90%_60%/0.3)]'}`}
            >
              <span className="text-sm font-semibold">{opt.label}</span>
              <span className={`text-xs block mt-0.5 ${profile.goal === opt.value ? 'text-white/70' : 'text-muted-foreground'}`}>{opt.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Activity Level */}
      <div className="rounded-2xl glass-card p-5">
        <div className="flex items-center gap-2 text-muted-foreground mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider">Уровень активности</span>
        </div>
        <div className="space-y-2">
          {([
            { value: 'sedentary' as const, label: '🪑 Сидячий', desc: 'Офис, мало движения' },
            { value: 'light' as const, label: '🚶 Лёгкая', desc: '1–2 прогулки в неделю' },
            { value: 'moderate' as const, label: '🏃 Умеренная', desc: '3–4 тренировки в неделю' },
            { value: 'active' as const, label: '💪 Высокая', desc: 'Ежедневные тренировки' },
          ]).map(opt => (
            <button
              key={opt.value}
              onClick={() => update({ activityLevel: opt.value })}
              className={`w-full text-left p-4 rounded-2xl transition-all duration-300 active:scale-[0.98]
                ${profile.activityLevel === opt.value
                  ? 'gradient-accent text-white shadow-lg shadow-[hsl(250_90%_60%/0.25)]'
                  : 'glass-card hover:border-[hsl(250_90%_60%/0.3)]'}`}
            >
              <span className="text-sm font-semibold">{opt.label}</span>
              <span className={`text-xs block mt-0.5 ${profile.activityLevel === opt.value ? 'text-white/70' : 'text-muted-foreground'}`}>{opt.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Target Weight & Date */}
      <div className="rounded-2xl glass-card p-5">
        <div className="flex items-center gap-2 text-muted-foreground mb-3">
          <div className="w-8 h-8 rounded-lg gradient-accent-soft flex items-center justify-center">
            <Target size={16} className="text-[hsl(250_90%_60%)]" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider">Целевой вес и сроки</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl glass-card p-3">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Целевой вес</span>
            <input type="number" inputMode="decimal" step="0.1" value={targetWeightStr}
              onChange={e => setTargetWeightStr(e.target.value)}
              onBlur={() => {
                const v = targetWeightStr ? Math.max(30, Math.min(300, Number(targetWeightStr) || 0)) : undefined;
                if (v) setTargetWeightStr(String(v));
                update({ targetWeight: v });
              }}
              placeholder="—"
              className="w-full bg-transparent text-xl font-bold outline-none tabular-nums mt-1 border-b border-border/50 pb-1 focus:border-[hsl(250_90%_60%/0.5)] transition-colors" />
            <span className="text-[11px] text-muted-foreground">кг</span>
          </div>
          <div className="rounded-xl glass-card p-3">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">К дате</span>
            <input type="date" value={targetDate}
              onChange={e => {
                setTargetDate(e.target.value);
                update({ targetDate: e.target.value || undefined });
              }}
              min={new Date().toISOString().slice(0, 10)}
              className="w-full bg-transparent text-base font-bold outline-none tabular-nums mt-1 border-b border-border/50 pb-1 focus:border-[hsl(250_90%_60%/0.5)] transition-colors" />
          </div>
        </div>

        {(() => {
          const deficit = calcDailyDeficit(profile);
          if (!deficit) return null;
          const safe = deficit.dailyDeficit <= 1000;
          return (
            <div className={`mt-4 rounded-2xl p-4 ${safe ? 'bg-gradient-to-r from-[hsl(152_60%_42%/0.1)] to-[hsl(170_60%_45%/0.1)] border border-[hsl(152_60%_42%/0.2)]' : 'bg-status-red-bg border border-[hsl(0_72%_51%/0.2)]'}`}>
              <p className="text-sm font-bold mb-2">📊 План достижения цели</p>
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
                  <p className="text-[10px] text-muted-foreground">ккал/день</p>
                </div>
              </div>
              {!safe && <p className="text-xs text-status-red mt-2">⚠️ Дефицит &gt;1000 ккал/день небезопасен.</p>}
              {safe && <p className="text-xs text-status-green mt-2">✓ Безопасный темп похудения</p>}
            </div>
          );
        })()}
      </div>

      {/* Health Conditions */}
      <div className="rounded-2xl glass-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg gradient-accent-soft flex items-center justify-center">
            <Heart size={16} className="text-[hsl(250_90%_60%)]" />
          </div>
          <div>
            <h3 className="font-bold text-sm">Состояние здоровья</h3>
            <p className="text-[10px] text-muted-foreground">Выберите, если применимо</p>
          </div>
        </div>
        <ul className="space-y-2">
          {conditionsList.map(cond => {
            const active = profile.conditions.includes(cond.id);
            return (
              <li key={cond.id}>
                <button
                  onClick={() => toggleCondition(cond.id)}
                  className={`w-full flex items-start gap-3 p-4 rounded-2xl transition-all duration-300 active:scale-[0.98] text-left
                    ${active ? 'gradient-accent text-white shadow-lg shadow-[hsl(250_90%_60%/0.25)]' : 'glass-card hover:border-[hsl(250_90%_60%/0.3)]'}`}
                >
                  <div className={`w-5 h-5 mt-0.5 rounded-md flex items-center justify-center flex-shrink-0 transition-colors
                    ${active ? 'bg-white/20' : 'border-2 border-muted-foreground/25'}`}>
                    {active && <Check size={12} strokeWidth={3} />}
                  </div>
                  <div>
                    <span className="text-sm font-semibold">{cond.label}</span>
                    <p className={`text-[11px] mt-0.5 ${active ? 'text-white/70' : 'text-muted-foreground'}`}>{cond.description}</p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <NotificationSettings />

      {/* Logout */}
      <button
        onClick={signOut}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl glass-card text-status-red font-semibold text-sm active:scale-[0.97] transition-all hover:border-[hsl(0_72%_51%/0.3)] hover:bg-status-red-bg/50"
      >
        <LogOut size={16} />
        Выйти из аккаунта
      </button>

      {saved && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 gradient-accent text-white px-5 py-2.5 rounded-2xl text-sm font-semibold shadow-xl shadow-[hsl(250_90%_60%/0.3)] animate-fade-up z-50">
          ✓ Сохранено
        </div>
      )}
    </div>
  );
}
