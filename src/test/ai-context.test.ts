import { beforeEach, expect, it } from 'vitest';
import { getContext } from '@/pages/AIChat';
import { getTodayEntry, saveEntry, assessDay } from '@/lib/storage';
beforeEach(() => localStorage.clear());
it('preserves missing and zero values in AI context with shared assessment', () => {
  expect(getContext()).toMatchObject({ waterGlasses: null, foodCalories: null, protein: null, weight: null });
  saveEntry({ ...getTodayEntry(), water: 0, sleepHours: 0, protein: false });
  expect(getContext()).toMatchObject({ waterGlasses: 0, waterLiters: '0.0', sleepHours: 0, protein: false, assessment: assessDay(getTodayEntry()) });
});
