import { useState } from 'react';
import { saveProfile, type UserProfile, type HealthCondition, type Goal } from '@/lib/storage';
import { saveCloudProfile } from '@/lib/cloudStorage';
import { Check, ArrowRight, ArrowLeft, Activity, Sparkles, Target, Heart, Zap } from 'lucide-react';

const problems = [
  { id: 'hunger' as const, label: '🍔 Постоянный голод', desc: 'Сложно контролировать аппетит' },
  { id: 'energy' as const, label: '😴 Низкая энергия', desc: 'Усталость и упадок сил' },
  { id: 'sleep' as const, label: '🌙 Плохой сон', desc: 'Трудности с засыпанием или пробуждением' },
  { id: 'cravings' as const, label: '🍫 Тяга к сладкому', desc: 'Сложно отказаться от сладкого' },
];

const conditionsList: { id: HealthCondition; label: string }[] = [
  { id: 'insulin_resistance', label: 'Инсулинорезистентность' },
  { id: 'hypothyroid', label: 'Гипотиреоз' },
  { id: 'pcos', label: 'СПКЯ' },
  { id: 'high_cortisol', label: 'Повышенный кортизол' },
];

const activityLevels = [
  { value: 'sedentary', label: 'Сидячий', desc: 'Офис, мало движения' },
  { value: 'light', label: 'Лёгкая', desc: '1–2 прогулки в неделю' },
  { value: 'moderate', label: 'Умеренная', desc: '3–4 тренировки в неделю' },
  { value: 'active', label: 'Высокая', desc: 'Ежедневные тренировки' },
];

interface OnboardingProps {
  onComplete: () => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const [name, setName] = useState('');
  const [sex, setSex] = useState<'male' | 'female'>('male');
  const [age, setAge] = useState('35');
  const [height, setHeight] = useState('175');
  const [weight, setWeight] = useState('85');
  const [goal, setGoal] = useState<Goal>('lose');
  const [activityLevel, setActivityLevel] = useState('light');
  const [selectedProblems, setSelectedProblems] = useState<string[]>([]);
  const [conditions, setConditions] = useState<HealthCondition[]>([]);
  const [targetWeight, setTargetWeight] = useState('');
  const [targetDate, setTargetDate] = useState('');

  const steps = ['Знакомство', 'Тело', 'Цель', 'Проблемы', 'Старт'];

