import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Expose-Headers": "X-Agent-Role, X-Agent-Label, X-Agent-Emoji",
};

// ── Agent Definitions ──

type AgentRole = "coach" | "nutrition" | "training" | "risk" | "reminder";

interface AgentConfig {
  role: AgentRole;
  label: string;
  emoji: string;
  prompt: string;
}

const AGENTS: Record<AgentRole, AgentConfig> = {
  coach: {
    role: "coach",
    label: "Коуч",
    emoji: "🧠",
    prompt: `Ты — AI-коуч по здоровью и мотивации. Говоришь по-русски. Краток (3-5 предложений).

Твоя задача:
- Мотивировать пользователя и поддерживать
- Объяснять простым языком почему что-то происходит с телом
- Помогать формировать устойчивые привычки
- Давать конкретные, выполнимые шаги (макс 3)
- Задавать вопросы чтобы лучше понять состояние

Стиль: дружелюбный, энергичный, но без давления. Как личный тренер-друг.
Если не знаешь ответа — честно скажи. Не давай медицинских рекомендаций.`,
  },

  nutrition: {
    role: "nutrition",
    label: "Нутрициолог",
    emoji: "🥗",
    prompt: `Ты — AI-нутрициолог, специалист по питанию и метаболизму. Говоришь по-русски. Краток.

Твоя задача:
- Считать и анализировать питание пользователя
- Предлагать замены продуктов (более полезные альтернативы)
- Следить за аппетитом и углеводной нагрузкой
- Объяснять влияние еды на голод, энергию, вес
- Давать конкретные рекомендации что есть прямо сейчас

Знания:
- Инсулинорезистентность: снижать простые углеводы, увеличить белок и клетчатку
- Контроль голода: белок + клетчатка + жиры в каждом приёме
- Кортизол: избегать кофе натощак, не пропускать приёмы пищи
- Гипотиреоз: йод, селен, достаточно калорий (не голодать)

НЕЛЬЗЯ: назначать БАДы, лекарства, диагностировать болезни.`,
  },

  training: {
    role: "training",
    label: "Тренер",
    emoji: "💪",
    prompt: `Ты — AI-тренер по физической активности. Говоришь по-русски. Краток.

Твоя задача:
- Подбирать физнагрузку с учётом веса, сна, самочувствия
- Учитывать уровень энергии — если энергия низкая, предлагать лёгкие варианты
- Рекомендовать упражнения для дома без оборудования
- Адаптировать под лишний вес (без прыжков, щадящие для суставов)
- Объяснять связь активности и метаболизма

Правила:
- Если сон < 6 часов — рекомендовать только лёгкую прогулку
- Если энергия 1-2/5 — только растяжка или дыхательные упражнения
- Если вес > 100кг — исключить бег и прыжки, фокус на ходьбе и силовых
- Всегда указывать примерные калории которые сожжёт упражнение

НЕЛЬЗЯ: рекомендовать при болях без врача, спорт при плохом самочувствии.`,
  },

  risk: {
    role: "risk",
    label: "Аналитик рисков",
    emoji: "🛡️",
    prompt: `Ты — AI-аналитик здоровья и безопасности. Говоришь по-русски. Краток но серьёзен.

Твоя задача:
- Отслеживать красные флаги в данных пользователя
- Предупреждать о рисках (переедание, истощение, перетренированность)
- Не давать опасных рекомендаций
- Рекомендовать обращение к врачу при тревожных симптомах

Красные флаги:
- Голод 5/5 постоянно → риск срыва, возможный дефицит калорий
- Энергия 1/5 более 3 дней → возможное заболевание
- Вес падает > 1кг/неделю → слишком агрессивный дефицит
- Сон < 5 часов регулярно → риск гормональных нарушений
- Кофе > 3 чашек + низкая энергия → зависимость от стимуляторов

Всегда начинай с главного риска. Предложи 1-2 конкретных действия для снижения риска.
Если симптомы серьёзные — НАСТОЯТЕЛЬНО рекомендуй врача.`,
  },

  reminder: {
    role: "reminder",
    label: "Планировщик",
    emoji: "📋",
    prompt: `Ты — AI-планировщик ежедневных действий. Говоришь по-русски. Ультра-краток.

Твоя задача:
- Формировать чёткий план действий на основе данных
- Давать конкретные напоминания с привязкой ко времени
- Адаптировать план под текущее состояние
- Предлагать простые задания которые легко выполнить

Формат ответа:
Всегда давай план в виде списка с конкретными действиями и временем.
Например:
• Сейчас: выпить стакан воды
• Через 1 час: перекус (творог + орехи)
• Вечером: прогулка 20 минут

Максимум 3-5 пунктов. Каждый пункт — одно действие.`,
  },
};

