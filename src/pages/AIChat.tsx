import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, AlertCircle } from 'lucide-react';
import { getTodayEntry, getProfile } from '@/lib/storage';
import ReactMarkdown from 'react-markdown';

type Msg = { role: 'user' | 'assistant'; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/health-chat`;

const QUICK_QUESTIONS = [
  'Почему я голодный?',
  'Что съесть на ужин?',
  'Почему вес стоит?',
  'Как повысить энергию?',
];

export default function AIChat() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    setError(null);

    const userMsg: Msg = { role: 'user', content: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Gather context
    const entry = getTodayEntry();
    const profile = getProfile();
    const context = {
      weight: entry.weight,
      hunger: entry.hunger,
      energy: entry.energy,
      coffee: entry.coffee,
      protein: entry.protein,
      activity: entry.activity,
      goal: profile.goal,
      conditions: profile.conditions,
    };

    let assistantSoFar = '';

    try {
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          context,
        }),
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({ error: 'Ошибка сервера' }));
        setError(data.error || `Ошибка: ${resp.status}`);
        setIsLoading(false);
        return;
      }

      if (!resp.body) {
        setError('Нет ответа от сервера');
        setIsLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let streamDone = false;

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
          if (jsonStr === '[DONE]') {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantSoFar += content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'assistant') {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
                }
                return [...prev, { role: 'assistant', content: assistantSoFar }];
              });
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Final flush
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
            if (content) {
              assistantSoFar += content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'assistant') {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
                }
                return [...prev, { role: 'assistant', content: assistantSoFar }];
              });
            }
          } catch { /* ignore */ }
        }
      }
    } catch (e) {
      console.error('Chat error:', e);
      setError('Не удалось подключиться к AI');
    }

    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] animate-in fade-in duration-300">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 pb-4">
        {messages.length === 0 && (
          <div className="text-center pt-12 space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-foreground text-background flex items-center justify-center mx-auto">
              <Bot size={28} />
            </div>
            <div>
              <h3 className="font-semibold text-lg">AI Health Coach</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-[260px] mx-auto leading-relaxed">
                Задайте вопрос о питании, весе или самочувствии — я отвечу с учётом ваших данных.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center px-4">
              {QUICK_QUESTIONS.map(q => (
                <button key={q} onClick={() => sendMessage(q)}
                  className="px-3 py-2 rounded-xl bg-card border text-xs font-medium active:scale-95 transition-all hover:bg-secondary">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-lg bg-foreground text-background flex items-center justify-center flex-shrink-0 mt-1">
                <Bot size={14} />
              </div>
            )}
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed
              ${msg.role === 'user'
                ? 'bg-foreground text-background rounded-br-md'
                : 'bg-card border rounded-bl-md'}`}>
              {msg.role === 'assistant' ? (
                <div className="prose prose-sm max-w-none [&_p]:mb-1.5 [&_ul]:mb-1.5 [&_li]:mb-0.5">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                msg.content
              )}
            </div>
            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0 mt-1">
                <User size={14} />
              </div>
            )}
          </div>
        ))}

        {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="flex gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-foreground text-background flex items-center justify-center flex-shrink-0">
              <Bot size={14} />
            </div>
            <div className="bg-card border rounded-2xl rounded-bl-md px-4 py-3">
              <Loader2 size={16} className="animate-spin text-muted-foreground" />
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

      {/* Input */}
      <div className="flex gap-2 pt-3 border-t">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
          placeholder="Спросите что-нибудь..."
          disabled={isLoading}
          className="flex-1 bg-card border rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground/50 disabled:opacity-50"
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || isLoading}
          className="w-11 h-11 rounded-2xl bg-foreground text-background flex items-center justify-center active:scale-95 transition-all disabled:opacity-40"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
