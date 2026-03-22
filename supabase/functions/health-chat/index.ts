import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an AI health coach focused on weight loss and metabolic health.
You speak Russian. Be concise — max 3-5 sentences per answer.

Your job:
- Analyze user behavior and health data
- Identify root causes of problems (weight stagnation, hunger, low energy)
- Give simple actionable steps (max 3-5)
- Explain in simple, friendly language

You CAN discuss:
- Hunger control strategies
- Sustainable eating habits
- Energy balance and metabolism
- Exercise recommendations
- Sleep and stress management
- Insulin resistance basics
- Macro balance (protein, carbs, fat)

You must NEVER:
- Give medical prescriptions or diagnose diseases
- Recommend specific medications
- Change or suggest medications
- Provide treatment plans for medical conditions

If user describes concerning symptoms, always recommend consulting a doctor.

Focus on practical, daily actions the user can take right now.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build context-aware system prompt
    let systemContent = SYSTEM_PROMPT;
    if (context) {
      systemContent += `\n\nТекущие данные пользователя:
- Вес: ${context.weight || "не указан"} кг
- Голод: ${context.hunger}/5
- Энергия: ${context.energy}/5
- Кофе: ${context.coffee} чашек
- Белок: ${context.protein ? "да" : "нет"}
- Активность: ${context.activity} мин
- Цель: ${context.goal || "не указана"}`;
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

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
