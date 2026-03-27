import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/telegram';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }), { status: 500, headers: corsHeaders });
  }

  const TELEGRAM_API_KEY = Deno.env.get('TELEGRAM_API_KEY');
  if (!TELEGRAM_API_KEY) {
    return new Response(JSON.stringify({ error: 'TELEGRAM_API_KEY not configured' }), { status: 500, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const userId = claimsData.claims.sub;

    const { type, chat_id, text } = await req.json();

    // If type is 'test', send a test message
    // If type is 'daily_summary', compile and send daily summary
    // If type is 'reminder', send a reminder message

    let chatId = chat_id;

    // If no chat_id provided, get from profile
    if (!chatId) {
      const adminClient = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );
      const { data: profile } = await adminClient
        .from('profiles')
        .select('telegram_chat_id')
        .eq('id', userId)
        .single();

      chatId = profile?.telegram_chat_id;
    }

    if (!chatId) {
      return new Response(JSON.stringify({ error: 'No Telegram chat ID configured' }), { status: 400, headers: corsHeaders });
    }

    let message = text || '';

    if (type === 'daily_summary') {
      // Fetch today's data
      const adminClient = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );

      const today = new Date().toISOString().slice(0, 10);

      const [entryRes, foodRes, exerciseRes, profileRes] = await Promise.all([
        adminClient.from('daily_entries').select('*').eq('user_id', userId).eq('date', today).maybeSingle(),
        adminClient.from('food_entries').select('*').eq('user_id', userId).eq('date', today).maybeSingle(),
        adminClient.from('exercise_entries').select('*').eq('user_id', userId).eq('date', today).maybeSingle(),
        adminClient.from('profiles').select('*').eq('id', userId).single(),
      ]);

      const entry = entryRes.data;
      const food = foodRes.data;
      const exercises = exerciseRes.data;
      const profile = profileRes.data;

      const foodItems = (food?.items as any[]) || [];
      const totals = foodItems.reduce(
        (a: any, i: any) => ({
          cal: a.cal + (i.calories || 0),
          p: a.p + (i.protein || 0),
          c: a.c + (i.carbs || 0),
          f: a.f + (i.fat || 0),
        }),
        { cal: 0, p: 0, c: 0, f: 0 }
      );

      const exerciseItems = (exercises?.items as any[]) || [];
      const doneExercises = exerciseItems.filter((i: any) => i.done).length;

      message = `📊 <b>Итоги дня — ${today}</b>\n\n`;

      if (entry?.weight) message += `⚖️ Вес: ${entry.weight} кг\n`;
      if (entry) {
        message += `😊 Голод: ${entry.hunger}/5 | Энергия: ${entry.energy}/5\n`;
        message += `☕ Кофе: ${entry.coffee} | 🏃 Активность: ${entry.activity} мин\n`;
        message += `🥩 Белок: ${entry.protein ? '✅' : '❌'}\n`;
      }

      message += `\n🍽️ <b>Питание:</b>\n`;
      message += `Калории: ${Math.round(totals.cal)} ккал\n`;
      message += `Белки: ${Math.round(totals.p)}г | Углеводы: ${Math.round(totals.c)}г | Жиры: ${Math.round(totals.f)}г\n`;

      if (doneExercises > 0) {
        message += `\n💪 Выполнено упражнений: ${doneExercises}/${exerciseItems.length}\n`;
      }

      message += `\n✨ Отличная работа! Продолжайте завтра!`;
    }

    if (type === 'test') {
      message = '✅ Бот подключён! Уведомления будут приходить сюда.';
    }

    // Send via gateway
    const response = await fetch(`${GATEWAY_URL}/sendMessage`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': TELEGRAM_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(`Telegram API failed [${response.status}]: ${JSON.stringify(data)}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
