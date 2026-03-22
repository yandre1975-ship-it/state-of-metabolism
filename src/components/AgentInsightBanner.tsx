import { useState, useEffect, useCallback } from 'react';
import { Brain, Salad, Dumbbell, Shield, ClipboardList, ChevronDown, ChevronUp, MessageCircle, X } from 'lucide-react';
import { getTodayEntry, getProfile, getStatus, getTodayFood, getTodayExercises, calcBurnedCalories, calcMacroTargets, getEntries } from '@/lib/storage';

type AgentRole = 'coach' | 'nutrition' | 'training' | 'risk' | 'reminder';

interface Insight {
  agent: AgentRole;
  emoji: string;
  label: string;
  message: string;
  severity: 'info' | 'warning' | 'success';
  followUp?: string; // feedback loop: what to check next
}

const AGENT_COLORS: Record<string, string> = {
  coach: 'text-blue-500',
  nutrition: 'text-emerald-500',
  training: 'text-orange-500',
  risk: 'text-red-500',
  reminder: 'text-violet-500',
};

const SEVERITY_BG: Record<string, string> = {
  info: 'bg-card border',
  warning: 'bg-status-yellow-bg border-status-yellow/30 border',
  success: 'bg-status-green-bg border-status-green/30 border',
};

function generateInsights(tab: string): Insight[] {
  const entry = getTodayEntry();
  const profile = getProfile();
  const { status } = getStatus(entry);
  const food = getTodayFood();
  const exercises = getTodayExercises();
  const burned = calcBurnedCalories(exercises);
  const targets = calcMacroTargets(entry.weight, entry.activity, profile);
  const totals = food.items.reduce(
    (acc, i) => ({ cal: acc.cal + i.calories, p: acc.p + i.protein }),
    { cal: 0, p: 0 }
  );
  const hour = new Date().getHours();
  const entries = getEntries();
  const last7 = entries.slice(-7);

  const insights: Insight[] = [];

  // ── RISK AGENT (always runs first, all tabs) ──
  if (entry.hunger >= 4) {
    insights.push({
      agent: 'risk', emoji: '🛡️', label: 'Аналитик рисков',
      message: `Голод ${entry.hunger}/5 — высокий риск переедания. Съешьте белок + клетчатку прямо сейчас.`,
      severity: 'warning',
      followUp: 'Проверю голод через час после перекуса',
    });
  }
  if (entry.energy <= 2) {
    insights.push({
      agent: 'risk', emoji: '🛡️', label: 'Аналитик рисков',
      message: `Энергия ${entry.energy}/5 — организм в стрессе. Избегайте интенсивных нагрузок, приоритет — восстановление.`,
      severity: 'warning',
      followUp: 'Отслеживаю энергию — если не улучшится за 2 дня, рекомендую врача',
    });
  }
  if (entry.coffee > 2 && entry.energy <= 3) {
    insights.push({
      agent: 'risk', emoji: '🛡️', label: 'Аналитик рисков',
      message: `${entry.coffee} чашки кофе при низкой энергии — признак зависимости от стимуляторов. Снижайте постепенно.`,
      severity: 'warning',
    });
  }
  if ((entry.sleepHours || 0) > 0 && entry.sleepHours < 6) {
    insights.push({
      agent: 'risk', emoji: '🛡️', label: 'Аналитик рисков',
      message: `Сон ${entry.sleepHours}ч — недосып повышает кортизол, усиливает голод и замедляет жиросжигание.`,
      severity: 'warning',
      followUp: 'Проверю качество сна завтра',
    });
  }

  // Weight stagnation check
  if (last7.length >= 7) {
    const weights = last7.filter(e => e.weight).map(e => e.weight!);
    if (weights.length >= 5) {
      const range = Math.max(...weights) - Math.min(...weights);
      if (range < 0.3 && profile.goal === 'lose') {
        insights.push({
          agent: 'risk', emoji: '🛡️', label: 'Аналитик рисков',
          message: 'Вес стагнирует 7+ дней. Возможно, нужно скорректировать калории или добавить активности.',
          severity: 'warning',
          followUp: 'Корректирую план — увеличу активность на 15 минут',
        });
      }
    }
  }

  // ── TAB-SPECIFIC INSIGHTS ──

  if (tab === 'dashboard' || tab === 'profile') {
    // Coach feedback loop
    if (status === 'green') {
      insights.push({
        agent: 'coach', emoji: '🧠', label: 'Коуч',
        message: 'Все показатели в норме! Продолжайте — устойчивость важнее скорости.',
        severity: 'success',
      });
    }
    if (!entry.protein && hour > 10) {
      insights.push({
        agent: 'nutrition', emoji: '🥗', label: 'Нутрициолог',
        message: 'Белок ещё не отмечен. Добавьте белок в следующий приём пищи для контроля аппетита.',
        severity: 'info',
        followUp: 'Проверю отметку белка к вечеру',
      });
    }
  }

  if (tab === 'food') {
    // Nutrition agent tracks execution
    if (totals.cal > 0 && totals.cal > targets.calories * 1.1) {
      insights.push({
        agent: 'nutrition', emoji: '🥗', label: 'Нутрициолог',
        message: `Превышение калорий на ${totals.cal - targets.calories} ккал. Сделайте вечерний приём легче.`,
        severity: 'warning',
        followUp: 'Скорректирую рекомендации на ужин',
      });
    } else if (totals.cal > 0 && totals.p < targets.protein * 0.5 && hour > 14) {
      insights.push({
        agent: 'nutrition', emoji: '🥗', label: 'Нутрициолог',
        message: `Белка пока ${totals.p}г из ${targets.protein}г. Добавьте мясо, рыбу или творог.`,
        severity: 'info',
        followUp: 'Проверю итоги по белку вечером',
      });
    }
    if (food.items.length === 0 && hour > 11) {
      insights.push({
        agent: 'nutrition', emoji: '🥗', label: 'Нутрициолог',
        message: 'Еда ещё не трекается. Пропуск приёмов повышает голод и риск срыва вечером.',
        severity: 'warning',
      });
    }
  }

  if (tab === 'food' || tab === 'dashboard') {
    // Training agent
    const exercisesDone = exercises.items.filter(e => e.done).length;
    const totalExercises = exercises.items.length;
    if (exercisesDone === 0 && hour > 14) {
      insights.push({
        agent: 'training', emoji: '💪', label: 'Тренер',
        message: entry.energy <= 2
          ? 'Энергия низкая — достаточно лёгкой прогулки 15 минут.'
          : 'Упражнения ещё не начаты. Даже 10 минут активности ускорят метаболизм.',
        severity: 'info',
        followUp: 'Проверю выполнение к вечеру',
      });
    } else if (exercisesDone > 0 && exercisesDone === totalExercises) {
      insights.push({
        agent: 'training', emoji: '💪', label: 'Тренер',
        message: `Все ${totalExercises} упражнений выполнены! Сожжено ~${Math.round(burned)} ккал. Отличная работа!`,
        severity: 'success',
      });
    }
  }

  if (tab === 'profile') {
    // Profile-specific risk warnings
    if (profile.conditions.includes('insulin_resistance')) {
      insights.push({
        agent: 'risk', emoji: '🛡️', label: 'Аналитик рисков',
        message: 'Инсулинорезистентность: сократите простые углеводы, увеличьте белок и клетчатку. Избегайте сахара натощак.',
        severity: 'warning',
      });
    }
    if (profile.conditions.includes('high_cortisol')) {
      insights.push({
        agent: 'risk', emoji: '🛡️', label: 'Аналитик рисков',
        message: 'Повышенный кортизол: не пропускайте приёмы пищи, снизьте кофе, добавьте магний вечером.',
        severity: 'warning',
      });
    }
    if (profile.weight > 100) {
      insights.push({
        agent: 'training', emoji: '💪', label: 'Тренер',
        message: 'При весе >100 кг исключены бег и прыжки. Фокус на ходьбе, плавании и силовых упражнениях.',
        severity: 'info',
      });
    }
    const deficit = profile.targetWeight && profile.targetDate
      ? (() => {
          const kgToLose = profile.weight - profile.targetWeight;
          const days = Math.max(1, Math.ceil((new Date(profile.targetDate).getTime() - Date.now()) / 86400000));
          return Math.round((kgToLose * 7700) / days);
        })()
      : 0;
    if (deficit > 1000) {
      insights.push({
        agent: 'risk', emoji: '🛡️', label: 'Аналитик рисков',
        message: `Дефицит ${deficit} ккал/день опасен! Это приведёт к потере мышц и замедлению метаболизма. Увеличьте срок.`,
        severity: 'warning',
      });
    }
  }

  // Reminder agent — time-based
  if (tab === 'dashboard') {
    if (hour >= 7 && hour <= 9 && food.items.length === 0) {
      insights.push({
        agent: 'reminder', emoji: '📋', label: 'Планировщик',
        message: 'Утро — время завтрака с белком. Это задаст тон всему дню.',
        severity: 'info',
      });
    }
    if (hour >= 20 && entry.activity < 15) {
      insights.push({
        agent: 'reminder', emoji: '📋', label: 'Планировщик',
        message: 'Вечер, а активности мало. Прогулка 15 минут после ужина улучшит сон и пищеварение.',
        severity: 'info',
        followUp: 'Завтра проверю — улучшился ли сон',
      });
    }
  }

  return insights.slice(0, 3); // max 3 insights per tab
}

