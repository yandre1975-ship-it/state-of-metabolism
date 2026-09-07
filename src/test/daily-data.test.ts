import { beforeEach, expect, it } from 'vitest';
import { getTodayEntry, getEntries, getLast7Days, saveEntry, getToday } from '@/lib/storage';
beforeEach(() => localStorage.clear());
it('keeps unrecorded daily fields null, including historical gaps', () => {
  for (const entry of [getTodayEntry(), ...getLast7Days()]) {
    for (const key of ['weight', 'hunger', 'energy', 'coffee', 'protein', 'activity', 'water', 'sleepHours', 'sleepQuality']) expect(entry[key as keyof typeof entry]).toBeNull();
  }
});
it('round trips explicit zero and false without filling other fields', () => {
  saveEntry({ ...getTodayEntry(), coffee: 0, activity: 0, water: 0, sleepHours: 0, protein: false });
  expect(getTodayEntry()).toMatchObject({ coffee: 0, activity: 0, water: 0, sleepHours: 0, protein: false, energy: null });
});
it('preserves legacy values without guessing whether defaults were intentional', () => {
  const legacy = { date: getToday(), weight: 82, hunger: 2, energy: 3, coffee: 0, protein: false, activity: 0 };
  localStorage.setItem('metabolic_entries', JSON.stringify([legacy]));
  expect(getEntries()[0]).toMatchObject({ ...legacy, water: null, sleepHours: null, sleepQuality: null, legacy: true });
  expect(JSON.parse(localStorage.getItem('metabolic_entries')!)).toEqual([legacy]);
});
