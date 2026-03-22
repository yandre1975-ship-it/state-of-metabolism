import { useState } from 'react';
import { Bell, BellOff, Clock, Send, AlertCircle } from 'lucide-react';
import {
  getNotifSettings, saveNotifSettings, requestPermission,
  getPermissionState, scheduleNotifications, sendNotification,
  clearScheduledNotifications, isNotifSupported,
  type NotificationSettings,
} from '@/lib/notifications';

export default function NotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings>(getNotifSettings);
  const [permState, setPermState] = useState(getPermissionState);

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

  if (!isNotifSupported()) {
    return (
      <div className="rounded-2xl bg-card border p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <BellOff size={16} className="text-muted-foreground" />
          <span className="font-semibold text-sm">Уведомления</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Уведомления не поддерживаются в этом браузере
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-card border p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell size={16} className={settings.enabled ? 'text-status-green' : 'text-muted-foreground'} />
          <span className="font-semibold text-sm">Уведомления</span>
        </div>
        {settings.enabled ? (
          <button onClick={handleDisable}
            className="px-3 py-1.5 rounded-xl bg-secondary text-xs font-medium active:scale-95 transition-all">
            Выключить
          </button>
        ) : (
          <button onClick={handleEnable}
            className="px-3 py-1.5 rounded-xl bg-foreground text-background text-xs font-medium active:scale-95 transition-all">
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
          <TimeRow
            icon="🌅"
            label="Утренний план"
            desc="Ваш план и цели на день"
            time={settings.morning}
            onChange={v => update({ morning: v })}
            onTest={() => testNotif('morning')}
          />
          <TimeRow
            icon="🍽️"
            label="Напоминание об обеде"
            desc="Не забудьте добавить белок"
            time={settings.lunch}
            onChange={v => update({ lunch: v })}
            onTest={() => testNotif('lunch')}
          />
          <TimeRow
            icon="📋"
            label="Вечерний чек-ин"
            desc="Проверьте выполнение плана"
            time={settings.evening}
            onChange={v => update({ evening: v })}
            onTest={() => testNotif('evening')}
          />

          <p className="text-[10px] text-muted-foreground text-center mt-2 leading-relaxed">
            Уведомления работают, пока приложение открыто. Для постоянных push-уведомлений потребуется серверная часть.
          </p>
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
    <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary">
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
            className="w-[5.5rem] bg-card border rounded-lg pl-7 pr-2 py-1.5 text-xs outline-none tabular-nums"
          />
        </div>
        <button onClick={onTest} title="Тест"
          className="w-7 h-7 rounded-lg bg-card border flex items-center justify-center active:scale-90 transition-all">
          <Send size={11} className="text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}
