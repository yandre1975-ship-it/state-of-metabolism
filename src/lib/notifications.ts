/**
 * Local notifications system using Web Notifications API.
 * Schedules morning plan, lunch reminder, and evening check-in.
 */

export interface NotificationSettings {
  enabled: boolean;
  morning: string;  // HH:MM
  lunch: string;
  evening: string;
}

const NOTIF_KEY = 'health_notifications';
const TIMERS_KEY = 'health_notif_timers';

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: false,
  morning: '08:00',
  lunch: '13:00',
  evening: '20:00',
};

export function getNotifSettings(): NotificationSettings {
  try {
    const stored = localStorage.getItem(NOTIF_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return { ...DEFAULT_SETTINGS };
}

export function saveNotifSettings(settings: NotificationSettings) {
  localStorage.setItem(NOTIF_KEY, JSON.stringify(settings));
}

export function isNotifSupported(): boolean {
  return 'Notification' in window;
}

export async function requestPermission(): Promise<boolean> {
  if (!isNotifSupported()) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function getPermissionState(): NotificationPermission | 'unsupported' {
  if (!isNotifSupported()) return 'unsupported';
  return Notification.permission;
}

const NOTIFICATIONS = {
  morning: {
    title: '🌅 Утренний план',
    body: 'Доброе утро! Посмотрите ваш план на сегодня и начните день правильно.',
    tag: 'morning-plan',
  },
  lunch: {
    title: '🍽️ Время обеда',
    body: 'Не забудьте добавить белок в обед и записать приём пищи.',
    tag: 'lunch-reminder',
  },
  evening: {
    title: '📋 Вечерний чек-ин',
    body: 'Как прошёл день? Заполните дневник и проверьте выполнение плана.',
    tag: 'evening-checkin',
  },
} as const;

type NotifType = keyof typeof NOTIFICATIONS;

let activeTimers: ReturnType<typeof setTimeout>[] = [];

export function sendNotification(type: NotifType) {
  if (!isNotifSupported() || Notification.permission !== 'granted') return;
  const config = NOTIFICATIONS[type];
  try {
    new Notification(config.title, {
      body: config.body,
      tag: config.tag,
      icon: '/pwa-192.png',
      badge: '/pwa-192.png',
      requireInteraction: false,
    });
  } catch {
    // SW notification fallback
    navigator.serviceWorker?.ready.then(reg => {
      reg.showNotification(config.title, {
        body: config.body,
        tag: config.tag,
        icon: '/pwa-192.png',
      });
    });
  }
}

function getNextOccurrence(timeStr: string): Date {
  const [h, m] = timeStr.split(':').map(Number);
  const now = new Date();
  const target = new Date();
  target.setHours(h, m, 0, 0);
  // If time already passed today, schedule for tomorrow
  if (target <= now) {
    target.setDate(target.getDate() + 1);
  }
  return target;
}

export function scheduleNotifications() {
  // Clear existing timers
  clearScheduledNotifications();

  const settings = getNotifSettings();
  if (!settings.enabled || Notification.permission !== 'granted') return;

  const schedule = (type: NotifType, timeStr: string) => {
    const next = getNextOccurrence(timeStr);
    const delay = next.getTime() - Date.now();
    if (delay > 0 && delay < 24 * 60 * 60 * 1000) {
      const timer = setTimeout(() => {
        sendNotification(type);
        // Reschedule for next day
        setTimeout(() => scheduleNotifications(), 1000);
      }, delay);
      activeTimers.push(timer);
    }
  };

  schedule('morning', settings.morning);
  schedule('lunch', settings.lunch);
  schedule('evening', settings.evening);
}

export function clearScheduledNotifications() {
  activeTimers.forEach(t => clearTimeout(t));
  activeTimers = [];
}

/**
 * Initialize notifications on app start.
 */
export function initNotifications() {
  const settings = getNotifSettings();
  if (settings.enabled && Notification.permission === 'granted') {
    scheduleNotifications();
  }
}
