import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/telegram';

const REMINDERS: Record<string, { hour: number; title: string; body: string }> = {
  morning: {
    hour: 8,
    title: '🌅 Утренний план',
    body: 'Доброе утро! Посмотрите ваш план на сегодня и начните день правильно. Откройте приложение для деталей!',
  },
  lunch: {
    hour: 13,
    title: '🍽️ Время обеда',
    body: 'Не забудьте добавить белок в обед и записать приём пищи в дневник!',
  },
  evening: {
    hour: 20,
    title: '📋 Вечерний чек-ин',
    body: 'Как прошёл день? Заполните дневник и проверьте выполнение плана.',
  },
};

Deno.serve(async () => {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }), { status: 500 });
  }

  const TELEGRAM_API_KEY = Deno.env.get('TELEGRAM_API_KEY');
  if (!TELEGRAM_API_KEY) {
    return new Response(JSON.stringify({ error: 'TELEGRAM_API_KEY not configured' }), { status: 500 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const now = new Date();
  const currentHour = now.getUTCHours() + 3; // Moscow time (UTC+3)

  // Find which reminder to send based on current hour
  let reminderType: string | null = null;
  for (const [type, config] of Object.entries(REMINDERS)) {
    if (config.hour === currentHour) {
      reminderType = type;
      break;
    }
  }

  if (!reminderType) {
    return new Response(JSON.stringify({ ok: true, message: 'No reminder for this hour' }));
  }

  const reminder = REMINDERS[reminderType];

  // Get all users with telegram_chat_id set
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('telegram_chat_id')
    .not('telegram_chat_id', 'is', null);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  let sent = 0;
  for (const profile of (profiles || [])) {
    if (!profile.telegram_chat_id) continue;

    try {
      const response = await fetch(`${GATEWAY_URL}/sendMessage`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'X-Connection-Api-Key': TELEGRAM_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: profile.telegram_chat_id,
          text: `${reminder.title}\n\n${reminder.body}`,
          parse_mode: 'HTML',
        }),
      });

      if (response.ok) sent++;
      else await response.text();
    } catch (e) {
      console.error('Failed to send to', profile.telegram_chat_id, e);
    }
  }

  return new Response(JSON.stringify({ ok: true, sent, type: reminderType }));
});
