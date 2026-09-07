import { describe, it, expect } from 'vitest';
import { parseTelegramMessage } from '../lib/telegramInbound';

describe('telegramInbound parser', () => {
  it('parses weight', () => {
    expect(parseTelegramMessage('вес 82.3')).toEqual({ type: 'weight', value: 82.3, label: 'Вес' });
    expect(parseTelegramMessage('Весил 90 кг')).toEqual({ type: 'weight', value: 90, label: 'Вес' });
  });
  it('parses water liters', () => {
    expect(parseTelegramMessage('выпил 1,5 л')).toEqual({ type: 'water', value: 1.5, label: 'Вода' });
  });
  it('parses activity minutes', () => {
    expect(parseTelegramMessage('прогулка 40 мин')).toEqual({ type: 'activity', value: 40, label: 'Активность' });
  });
  it('parses hunger and energy scales', () => {
    expect(parseTelegramMessage('голод 3 из 5')).toEqual({ type: 'hunger', value: 3, label: 'Голод' });
    expect(parseTelegramMessage('энергия 4')).toEqual({ type: 'energy', value: 4, label: 'Энергия' });
  });
  it('parses coffee and sleep', () => {
    expect(parseTelegramMessage('кофе 2')).toEqual({ type: 'coffee', value: 2, label: 'Кофе' });
    expect(parseTelegramMessage('спал 7,5 ч')).toEqual({ type: 'sleep', value: 7.5, label: 'Сон' });
  });
  it('falls back to note', () => {
    expect(parseTelegramMessage('чувствую себя отлично')).toEqual({
      type: 'note', note: 'чувствую себя отлично', label: 'Заметка',
    });
  });
});
