/**
 * Premium feature flags and gating system.
 * Currently localStorage-based; ready for Stripe/backend integration.
 */

export type PlanType = 'free' | 'pro';

export interface PremiumState {
  plan: PlanType;
  activatedAt?: string; // ISO date
  expiresAt?: string;   // ISO date (for trial)
}

const PREMIUM_KEY = 'health_premium';

const PRO_FEATURES = {
  weeklyReview: { label: 'Еженедельный обзор', free: false },
  weightForecast: { label: 'Прогноз веса', free: false },
  conditions: { label: 'Учёт заболеваний', free: false },
  advancedPlan: { label: 'Расширенный план (5 действий)', free: false },
  foodHistory: { label: 'История питания', free: false },
  customExercises: { label: 'Свои упражнения', free: true },
  basicDashboard: { label: 'Дашборд', free: true },
  basicCharts: { label: 'Графики (7 дней)', free: true },
  checklist: { label: 'Ежедневный чеклист', free: true },
  foodDiary: { label: 'Дневник еды', free: true },
} as const;

export type FeatureId = keyof typeof PRO_FEATURES;

export function getPremiumState(): PremiumState {
  try {
    const stored = localStorage.getItem(PREMIUM_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return { plan: 'free' };
}

export function savePremiumState(state: PremiumState) {
  localStorage.setItem(PREMIUM_KEY, JSON.stringify(state));
}

export function isPro(): boolean {
  const state = getPremiumState();
  if (state.plan !== 'pro') return false;
  if (state.expiresAt && new Date(state.expiresAt) < new Date()) return false;
  return true;
}

export function canAccess(feature: FeatureId): boolean {
  if (PRO_FEATURES[feature].free) return true;
  return isPro();
}

export function activatePro() {
  savePremiumState({ plan: 'pro', activatedAt: new Date().toISOString() });
}

export function deactivatePro() {
  savePremiumState({ plan: 'free' });
}

export function startTrial(days: number = 7) {
  const expires = new Date();
  expires.setDate(expires.getDate() + days);
  savePremiumState({
    plan: 'pro',
    activatedAt: new Date().toISOString(),
    expiresAt: expires.toISOString(),
  });
}

export function getFeatureList() {
  return Object.entries(PRO_FEATURES).map(([id, info]) => ({
    id: id as FeatureId,
    ...info,
  }));
}