  const toggleProblem = (id: string) => {
    setSelectedProblems(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const toggleCondition = (id: HealthCondition) => {
    setConditions(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  const finish = () => {
    const profile: UserProfile = {
      name: name.trim() || 'Пользователь',
      sex,
      age: Number(age) || 35,
      height: Number(height) || 175,
      weight: Number(weight) || 85,
      goal,
      activityLevel: activityLevel as UserProfile['activityLevel'],
      conditions,
      targetWeight: targetWeight ? Number(targetWeight) : undefined,
      targetDate: targetDate || undefined,
    };
    saveProfile(profile);
    saveCloudProfile(profile);
    onComplete();
  };

  const canNext = () => {
    if (step === 0) return name.trim().length > 0;
    if (step === 1) return Number(age) > 0 && Number(height) > 0 && Number(weight) > 0;
    return true;
  };

  const goNext = () => {
    setDirection('forward');
    setStep(s => s + 1);
  };

  const goBack = () => {
    setDirection('back');
    setStep(s => s - 1);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden">
      {/* Progress */}
      <div className="px-6 pt-6 pb-2 animate-fade-up">
        <div className="flex gap-2">
          {steps.map((_, i) => (
            <div key={i} className="h-1.5 flex-1 rounded-full bg-border overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ease-out ${i <= step ? 'gradient-accent w-full' : 'w-0'}`}
              />
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2.5 tabular-nums font-medium">{step + 1} из {steps.length}</p>
      </div>

      {/* Content */}
      <div key={step} className="flex-1 px-6 py-6 overflow-y-auto">
        {step === 0 && (
          <div className="space-y-8">
            <div className="animate-fade-up">
              <div className="w-14 h-14 rounded-2xl gradient-accent flex items-center justify-center mb-5 animate-scale-up shadow-lg shadow-[hsl(250_90%_60%/0.3)]">
                <Sparkles size={28} className="text-white" />
              </div>
              <h2 className="text-3xl font-extrabold leading-tight tracking-tight">Добро пожаловать в<br /><span className="gradient-text">AI Health Operator</span></h2>
              <p className="text-muted-foreground mt-3 text-sm leading-relaxed max-w-sm">
                Ваш персональный коуч по здоровью. Мы поможем вам похудеть, контролировать голод и повысить энергию.
              </p>
            </div>
            <div className="animate-fade-up-delay">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Как вас зовут?</label>
              <input
                autoFocus
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Введите имя"
                className="w-full mt-2.5 glass-card rounded-2xl px-5 py-4 text-lg font-semibold outline-none focus:ring-2 focus:ring-[hsl(250_90%_60%/0.5)] focus:border-[hsl(250_90%_60%/0.3)] placeholder:text-muted-foreground/40 transition-all"
              />
            </div>
            <div className="animate-fade-up-delay">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Пол</label>
              <div className="flex gap-3 mt-2.5">
                {(['male', 'female'] as const).map(s => (
                  <button key={s} onClick={() => setSex(s)}
                    className={`flex-1 py-4 rounded-2xl text-sm font-semibold transition-all duration-300 active:scale-[0.96] ${sex === s ? 'gradient-accent text-white shadow-lg shadow-[hsl(250_90%_60%/0.25)]' : 'glass-card hover:border-[hsl(250_90%_60%/0.3)]'}`}>
                    {s === 'male' ? '♂ Мужской' : '♀ Женский'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-7">
            <div className="animate-fade-up">
              <div className="w-12 h-12 rounded-xl gradient-accent-soft flex items-center justify-center mb-4">
                <Target size={24} className="text-[hsl(250_90%_60%)]" />
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight">Ваши параметры</h2>
            </div>
            <div className="grid grid-cols-3 gap-3 animate-fade-up-delay">
              {[
                { label: 'Возраст', value: age, set: setAge, unit: 'лет', mode: 'numeric' as const },
                { label: 'Рост', value: height, set: setHeight, unit: 'см', mode: 'numeric' as const },
                { label: 'Вес', value: weight, set: setWeight, unit: 'кг', mode: 'decimal' as const },
              ].map(f => (
                <div key={f.label} className="rounded-2xl glass-card p-4 hover:border-[hsl(250_90%_60%/0.3)] transition-colors">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{f.label}</span>
                  <input type="number" inputMode={f.mode} value={f.value}
                    onChange={e => f.set(e.target.value)}
                    className="w-full bg-transparent text-2xl font-bold outline-none tabular-nums mt-1 border-b border-input pb-1 focus:border-[hsl(250_90%_60%/0.5)] transition-colors" />
                  <span className="text-[11px] text-muted-foreground">{f.unit}</span>
                </div>
              ))}
            </div>
            <div className="animate-fade-up-delay">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Уровень активности</label>
              <div className="space-y-2 mt-2">
                {activityLevels.map(a => (
                  <button key={a.value} onClick={() => setActivityLevel(a.value)}
                    className={`w-full text-left p-4 rounded-2xl transition-all duration-300 active:scale-[0.98] ${activityLevel === a.value ? 'gradient-accent text-white shadow-lg shadow-[hsl(250_90%_60%/0.25)]' : 'glass-card hover:border-[hsl(250_90%_60%/0.3)]'}`}>
                    <span className="text-sm font-semibold">{a.label}</span>
                    <span className={`text-xs block mt-0.5 ${activityLevel === a.value ? 'text-white/70' : 'text-muted-foreground'}`}>{a.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-7">
            <div className="animate-fade-up">
              <div className="w-12 h-12 rounded-xl gradient-accent-soft flex items-center justify-center mb-4">
                <Zap size={24} className="text-[hsl(250_90%_60%)]" />
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight">Ваша цель</h2>
            </div>
            <div className="space-y-3 animate-fade-up-delay">
              {([
                { value: 'lose' as Goal, label: '🔥 Похудение', desc: 'Снижение веса и жировой массы' },
                { value: 'maintain' as Goal, label: '⚖️ Поддержание', desc: 'Сохранение текущего веса' },
                { value: 'gain' as Goal, label: '💪 Набор массы', desc: 'Увеличение мышечной массы' },
              ]).map(opt => (
                <button key={opt.value} onClick={() => setGoal(opt.value)}
                  className={`w-full text-left p-5 rounded-2xl transition-all duration-300 active:scale-[0.98] ${goal === opt.value ? 'gradient-accent text-white shadow-lg shadow-[hsl(250_90%_60%/0.25)]' : 'glass-card hover:border-[hsl(250_90%_60%/0.3)]'}`}>
                  <span className="text-base font-semibold">{opt.label}</span>
                  <span className={`text-xs block mt-1 ${goal === opt.value ? 'text-white/70' : 'text-muted-foreground'}`}>{opt.desc}</span>
                </button>
              ))}
            </div>
            {goal === 'lose' && (
              <div className="grid grid-cols-2 gap-3 animate-fade-up">
                <div className="rounded-2xl glass-card p-4">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Целевой вес</span>
                  <input type="number" inputMode="decimal" step="0.1" value={targetWeight}
                    onChange={e => setTargetWeight(e.target.value)}
                    placeholder="—"
                    className="w-full bg-transparent text-xl font-bold outline-none tabular-nums mt-1 border-b border-input pb-1 focus:border-[hsl(250_90%_60%/0.5)] transition-colors" />
                  <span className="text-[11px] text-muted-foreground">кг</span>
                </div>
                <div className="rounded-2xl glass-card p-4">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">К дате</span>
                  <input type="date" value={targetDate}
                    onChange={e => setTargetDate(e.target.value)}
                    min={new Date().toISOString().slice(0, 10)}
                    className="w-full bg-transparent text-base font-bold outline-none tabular-nums mt-1 border-b border-input pb-1 focus:border-[hsl(250_90%_60%/0.5)] transition-colors" />
                </div>
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-7">
            <div className="animate-fade-up">
              <div className="w-12 h-12 rounded-xl gradient-accent-soft flex items-center justify-center mb-4">
                <Heart size={24} className="text-[hsl(250_90%_60%)]" />
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight">Что вас беспокоит?</h2>
              <p className="text-sm text-muted-foreground mt-2">Выберите одну или несколько проблем</p>
            </div>
            <div className="space-y-3 animate-fade-up-delay">
              {problems.map(p => (
                <button key={p.id} onClick={() => toggleProblem(p.id)}
                  className={`w-full flex items-center gap-4 p-5 rounded-2xl transition-all duration-300 active:scale-[0.98] text-left ${selectedProblems.includes(p.id) ? 'gradient-accent text-white shadow-lg shadow-[hsl(250_90%_60%/0.25)]' : 'glass-card hover:border-[hsl(250_90%_60%/0.3)]'}`}>
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300 ${selectedProblems.includes(p.id) ? 'bg-white/20' : 'border-2 border-muted-foreground/20'}`}>
                    {selectedProblems.includes(p.id) && <Check size={15} strokeWidth={3} />}
                  </div>
                  <div>
                    <span className="text-sm font-semibold">{p.label}</span>
                    <span className={`text-xs block mt-0.5 ${selectedProblems.includes(p.id) ? 'text-white/70' : 'text-muted-foreground'}`}>{p.desc}</span>
                  </div>
                </button>
              ))}
            </div>
            <div className="animate-fade-up-delay">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Состояние здоровья (необязательно)</p>
              <div className="flex flex-wrap gap-2">
                {conditionsList.map(c => (
                  <button key={c.id} onClick={() => toggleCondition(c.id)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-300 active:scale-95 ${conditions.includes(c.id) ? 'gradient-accent text-white shadow-md shadow-[hsl(250_90%_60%/0.2)]' : 'glass-card hover:border-[hsl(250_90%_60%/0.3)]'}`}>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-8">
            <div className="text-center pt-8 animate-fade-up">
              <div className="w-20 h-20 rounded-3xl gradient-accent flex items-center justify-center mx-auto mb-5 shadow-xl shadow-[hsl(250_90%_60%/0.3)] animate-scale-up">
                <Activity size={36} className="text-white" />
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight">Всё готово, <span className="gradient-text">{name || 'друг'}</span>!</h2>
              <p className="text-muted-foreground mt-3 text-sm leading-relaxed max-w-xs mx-auto">
                Каждый день мы будем давать вам 3–5 простых действий для достижения цели. Начнём прямо сейчас.
              </p>
            </div>
            <div className="rounded-2xl glass-card p-6 space-y-4 animate-fade-up-delay">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full gradient-accent inline-block"></span>
                Ваш профиль
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="text-muted-foreground">Пол</div>
                <div className="font-medium">{sex === 'male' ? 'Мужской' : 'Женский'}</div>
                <div className="text-muted-foreground">Возраст</div>
                <div className="font-medium tabular-nums">{age} лет</div>
                <div className="text-muted-foreground">Рост / Вес</div>
                <div className="font-medium tabular-nums">{height} см / {weight} кг</div>
                <div className="text-muted-foreground">Цель</div>
                <div className="font-medium">{goal === 'lose' ? 'Похудение' : goal === 'maintain' ? 'Поддержание' : 'Набор'}</div>
                {targetWeight && (
                  <>
                    <div className="text-muted-foreground">Целевой вес</div>
                    <div className="font-medium tabular-nums">{targetWeight} кг</div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="px-6 pb-8 pt-4 flex gap-3 animate-fade-up">
        {step > 0 && (
          <button onClick={goBack}
            className="w-12 h-12 rounded-2xl glass-card flex items-center justify-center active:scale-95 transition-all hover:border-[hsl(250_90%_60%/0.3)]">
            <ArrowLeft size={18} />
          </button>
        )}
        {step < steps.length - 1 ? (
          <button onClick={goNext} disabled={!canNext()}
            className="flex-1 h-13 rounded-2xl gradient-accent text-white font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.97] transition-all disabled:opacity-40 shadow-lg shadow-[hsl(250_90%_60%/0.3)]">
            Далее <ArrowRight size={16} />
          </button>
        ) : (
          <button onClick={finish}
            className="flex-1 h-13 rounded-2xl gradient-accent text-white font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.97] transition-all shadow-lg shadow-[hsl(250_90%_60%/0.3)] animate-pulse-soft">
            Начать 🚀
          </button>
        )}
      </div>
    </div>
  );
}
