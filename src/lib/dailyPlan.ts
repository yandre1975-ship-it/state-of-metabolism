import { type DailyEntry, type UserProfile, assessDay, getLast7Days } from './storage';
import { canAccess } from './premium';

export interface DailyPlan { actions: string[]; insight: string; risk: string | null }

export function generateDailyPlan(entry: DailyEntry, _profile: UserProfile): DailyPlan {
  const assessment = assessDay(entry);
  return {
    actions: assessment.actions.slice(0, canAccess('advancedPlan') ? 5 : 3),
    insight: assessment.message,
    risk: assessment.status === 'red' ? assessment.message : null,
  };
}

export function getAdaptationWarnings(_profile: UserProfile): string[] {
  const days = getLast7Days();
  const warnings: string[] = [];
  if (days.filter(e => e.energy != null && e.energy <= 2).length >= 3)
    warnings.push('За последние 7 дней несколько раз отмечена низкая энергия. Если слабость сохраняется, обсудите её с врачом.');
  if (days.filter(e => e.hunger != null && e.hunger >= 4).length >= 4)
    warnings.push('За последние 7 дней часто отмечен сильный голод. Обратите внимание на регулярность и состав питания.');
  return warnings;
}
