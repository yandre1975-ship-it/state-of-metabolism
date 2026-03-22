import { useState } from 'react';
import { LayoutDashboard, BarChart3, CheckSquare, Dumbbell, User, CalendarDays } from 'lucide-react';
import { getProfile } from '@/lib/storage';
import Dashboard from './Dashboard';
import Charts from './Charts';
import Checklist from './Checklist';
import FoodDiary from './FoodDiary';
import Profile from './Profile';
import WeeklyReview from './WeeklyReview';
import Onboarding from './Onboarding';

const tabs = [
  { id: 'dashboard', label: 'Сегодня', icon: LayoutDashboard },
  { id: 'food', label: 'Еда & Спорт', icon: Dumbbell },
  { id: 'weekly', label: 'Неделя', icon: CalendarDays },
  { id: 'charts', label: 'Графики', icon: BarChart3 },
  { id: 'checklist', label: 'Чеклист', icon: CheckSquare },
  { id: 'profile', label: 'Профиль', icon: User },
] as const;

type Tab = typeof tabs[number]['id'];

export default function Index() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [onboarded, setOnboarded] = useState(() => {
    const p = getProfile();
    return p.name.trim().length > 0;
  });

  if (!onboarded) {
    return <Onboarding onComplete={() => setOnboarded(true)} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b px-4 py-3">
        <h1 className="text-base font-bold tracking-tight">AI Health Operator</h1>
      </header>

      <main className="max-w-lg mx-auto px-4 py-5 pb-24">
        {tab === 'dashboard' && <Dashboard />}
        {tab === 'food' && <FoodDiary />}
        {tab === 'weekly' && <WeeklyReview />}
        {tab === 'charts' && <Charts />}
        {tab === 'checklist' && <Checklist />}
        {tab === 'profile' && <Profile />}
      </main>

      <nav className="fixed bottom-0 inset-x-0 bg-card/80 backdrop-blur-lg border-t z-10">
        <div className="max-w-lg mx-auto flex">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-colors active:scale-95
                ${tab === t.id ? 'text-foreground' : 'text-muted-foreground'}`}>
              <t.icon size={18} strokeWidth={tab === t.id ? 2.5 : 1.5} />
              <span className="text-[10px] font-medium">{t.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
