// Telegram webhook: принимает входящие сообщения от бота, парсит их
// и записывает в дневник пользователя.
// Секреты (env): TELEGRAM_BOT_TOKEN, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, TELEGRAM_WEBHOOK_SECRET
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface TgUpdate {
  message?: {
    chat: { id: number | string };
    message_id: number;
    text?: string;
    date: number;
  };
}

const ADMIN_HEADERS = { 'Content-Type': 'application/json' };

function createAdmin() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
}

async function tgSend(token: string, chatId: string | number, text: string) {
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  });
}

// ── Парсер естественного языка ──

interface Parsed {
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

function parse(text: string): Parsed | null {
  const t = text.trim();
  let m = t.match(WEIGHT_RE);
  if (m) return { type: 'weight', value: parseFloat(m[1].replace(',', '.')), label: 'Вес' };
  m = t.match(WATER_RE);
  if (m) return { type: 'water', value: parseFloat(m[1].replace(',', '.')), label: 'Вода' };
  m = t.match(ACTIVITY_RE);
  if (m) return { type: 'activity', value: parseInt(m[1], 10), label: 'Активность' };
  m = t.match(HUNGER_RE);
  if (m) return { type: 'hunger', value: parseInt(m[1], 10), label: 'Голод' };
  m = t.match(ENERGY_RE);
  if (m) return { type: 'energy', value: parseInt(m[1], 10), label: 'Энергия' };
  m = t.match(COFFEE_RE);
  if (m) return { type: 'coffee', value: parseInt(m[1], 10), label: 'Кофе' };
  m = t.match(SLEEP_RE);
  if (m) return { type: 'sleep', value: parseFloat(m[1].replace(',', '.')), label: 'Сон' };
  return null;
}

// ── Запись в дневник ──

function todayLocal(): string {
  return new Date().toISOString().slice(0, 10);
}

async function applyToDiary(
  admin: ReturnType<typeof createClient>,
  userId: string,
  p: Parsed
): Promise<string> {
  const date = todayLocal();

  if (p.type === 'note') {
    // заметки хранятся в таблице telegram_messages, в дневник не пишем
    return 'Заметка сохранена.';
  }

  if (p.type === 'weight') {
    await admin.from('daily_entries').upsert(
      { user_id: userId, date, weight: p.value },
      { onConflict: 'user_id,date' }
    );
    return `Вес записан: ${p.value} кг`;
  }

  // Остальные поля — upsert с обновлением конкретного поля.
  const { data: existing } = await admin
    .from('daily_entries')
    .select('id, water, activity, hunger, energy, coffee, sleepHours')
    .eq('user_id', userId)
    .eq('date', date)
    .maybeSingle();

  const patch: Record<string, unknown> = { user_id: userId, date };

  switch (p.type) {
    case 'water':
      // «выпил 1.5 л» → стаканы по 250 мл, поверх существующего
      patch.water = (existing?.water ?? 0) + Math.round((p.value ?? 0) * 4);
      break;
    case 'activity':
      patch.activity = (existing?.activity ?? 0) + (p.value ?? 0);
      break;
    case 'hunger':
      patch.hunger = p.value;
      break;
    case 'energy':
      patch.energy = p.value;
      break;
    case 'coffee':
      patch.coffee = (existing?.coffee ?? 0) + (p.value ?? 0);
      break;
    case 'sleep':
      patch.sleepHours = p.value;
      break;
  }

  const { error } = await admin.from('daily_entries').upsert(patch, { onConflict: 'user_id,date' });
  if (error) throw error;
  return `${p.label} записано: ${p.value}${p.type === 'water' ? ' л' : p.type === 'activity' ? ' мин' : p.type === 'sleep' ? ' ч' : ''}`;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('ok');
  }

  const secret = Deno.env.get('TELEGRAM_WEBHOOK_SECRET');
  if (secret && req.headers.get('x-telegram-bot-api-secret-token') !== secret) {
    return new Response('forbidden', { status: 403 });
  }

  const token = Deno.env.get('TELEGRAM_BOT_TOKEN');
  if (!token) {
    return new Response(JSON.stringify({ error: 'TELEGRAM_BOT_TOKEN not configured' }), { status: 500 });
  }

  let update: TgUpdate;
  try {
    update = await req.json();
  } catch {
    return new Response('ok'); // не распарсилось — не роняем webhook
  }

  const msg = update.message;
  if (!msg?.text) return new Response('ok');

  const chatId = String(msg.chat.id);
  const text = msg.text.trim();
  const admin = createAdmin();

  try {
    // 1. Найти пользователя по chat_id
    const { data: profile } = await admin
      .from('profiles')
      .select('id, name')
      .eq('telegram_chat_id', chatId)
      .maybeSingle();

    if (!profile) {
      await tgSend(token, chatId,
        'Чат не привязан. Открой приложение → Профиль → Настройки → Telegram и укажи этот chat_id: ' + chatId);
      return new Response('ok');
    }

    // 2. Команды
    if (text.startsWith('/start')) {
      await tgSend(token, chatId,
        `Привет, ${profile.name || 'друг'}! Пиши мне простым языком:\n` +
        '• «вес 82.3» — вес\n• «выпил 1.5 л» — вода\n• «прогулка 40 мин» — активность\n' +
        '• «голод 3 из 5», «энергия 4», «кофе 2», «спал 7.5 ч»\n\nВсё попадёт в дневник и учтётся ИИ-коучем.');
      return new Response('ok');
    }

    // 3. Парсим и применяем
    const parsed = parse(text);
    const { data: saved, error: saveErr } = await admin
      .from('telegram_messages')
      .insert({
        user_id: profile.id,
        chat_id: chatId,
        message_id: msg.message_id,
        text,
        parsed: parsed ?? null,
        applied: !!parsed,
      })
      .select()
      .single();
    if (saveErr) throw saveErr;

    if (!parsed) {
      await tgSend(token, chatId, 'Записал как заметку. Пока не распознал значения — пиши, например: «вес 82».');
    } else {
      const reply = await applyToDiary(admin, profile.id, parsed);
      // пометим применённость
      await admin.from('telegram_messages').update({ applied: true }).eq('id', saved.id);
      await tgSend(token, chatId, '✅ ' + reply);
    }

    return new Response('ok');
  } catch (e) {
    console.error('webhook error', e);
    try {
      await tgSend(token, chatId, 'Не получилось записать: ' + (e instanceof Error ? e.message : 'unknown'));
    } catch {}
    return new Response('ok');
  }
});

ADMIN_HEADERS; // (не используется напрямую, для консистентности типов)