interface Props {
  tab: string;
}

export default function AgentInsightBanner({ tab }: Props) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());
  const [expanded, setExpanded] = useState(true);

  // Refresh insights when tab changes or every 30s
  useEffect(() => {
    const refresh = () => {
      setInsights(generateInsights(tab));
      setDismissed(new Set());
    };
    refresh();
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, [tab]);

  const visible = insights.filter((_, i) => !dismissed.has(i));
  if (visible.length === 0) return null;

  return (
    <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground active:scale-95 transition-all"
      >
        <MessageCircle size={12} />
        AI-команда ({visible.length})
        {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      {expanded && visible.map((insight, vi) => {
        const realIdx = insights.indexOf(insight);
        return (
          <div
            key={`${insight.agent}-${realIdx}`}
            className={`rounded-xl p-3.5 ${SEVERITY_BG[insight.severity]} relative animate-in fade-in slide-in-from-top-1 duration-200`}
            style={{ animationDelay: `${vi * 60}ms` }}
          >
            <button
              onClick={() => setDismissed(prev => new Set([...prev, realIdx]))}
              className="absolute top-2 right-2 text-muted-foreground/40 hover:text-muted-foreground transition-colors p-0.5"
            >
              <X size={12} />
            </button>
            <div className="flex items-start gap-2.5 pr-5">
              <span className="text-base flex-shrink-0 mt-0.5">{insight.emoji}</span>
              <div className="min-w-0">
                <span className={`text-[10px] font-semibold ${AGENT_COLORS[insight.agent]} uppercase tracking-wide`}>
                  {insight.label}
                </span>
                <p className="text-xs leading-relaxed mt-0.5">{insight.message}</p>
                {insight.followUp && (
                  <p className="text-[10px] text-muted-foreground mt-1.5 italic flex items-center gap-1">
                    🔄 {insight.followUp}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
