import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, Loader2, AlertCircle, Brain, Salad, Dumbbell, Shield, ClipboardList, Mic, MicOff, Volume2, VolumeX, UtensilsCrossed } from 'lucide-react';
import { getTodayEntry, getProfile, getStatus, getTodayFood, saveDailyFood, type FoodItem } from '@/lib/storage';
import ReactMarkdown from 'react-markdown';

type AgentRole = 'coach' | 'nutrition' | 'training' | 'risk' | 'reminder';

type Msg = { role: 'user' | 'assistant'; content: string; agent?: AgentRole };

// Parse food items from nutritionist markdown response
function parseFoodFromMessage(text: string): { name: string; grams: number; calories: number; protein: number; carbs: number; fat: number }[] {
  const items: { name: string; grams: number; calories: number; protein: number; carbs: number; fat: number }[] = [];
  // Match patterns like: **Куриная грудка** (150г) — 165 ккал, Б25, У0, Ж3
  // Or: Куриная грудка — 150г, 165 ккал
  const lines = text.split('\n');
  for (const line of lines) {
    // Pattern: name (Xг) — Y ккал, БZ, УW, ЖV
    const match1 = line.match(/\*{0,2}([^*\n(]+?)\*{0,2}\s*\((\d+)\s*г\)\s*[—–-]\s*(\d+)\s*ккал[\s,]*Б\s*(\d+)[\s,]*У\s*(\d+)[\s,]*Ж\s*(\d+)/i);
    if (match1) {
      items.push({ name: match1[1].trim(), grams: +match1[2], calories: +match1[3], protein: +match1[4], carbs: +match1[5], fat: +match1[6] });
      continue;
    }
    // Pattern: name — Xг, Y ккал, БZ
    const match2 = line.match(/\*{0,2}([^*\n—–-]+?)\*{0,2}\s*[—–-]\s*(\d+)\s*г[\s,]*(\d+)\s*ккал/i);
    if (match2) {
      const proteinM = line.match(/Б\s*(\d+)/i);
      const carbsM = line.match(/У\s*(\d+)/i);
      const fatM = line.match(/Ж\s*(\d+)/i);
      items.push({
        name: match2[1].trim(), grams: +match2[2], calories: +match2[3],
        protein: proteinM ? +proteinM[1] : 0, carbs: carbsM ? +carbsM[1] : 0, fat: fatM ? +fatM[1] : 0,
      });
    }
  }
  return items;
}

const AGENT_META: Record<AgentRole, { label: string; emoji: string; icon: typeof Brain; color: string }> = {
  coach:     { label: 'Коуч',           emoji: '🧠', icon: Brain,         color: 'text-blue-500' },
  nutrition: { label: 'Нутрициолог',    emoji: '🥗', icon: Salad,         color: 'text-emerald-500' },
  training:  { label: 'Тренер',         emoji: '💪', icon: Dumbbell,      color: 'text-orange-500' },
  risk:      { label: 'Аналитик рисков',emoji: '🛡️', icon: Shield,        color: 'text-red-500' },
  reminder:  { label: 'Планировщик',    emoji: '📋', icon: ClipboardList, color: 'text-violet-500' },
};

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/health-chat`;

const QUICK_QUESTIONS: { text: string; agent?: AgentRole }[] = [
  { text: 'Что мне сейчас съесть?', agent: 'nutrition' },
  { text: 'Какое упражнение сделать?', agent: 'training' },
  { text: 'Составь план на вечер', agent: 'reminder' },
  { text: 'Как я сегодня?', agent: 'coach' },
];

function getContext() {
  const entry = getTodayEntry();
  const profile = getProfile();
  return {
    weight: entry.weight,
    hunger: entry.hunger,
    energy: entry.energy,
    coffee: entry.coffee,
    protein: entry.protein,
    activity: entry.activity,
    goal: profile.goal,
    conditions: profile.conditions,
    name: profile.name,
    sleepHours: entry.sleepHours,
    sleepQuality: entry.sleepQuality,
    waterLiters: ((entry.water || 0) * 250 / 1000).toFixed(1),
  };
}

function buildProactivePrompt(): string {
  const entry = getTodayEntry();
  const profile = getProfile();
  const { status } = getStatus(entry);
  const hour = new Date().getHours();

  const parts: string[] = [];

  if (hour < 11) parts.push('Сейчас утро.');
  else if (hour < 15) parts.push('Сейчас середина дня.');
  else if (hour < 19) parts.push('Сейчас вторая половина дня.');
  else parts.push('Сейчас вечер.');

  if (status === 'red') {
    if (entry.hunger >= 4) {
      parts.push('У пользователя высокий голод (4-5/5). Это риск переедания. Начни разговор с этого.');
    } else if (entry.energy <= 2) {
      parts.push('У пользователя очень низкая энергия. Начни с поддержки.');
    }
  } else if (status === 'yellow') {
    parts.push('Состояние пограничное. Дай 1-2 конкретных совета.');
  } else {
    parts.push('Показатели хорошие. Похвали и дай один совет.');
  }

  if (!entry.protein && hour > 10) parts.push('Белок ещё не отмечен.');
  if (entry.activity < 20 && hour > 14) parts.push('Активность пока низкая.');
  if (entry.coffee > 2) parts.push('Много кофе.');
  if ((entry.sleepHours || 0) > 0 && entry.sleepHours < 6) parts.push('Мало сна — упомяни важность восстановления.');

  parts.push(`Обратись по имени (${profile.name || 'друг'}). Будь кратким (2-4 предложения). Задай вопрос.`);

  return parts.join(' ');
}

export default function AIChat() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeAgent, setActiveAgent] = useState<AgentRole | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const greetedRef = useRef(false);

  // Voice state
  const [isListening, setIsListening] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef(window.speechSynthesis);

  const speakText = useCallback((text: string) => {
    if (!autoSpeak) return;
    synthRef.current.cancel();
    // Strip markdown
    const clean = text.replace(/[*_#`>\-\[\]()!]/g, '').replace(/\n+/g, '. ');
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = 'ru-RU';
    utterance.rate = 1.05;
    utterance.pitch = 1;
    // Try to pick a Russian voice
    const voices = synthRef.current.getVoices();
    const ruVoice = voices.find((v: SpeechSynthesisVoice) => v.lang.startsWith('ru'));
    if (ruVoice) utterance.voice = ruVoice;
    synthRef.current.speak(utterance);
  }, [autoSpeak]);

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Голосовой ввод не поддерживается в этом браузере');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'ru-RU';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setInput(transcript);
      if (event.results[0]?.isFinal) {
        setIsListening(false);
      }
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const streamAI = useCallback(async (
    allMessages: Msg[],
    onChunk: (soFar: string, agent?: AgentRole) => void,
    requestedAgent?: AgentRole,
  ): Promise<{ content: string; agent: AgentRole }> => {
    const context = getContext();
    const resp = await fetch(CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({
        messages: allMessages.map(m => ({ role: m.role, content: m.content })),
        context,
        agent: requestedAgent,
      }),
    });

    if (!resp.ok) {
      const data = await resp.json().catch(() => ({ error: 'Ошибка сервера' }));
      throw new Error(data.error || `Ошибка: ${resp.status}`);
    }

    if (!resp.body) throw new Error('Нет ответа от сервера');

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = '';
    let assistantSoFar = '';
    let streamDone = false;
    let agentRole: AgentRole = requestedAgent || 'coach';

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);
        if (line.endsWith('\r')) line = line.slice(0, -1);
        if (line.startsWith(':') || line.trim() === '') continue;
        if (!line.startsWith('data: ')) continue;
        const jsonStr = line.slice(6).trim();
        if (jsonStr === '[DONE]') { streamDone = true; break; }
        try {
          const parsed = JSON.parse(jsonStr);
          // Check for agent info event (sent first by our edge function)
          if (parsed.agent) {
            agentRole = parsed.agent.role as AgentRole;
            setActiveAgent(agentRole);
            onChunk('', agentRole);
            continue;
          }
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) { assistantSoFar += content; onChunk(assistantSoFar, agentRole); }
        } catch {
          textBuffer = line + '\n' + textBuffer;
          break;
        }
      }
    }

    if (textBuffer.trim()) {
      for (let raw of textBuffer.split('\n')) {
        if (!raw) continue;
        if (raw.endsWith('\r')) raw = raw.slice(0, -1);
        if (raw.startsWith(':') || raw.trim() === '') continue;
        if (!raw.startsWith('data: ')) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === '[DONE]') continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) { assistantSoFar += content; onChunk(assistantSoFar, agentRole); }
        } catch { /* ignore */ }
      }
    }

    return { content: assistantSoFar, agent: agentRole };
  }, []);

  const upsertAssistant = useCallback((soFar: string, agent?: AgentRole) => {
    setMessages(prev => {
      const last = prev[prev.length - 1];
      if (last?.role === 'assistant') {
        return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: soFar, agent: agent || m.agent } : m);
      }
      return [...prev, { role: 'assistant', content: soFar, agent }];
    });
  }, []);

  // Proactive greeting
  useEffect(() => {
    if (greetedRef.current) return;
    greetedRef.current = true;

    const greet = async () => {
      setIsLoading(true);
      try {
        const proactivePrompt = buildProactivePrompt();
        const initMessages: Msg[] = [{ role: 'user', content: proactivePrompt }];
        const result = await streamAI(initMessages, (s, a) => upsertAssistant(s, a), 'coach');
        upsertAssistant(result.content, result.agent);
        speakText(result.content);
      } catch (e) {
        console.error('Proactive greeting error:', e);
        setMessages([{
          role: 'assistant',
          content: `Привет, ${getProfile().name || 'друг'}! 👋 Я ваш AI-коуч. Как вы себя сегодня чувствуете?`,
          agent: 'coach',
        }]);
      }
      setIsLoading(false);
    };
    greet();
  }, [streamAI, upsertAssistant]);

  const sendMessage = async (text: string, requestedAgent?: AgentRole) => {
    if (!text.trim() || isLoading) return;
    setError(null);

    const userMsg: Msg = { role: 'user', content: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const result = await streamAI(
        [...messages, userMsg],
        (s, a) => upsertAssistant(s, a),
        requestedAgent,
      );
      // Final update with agent info
      upsertAssistant(result.content, result.agent);
      speakText(result.content);
    } catch (e: any) {
      console.error('Chat error:', e);
      setError(e.message || 'Не удалось подключиться к AI');
    }

    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] animate-in fade-in duration-300">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 pb-4">
        {messages.length === 0 && !isLoading && (
          <div className="text-center pt-12 space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-foreground text-background flex items-center justify-center mx-auto">
              <Bot size={28} />
            </div>
            <div>
              <h3 className="font-semibold text-lg">AI Health Team</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-[260px] mx-auto leading-relaxed">
                5 специализированных агентов
              </p>
            </div>
            {/* Agent cards */}
            <div className="grid grid-cols-5 gap-1.5 px-2 max-w-sm mx-auto">
              {(Object.entries(AGENT_META) as [AgentRole, typeof AGENT_META[AgentRole]][]).map(([role, meta]) => (
                <div key={role} className="flex flex-col items-center gap-1 p-2 rounded-xl bg-card border">
                  <span className="text-lg">{meta.emoji}</span>
                  <span className="text-[9px] text-muted-foreground leading-tight text-center">{meta.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => {
          const agentMeta = msg.agent ? AGENT_META[msg.agent] : null;
          return (
            <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : ''}`}>
              {msg.role === 'assistant' && (
                <div className="flex flex-col items-center gap-0.5 flex-shrink-0 mt-1">
                  <div className={`w-7 h-7 rounded-lg bg-foreground text-background flex items-center justify-center`}>
                    {agentMeta ? <span className="text-xs">{agentMeta.emoji}</span> : <Bot size={14} />}
                  </div>
                </div>
              )}
              <div className={`max-w-[80%] ${msg.role === 'user' ? '' : ''}`}>
                {msg.role === 'assistant' && agentMeta && (
                  <span className={`text-[10px] font-medium ${agentMeta.color} mb-0.5 block`}>
                    {agentMeta.label}
                  </span>
                )}
                <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed relative group
                  ${msg.role === 'user'
                    ? 'bg-foreground text-background rounded-br-md'
                    : 'bg-card border rounded-bl-md'}`}>
                  {msg.role === 'assistant' ? (
                    <>
                      <div className="prose prose-sm max-w-none [&_p]:mb-1.5 [&_ul]:mb-1.5 [&_li]:mb-0.5">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                      <button
                        onClick={() => {
                          synthRef.current.cancel();
                          const clean = msg.content.replace(/[*_#`>\-\[\]()!]/g, '').replace(/\n+/g, '. ');
                          const utt = new SpeechSynthesisUtterance(clean);
                          utt.lang = 'ru-RU';
                          utt.rate = 1.05;
                          const voices = synthRef.current.getVoices();
                          const ruVoice = voices.find((v: SpeechSynthesisVoice) => v.lang.startsWith('ru'));
                          if (ruVoice) utt.voice = ruVoice;
                          synthRef.current.speak(utt);
                        }}
                        className="absolute bottom-1.5 right-1.5 w-6 h-6 rounded-md bg-secondary/80 text-muted-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity active:scale-90"
                        title="Прослушать"
                      >
                        <Volume2 size={11} />
                      </button>
                    </>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0 mt-1">
                  <User size={14} />
                </div>
              )}
            </div>
          );
        })}

        {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="flex gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-foreground text-background flex items-center justify-center flex-shrink-0">
              {activeAgent ? <span className="text-xs">{AGENT_META[activeAgent].emoji}</span> : <Bot size={14} />}
            </div>
            <div>
              {activeAgent && (
                <span className={`text-[10px] font-medium ${AGENT_META[activeAgent].color} mb-0.5 block`}>
                  {AGENT_META[activeAgent].label} думает...
                </span>
              )}
              <div className="bg-card border rounded-2xl rounded-bl-md px-4 py-3">
                <Loader2 size={16} className="animate-spin text-muted-foreground" />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-status-red-bg mx-2">
            <AlertCircle size={14} className="text-status-red flex-shrink-0 mt-0.5" />
            <p className="text-xs text-status-red">{error}</p>
          </div>
        )}
      </div>

      {/* Quick questions after greeting */}
      {messages.length === 1 && messages[0].role === 'assistant' && !isLoading && (
        <div className="flex flex-wrap gap-2 pb-3 px-1">
          {QUICK_QUESTIONS.map(q => {
            const meta = q.agent ? AGENT_META[q.agent] : null;
            return (
              <button key={q.text} onClick={() => sendMessage(q.text, q.agent)}
                className="px-3 py-2 rounded-xl bg-card border text-xs font-medium active:scale-95 transition-all hover:bg-secondary flex items-center gap-1.5">
                {meta && <span className="text-sm">{meta.emoji}</span>}
                {q.text}
              </button>
            );
          })}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2 pt-3 border-t items-center">
        {/* TTS toggle */}
        <button
          onClick={() => {
            setAutoSpeak(prev => {
              if (prev) synthRef.current.cancel();
              return !prev;
            });
          }}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95 flex-shrink-0
            ${autoSpeak ? 'bg-emerald-500 text-white' : 'bg-secondary text-muted-foreground hover:bg-secondary/70'}`}
          title={autoSpeak ? 'Озвучка включена' : 'Включить озвучку'}
        >
          {autoSpeak ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>

        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
          placeholder={isListening ? 'Говорите...' : 'Спросите что-нибудь...'}
          disabled={isLoading}
          className={`flex-1 bg-card border rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground/50 disabled:opacity-50
            ${isListening ? 'border-red-400 ring-2 ring-red-400/30' : ''}`}
        />

        {/* Mic button */}
        <button
          onClick={isListening ? stopListening : startListening}
          disabled={isLoading}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95 flex-shrink-0
            ${isListening
              ? 'bg-red-500 text-white animate-pulse'
              : 'bg-secondary text-muted-foreground hover:bg-secondary/70'}`}
          title={isListening ? 'Остановить запись' : 'Голосовой ввод'}
        >
          {isListening ? <MicOff size={16} /> : <Mic size={16} />}
        </button>

        {/* Send button */}
        <button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || isLoading}
          className="w-10 h-10 rounded-xl bg-foreground text-background flex items-center justify-center active:scale-95 transition-all disabled:opacity-40 flex-shrink-0"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
