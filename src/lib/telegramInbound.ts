/**
 * Парсер входящих Telegram-сообщений → записи дневника.
 * Общая логика с Edge Function telegram-webhook (там Deno-версия).
 */
export interface TgParsed {
  type: 'weight' | 'water' | 'activity' | 'hunger' | 'energy' | 'coffee' | 'sleep' | 'note';
  value?: number;
  note?: string;
  label: string;
}

const WEIGHT_RE = /(?:вес|весил|весила)\D*(\d{2,3}(?:[.,]\d)?)/i;
const WATER_RE = /(?:вод\w*|выпил|выпила)\D*(\d{1,2}(?:[.,]\d)?)\s*(?:л|litre|liter)?/i;
const ACTIVITY_RE = /(?:ходил|ходила|шаг\w*|прогулк\w*|активност\w*|бег\w*|трен\w*)\D*(\d{1,4})\s*(?:мин|м)?/i;
const HUNGER_RE = /(?:голод\w*)\D*(\d)\s*(?:\/\s*5|из\s*5)?/i;
const ENERGY_RE = /(?:энерг\w*|сил\w*)\D*(\d)\s*(?:\/\s*5|из\s*5)?/i;
const COFFEE_RE = /(?:кофе|чаш\w* кофе)\D*(\d)/i;
const SLEEP_RE = /(?:спал|спала|сон)\D*(\d{1,2}(?:[.,]\d)?)\s*(?:ч|час)/i;

const num = (s: string) => parseFloat(s.replace(',', '.'));

export function parseTelegramMessage(text: string): TgParsed | null {
  const t = text.trim();
  let m = t.match(WEIGHT_RE);
  if (m) return { type: 'weight', value: num(m[1]), label: 'Вес' };
  m = t.match(WATER_RE);
  if (m) return { type: 'water', value: num(m[1]), label: 'Вода' };
  m = t.match(ACTIVITY_RE);
  if (m) return { type: 'activity', value: parseInt(m[1], 10), label: 'Активность' };
  m = t.match(HUNGER_RE);
  if (m) return { type: 'hunger', value: parseInt(m[1], 10), label: 'Голод' };
  m = t.match(ENERGY_RE);
  if (m) return { type: 'energy', value: parseInt(m[1], 10), label: 'Энергия' };
  m = t.match(COFFEE_RE);
  if (m) return { type: 'coffee', value: parseInt(m[1], 10), label: 'Кофе' };
  m = t.match(SLEEP_RE);
  if (m) return { type: 'sleep', value: num(m[1]), label: 'Сон' };
  if (t.length > 0) return { type: 'note', note: t, label: 'Заметка' };
  return null;
}
