import { useState, useEffect } from 'react';
import { Bell, BellOff, Clock, Send, AlertCircle, MessageCircle, Check, Loader2 } from 'lucide-react';
import {
  getNotifSettings, saveNotifSettings, requestPermission,
  getPermissionState, scheduleNotifications, sendNotification,
  clearScheduledNotifications, isNotifSupported,
  type NotificationSettings,
} from '@/lib/notifications';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function NotificationSettingsComponent() {
  const [settings, setSettings] = useState<NotificationSettings>(getNotifSettings);
  const [permState, setPermState] = useState(getPermissionState);
  const [telegramChatId, setTelegramChatId] = useState('');
  const [telegramConnected, setTelegramConnected] = useState(false);
  const [telegramLoading, setTelegramLoading] = useState(false);
  const [telegramTestLoading, setTelegramTestLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);

  useEffect(() => {
    loadTelegramChatId();
  }, []);

  const loadTelegramChatId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('telegram_chat_id')
      .eq('id', user.id)
      .single();
    if (data?.telegram_chat_id) {
      setTelegramChatId(data.telegram_chat_id);
      setTelegramConnected(true);
    }
  };

  const saveTelegramChatId = async () => {
    if (!telegramChatId.trim()) return;
    setTelegramLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({ telegram_chat_id: telegramChatId.trim() } as any)
        .eq('id', user.id);

      if (error) throw error;
      setTelegramConnected(true);
      toast.success('Telegram подключён!');
    } catch (e: any) {
      toast.error('Ошибка: ' + e.message);
    } finally {
      setTelegramLoading(false);
    }
  };

  const disconnectTelegram = async () => {
    setTelegramLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({ telegram_chat_id: null } as any)
        .eq('id', user.id);

      if (error) throw error;
      setTelegramChatId('');
      setTelegramConnected(false);
      toast.success('Telegram отключён');
    } catch (e: any) {
      toast.error('Ошибка: ' + e.message);
    } finally {
      setTelegramLoading(false);
    }
  };

  const testTelegram = async () => {
    setTelegramTestLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('telegram-send', {
        body: { type: 'test', chat_id: telegramChatId },
      });

      if (error) throw error;
      toast.success('Тестовое сообщение отправлено!');
    } catch (e: any) {
      toast.error('Ошибка: ' + e.message);
    } finally {
      setTelegramTestLoading(false);
    }
  };

  const sendDailySummary = async () => {
    setSummaryLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('telegram-send', {
        body: { type: 'daily_summary' },
      });

      if (error) throw error;
      toast.success('Итоги дня отправлены в Telegram!');
    } catch (e: any) {
      toast.error('Ошибка: ' + e.message);
    } finally {
      setSummaryLoading(false);
    }
  };

  const update = (patch: Partial<NotificationSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveNotifSettings(next);
    if (next.enabled) {
      scheduleNotifications();
    } else {
      clearScheduledNotifications();
    }
  };

  const handleEnable = async () => {
    const granted = await requestPermission();
    setPermState(getPermissionState());
    if (granted) {
      update({ enabled: true });
    }
  };

  const handleDisable = () => {
    update({ enabled: false });
  };

  const testNotif = (type: 'morning' | 'lunch' | 'evening') => {
    sendNotification(type);
  };

  return (
    <div className="space-y-4">
      {/* Telegram Bot Section */}
      <div className="rounded-2xl glass-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[hsl(200_80%_50%/0.15)] flex items-center justify-center">
              <MessageCircle size={16} className="text-[hsl(200_80%_50%)]" />
            </div>
            <div>
              <span className="font-semibold text-sm">Telegram бот</span>
              <p className="text-[10px] text-muted-foreground">Итоги дня и напоминания</p>
            </div>
          </div>
          {telegramConnected && (
            <span className="flex items-center gap-1 text-[10px] text-status-green font-medium">
              <Check size={12} /> Подключён
            </span>
          )}
        </div>

        {!telegramConnected ? (
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-secondary/50 space-y-2">
              <p className="text-xs text-muted-foreground leading-relaxed">
                1. Откройте <a href="https://t.me/userinfobot" target="_blank" rel="noopener" className="text-primary underline">@userinfobot</a> в Telegram
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                2. Отправьте команду <code className="px-1.5 py-0.5 rounded bg-secondary text-[11px]">/start</code>
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                3. Скопируйте ваш <strong>ID</strong> и вставьте ниже
              </p>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ваш Telegram Chat ID"
                value={telegramChatId}
                onChange={e => setTelegramChatId(e.target.value)}
                className="flex-1 bg-transparent border border-border/50 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary/50 transition-colors"
              />
              <button
                onClick={saveTelegramChatId}
                disabled={!telegramChatId.trim() || telegramLoading}
                className="px-4 py-2 rounded-xl gradient-accent text-white text-xs font-medium disabled:opacity-50 active:scale-95 transition-all"
              >
                {telegramLoading ? <Loader2 size={14} className="animate-spin" /> : 'Подключить'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-2">
              <button
                onClick={testTelegram}
                disabled={telegramTestLoading}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl glass-card text-xs font-medium active:scale-95 transition-all"
              >
                {telegramTestLoading ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                Тест
              </button>
              <button
                onClick={sendDailySummary}
                disabled={summaryLoading}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl gradient-accent text-white text-xs font-medium active:scale-95 transition-all"
              >
                {summaryLoading ? <Loader2 size={12} className="animate-spin" /> : '📊'}
                Итоги дня
              </button>
            </div>
            <button
              onClick={disconnectTelegram}
              disabled={telegramLoading}
              className="w-full px-3 py-2 rounded-xl text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              Отключить Telegram
            </button>
          </div>
        )}
      </div>

      {/* Browser Notifications Section */}
      {isNotifSupported() ? (
        <div className="rounded-2xl glass-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-accent-soft flex items-center justify-center">
                <Bell size={16} className={settings.enabled ? 'text-[hsl(250_90%_60%)]' : 'text-muted-foreground'} />
              </div>
              <div>
                <span className="font-semibold text-sm">Браузер</span>
                <p className="text-[10px] text-muted-foreground">Уведомления в браузере</p>
              </div>
            </div>
            {settings.enabled ? (
              <button onClick={handleDisable}
                className="px-3 py-1.5 rounded-xl glass-card text-xs font-medium active:scale-95 transition-all">
                Выключить
              </button>
            ) : (
              <button onClick={handleEnable}
                className="px-3 py-1.5 rounded-xl gradient-accent text-white text-xs font-medium active:scale-95 transition-all">
                Включить
              </button>
            )}
          </div>

          {permState === 'denied' && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-status-red-bg">
              <AlertCircle size={14} className="text-status-red flex-shrink-0 mt-0.5" />
              <p className="text-xs text-status-red">
                Уведомления заблокированы. Разрешите их в настройках браузера.
              </p>
            </div>
          )}

          {settings.enabled && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <TimeRow icon="🌅" label="Утренний план" desc="Ваш план и цели на день"
                time={settings.morning} onChange={v => update({ morning: v })} onTest={() => testNotif('morning')} />
              <TimeRow icon="🍽️" label="Напоминание об обеде" desc="Не забудьте добавить белок"
                time={settings.lunch} onChange={v => update({ lunch: v })} onTest={() => testNotif('lunch')} />
              <TimeRow icon="📋" label="Вечерний чек-ин" desc="Проверьте выполнение плана"
                time={settings.evening} onChange={v => update({ evening: v })} onTest={() => testNotif('evening')} />

              <p className="text-[10px] text-muted-foreground text-center mt-2 leading-relaxed">
                Работают при открытой вкладке приложения
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl glass-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <BellOff size={16} className="text-muted-foreground" />
            <span className="font-semibold text-sm">Браузер</span>
          </div>
          <p className="text-xs text-muted-foreground">Уведомления не поддерживаются в этом браузере</p>
        </div>
      )}
    </div>
  );
}

function TimeRow({ icon, label, desc, time, onChange, onTest }: {
  icon: string; label: string; desc: string;
  time: string; onChange: (v: string) => void; onTest: () => void;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl glass-card">
      <span className="text-lg">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-[10px] text-muted-foreground">{desc}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="relative">
          <Clock size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="time"
            value={time}
            onChange={e => onChange(e.target.value)}
            className="w-[5.5rem] bg-transparent border border-border/50 rounded-lg pl-7 pr-2 py-1.5 text-xs outline-none tabular-nums focus:border-primary/50 transition-colors"
          />
        </div>
        <button onClick={onTest} title="Тест"
          className="w-7 h-7 rounded-lg glass-card flex items-center justify-center active:scale-90 transition-all">
          <Send size={11} className="text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}
