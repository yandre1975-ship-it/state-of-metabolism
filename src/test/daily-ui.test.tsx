import { beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import FoodDiary from '@/pages/FoodDiary';
import Dashboard from '@/pages/Dashboard';
import WeeklyReview from '@/pages/WeeklyReview';
import { getTodayEntry, saveEntry } from '@/lib/storage';
vi.mock('@/components/ExerciseTracker', () => ({ default: () => null }));
beforeEach(() => { cleanup(); localStorage.clear(); });
it('has explicit missing, zero and false states and clears input back to missing', () => {
  render(<FoodDiary />);
  expect(screen.getByLabelText('Активность (мин)')).toHaveValue(null);
  fireEvent.change(screen.getByLabelText('Активность (мин)'), { target: { value: '0' } });
  expect(screen.getByLabelText('Активность (мин)')).toHaveValue(0);
  expect(getTodayEntry().activity).toBe(0);
  fireEvent.change(screen.getByLabelText('Активность (мин)'), { target: { value: '' } });
  expect(getTodayEntry().activity).toBeNull();
  fireEvent.change(screen.getByLabelText('Белок в рационе'), { target: { value: 'false' } });
  expect(getTodayEntry().protein).toBe(false);
  fireEvent.change(screen.getByLabelText('Голод'), { target: { value: '3' } });
  expect(getTodayEntry().hunger).toBe(3);
});
it('does not render unrecorded dashboard fields as zero or medical normality', () => {
  const { container } = render(<Dashboard />);
  expect(container.textContent).toContain('Голод —');
  expect(container.textContent).toContain('Энергия —');
  expect(container.textContent).not.toMatch(/жиросжиган|показатели в норме|null\/5/i);
});
it('refreshes banner immediately and avoids calorie-burning commands at low energy', () => {
  const { container } = render(<FoodDiary />);
  fireEvent.change(screen.getByLabelText('Энергия'), { target: { value: '1' } });
  expect(container.textContent).toContain('Самочувствие требует внимания');
  expect(container.textContent).not.toContain('Сожгите');
});
it('empty food log is not zero intake', () => {
  const { container } = render(<FoodDiary />);
  expect(container.textContent).toContain('Записано: — ккал');
});
it('weekly statistics exclude missing days but include recorded zero sleep', () => {
  saveEntry({ ...getTodayEntry(), sleepHours: 0, activity: 0 });
  const { container } = render(<WeeklyReview />);
  expect(container.textContent).toContain('Ср. 0 ч');
  expect(container.textContent).not.toMatch(/кортизол|Все показатели в хорошей зоне/);
});