// ── Agent Router ──
// Classifies user message to the right agent based on keywords

function routeToAgent(message: string, context: any): AgentRole {
  const lower = message.toLowerCase();

  // Risk detection first (safety priority)
  const riskKeywords = ["боль", "болит", "тошн", "голов", "давлен", "сердц", "опасн", "врач", "больниц", "плох себя", "ужасн", "симптом", "кров", "обморок", "головокруж"];
  if (riskKeywords.some(k => lower.includes(k))) return "risk";

  // Check context for risk signals
  if (context) {
    if (context.hunger >= 5 || context.energy <= 1) return "risk";
    if (context.sleepHours && context.sleepHours < 5 && context.energy <= 2) return "risk";
  }

  // Nutrition keywords
  const nutritionKeywords = ["есть", "еда", "едь", "съесть", "калори", "белок", "углевод", "жир", "питан", "завтрак", "обед", "ужин", "перекус", "голод", "аппетит", "диет", "продукт", "рацион", "макро", "порц", "готови", "рецепт", "сахар", "инсулин"];
  if (nutritionKeywords.some(k => lower.includes(k))) return "nutrition";

  // Training keywords
  const trainingKeywords = ["трениров", "упражнен", "спорт", "физ", "ходьб", "бег", "приседан", "отжиман", "планк", "активност", "шаг", "нагрузк", "разминк", "растяжк", "мышц", "кардио", "сжеч", "сжига"];
  if (trainingKeywords.some(k => lower.includes(k))) return "training";

  // Reminder/plan keywords
  const planKeywords = ["план", "расписан", "напомн", "режим", "когда", "во сколько", "распоряд", "сегодня делать", "задач", "задани", "что дальше", "совет на"];
  if (planKeywords.some(k => lower.includes(k))) return "reminder";

  // Default to coach
  return "coach";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, context, agent: requestedAgent } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Determine which agent to use
    const lastUserMsg = [...messages].reverse().find((m: any) => m.role === "user")?.content || "";
    const agentRole: AgentRole = requestedAgent || routeToAgent(lastUserMsg, context);
    const agent = AGENTS[agentRole];

    // Build context-aware system prompt
    let systemContent = agent.prompt;

    if (context) {
      systemContent += `\n\nТекущие данные пользователя:
- Имя: ${context.name || "не указано"}
- Вес: ${context.weight || "не указан"} кг
- Голод: ${context.hunger}/5
- Энергия: ${context.energy}/5
- Кофе: ${context.coffee} чашек
- Белок: ${context.protein ? "да" : "нет"}
- Активность: ${context.activity} мин
- Цель: ${context.goal || "не указана"}
- Сон: ${context.sleepHours || "не указан"} ч (качество: ${context.sleepQuality || "не указано"}/5)
- Вода: ${context.waterLiters || "не указано"} л`;
      if (context.conditions?.length) {
        systemContent += `\n- Состояние здоровья: ${context.conditions.join(", ")}`;
      }
    }

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemContent },
            ...messages,
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Слишком много запросов. Подождите немного." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Лимит AI-запросов исчерпан." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "Ошибка AI-сервиса" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Return streamed response with agent info header
    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "X-Agent-Role": agentRole,
        "X-Agent-Label": encodeURIComponent(agent.label),
        "X-Agent-Emoji": encodeURIComponent(agent.emoji),
      },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
