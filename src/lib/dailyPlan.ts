import { type DailyEntry, type UserProfile, getEntries, getToday } from './storage';
import { canAccess } from './premium';

export interface DailyPlan {
  actions: string[];
  insight: string;
  risk: string | null;
}

/**
 * Generate a local daily plan (3–5 actions) based on user profile and today's entry.
 * This replaces AI until backend is connected.
 */
export function generateDailyPlan(entry: DailyEntry, profile: UserProfile): DailyPlan {
  const actions: string[] = [];
  let insight = '';
  let risk: string | null = null;

  const entries = getEntries();
  const last7 = entries.slice(-7);

  // Weight stagnation check
  const weightsLast7 = last7.filter(e => e.weight).map(e => e.weight!);
  const isStagnant = weightsLast7.length >= 5 &&
    Math.abs(weightsLast7[weightsLast7.length - 1] - weightsLast7[0]) < 0.3;

  // High hunger pattern
  const avgHunger = last7.length > 0
    ? last7.reduce((s, e) => s + e.hunger, 0) / last7.length
    : entry.hunger;

  // Low energy pattern
  const avgEnergy = last7.length > 0
    ? last7.reduce((s, e) => s + e.energy, 0) / last7.length
    : entry.energy;

  // --- Actions ---

  // Activity
  if (entry.activity < 30) {
    actions.push('🚶 Пройдите минимум 6000 шагов сегодня');
  } else if (entry.activity < 60) {
    actions.push('🏃 Отлично! Попробуйте добавить 15 минут интенсивной ходьбы');
  }

  // Protein
  if (!entry.protein) {
    actions.push('🥩 Добавьте белок в каждый приём пищи (яйца, курица, рыба, творог)');
  }

  // Coffee
  if (entry.coffee > 2) {
    actions.push('☕ Сократите кофе до 1–2 чашек, замените на воду или зелёный чай');
  } else if (entry.coffee === 0) {
    actions.push('💧 Выпейте стакан воды перед каждым приёмом пищи');
  }

  // Hunger management
  if (entry.hunger >= 4) {
    actions.push('🫘 Ешьте больше клетчатки и белка для контроля голода');
    risk = 'Высокий уровень голода повышает риск переедания';
  }

  // Energy
  if (entry.energy <= 2) {
    actions.push('😴 Приоритет: сон 7–8 часов и лёгкая прогулка на свежем воздухе');
    if (!risk) risk = 'Низкая энергия может привести к срыву диеты';
  }

  // Conditions-specific
  if (profile.conditions.includes('insulin_resistance')) {
    if (actions.length < 4) {
      actions.push('🥗 Избегайте быстрых углеводов натощак — начните день с белка и жиров');
    }
  }

  if (profile.conditions.includes('high_cortisol')) {
    if (actions.length < 4) {
      actions.push('🧘 Добавьте 10 минут дыхательных упражнений для снижения кортизола');
    }
  }

  // Goal-specific
  if (profile.goal === 'lose' && actions.length < 3) {
    actions.push('⏰ Ужинайте за 3 часа до сна');
  }

  // Stagnation-specific
  if (isStagnant && profile.goal === 'lose') {
    actions.push('🔄 Вес стоит — попробуйте увеличить активность или сделать разгрузочный день');
    if (!risk) risk = 'Вес не снижается 7+ дней — нужна корректировка плана';
  }

  // Ensure at least 3 actions
  if (actions.length < 3) {
    const filler = [
      '💧 Выпейте 8 стаканов воды в течение дня',
      '🥬 Добавьте овощи в каждый приём пищи',
      '📝 Ведите дневник питания — записывайте всё, что едите',
    ];
    for (const f of filler) {
      if (actions.length >= 3) break;
      if (!actions.includes(f)) actions.push(f);
    }
  }

  // Limit: Free = 3 actions, Pro = 5
  const maxActions = canAccess('advancedPlan') ? 5 : 3;
  const finalActions = actions.slice(0, maxActions);

  // --- Insight ---
  if (isStagnant) {
    insight = 'Основная проблема — стагнация веса. Попробуйте изменить режим питания или увеличить физическую нагрузку.';
  } else if (avgHunger >= 3.5) {
    insight = 'Нестабильный уровень голода — основной фактор. Увеличьте белок и клетчатку в рационе.';
  } else if (avgEnergy <= 2.5) {
    insight = 'Низкая энергия мешает прогрессу. Сфокусируйтесь на качестве сна и уменьшите стресс.';
  } else {
    insight = 'Показатели в хорошей зоне. Продолжайте следовать плану для стабильного результата.';
  }

  return { actions: finalActions, insight, risk };
}

/**
 * Check adaptation rules and return warnings.
 */
export function getAdaptationWarnings(profile: UserProfile): string[] {
  const warnings: string[] = [];
  const entries = getEntries();
  const last7 = entries.slice(-7);

  if (last7.length < 3) return warnings;

  // Weight stagnation
  const weights = last7.filter(e => e.weight).map(e => e.weight!);
  if (weights.length >= 5 && Math.abs(weights[weights.length - 1] - weights[0]) < 0.3) {
    warnings.push('Вес стагнирует — рекомендуется корректировка плана');
  }

  // Low adherence (high hunger + low protein)
  const lowProtein = last7.filter(e => !e.protein).length;
  if (lowProtein >= 5) {
    warnings.push('Белок отсутствует в большинстве дней — упрощаем рекомендации');
  }

  // High hunger pattern
  const highHunger = last7.filter(e => e.hunger >= 4).length;
  if (highHunger >= 4) {
    warnings.push('Частый высокий голод — корректируем стратегию питания');
  }

  return warnings;
}
