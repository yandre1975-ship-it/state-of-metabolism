import { beforeEach, expect, it } from 'vitest';
import { emptyEntry, getStatus, getInsights, getProfile } from '@/lib/storage';
import { generateDailyPlan } from '@/lib/dailyPlan';
beforeEach(() => localStorage.clear());
it('does not diagnose an empty day or recommend more activity on low energy', () => {
  expect(getStatus(emptyEntry('2026-09-07')).status).toBe('unknown');
  const entry = { ...emptyEntry('2026-09-07'), energy: 1, activity: 0 };
  const plan = generateDailyPlan(entry, getProfile());
  expect(plan.insight).toBe(getStatus(entry).message);
  expect(plan.actions).toEqual(getInsights(entry).slice(0, 3));
  expect(plan.actions.join(' ')).not.toMatch(/6000|интенсив|стресс|кортизол/);
});
it('uses the same result for partial, attention and complete days', () => {
  const complete = { ...emptyEntry('2026-09-07'), hunger: 2, energy: 4, coffee: 1, protein: true, activity: 30, water: 8, sleepHours: 8, sleepQuality: 4 };
  for (const entry of [complete, { ...complete, sleepHours: 0 }, { ...complete, hunger: 5 }, { ...complete, energy: null }, { ...complete, protein: false }]) {
    expect(generateDailyPlan(entry, getProfile()).insight).toBe(getStatus(entry).message);
    expect(generateDailyPlan(entry, getProfile()).actions).toEqual(getInsights(entry).slice(0, 3));
  }
  expect(getStatus(complete).status).toBe('green');
  expect(getStatus({ ...complete, sleepHours: 0 }).status).toBe('red');
  expect(getStatus({ ...complete, energy: null }).status).toBe('unknown');
  expect(getStatus(complete).message).not.toMatch(/норме|жиросжиган/i);
});
