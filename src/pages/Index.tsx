import { useState, useEffect } from 'react';
import { LayoutDashboard, BarChart3, Dumbbell, User, CalendarDays, Crown, MessageCircle, Loader2, BookOpen } from 'lucide-react';
import { getProfile } from '@/lib/storage';
import { canAccess, isPro } from '@/lib/premium';
import { useAuth } from '@/contexts/AuthContext';
import { migrateLocalToCloud, getCloudProfile } from '@/lib/cloudStorage';
import Dashboard from './Dashboard';
import Charts from './Charts';
import FoodDiary from './FoodDiary';
import Profile from './Profile';
import WeeklyReview from './WeeklyReview';
import AIChat from './AIChat';
import WorkoutPrograms from './WorkoutPrograms';
import Onboarding from './Onboarding';
import Auth from './Auth';
import ProUpgrade, { ProGate } from '@/components/ProUpgrade';

const tabs = [
  { id: 'profile', label: 'Профиль', icon: User },
  { id: 'dashboard', label: 'Сегодня', icon: LayoutDashboard },
  { id: 'food', label: 'Дневник', icon: BookOpen },
  { id: 'workouts', label: 'Трен.', icon: Dumbbell },
  { id: 'chat', label: 'AI Коуч', icon: MessageCircle },
  { id: 'weekly', label: 'Неделя', icon: CalendarDays, proFeature: 'weeklyReview' as const },
  { id: 'charts', label: 'Графики', icon: BarChart3 },
] as const;

type Tab = typeof tabs[number]['id'];

export default function Index() {
  const { user, loading } = useAuth();
  const [tab, setTab] = useState<Tab>('dashboard');
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [onboarded, setOnboarded] = useState<boolean | null>(null);
  const [migrating, setMigrating] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Force Dashboard refresh when switching to it
  useEffect(() => {
    if (tab === 'dashboard') setRefreshKey(k => k + 1);
  }, [tab]);

  useEffect(() => {
    if (!user) return;

    // Skip cloud check — use localStorage only (auth is disabled)
    const localProfile = getProfile();
    if (localProfile.name.trim().length > 0) {
      setOnboarded(true);
    } else {
      setOnboarded(false);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  if (onboarded === null || migrating) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <Loader2 size={32} className="animate-spin text-muted-foreground" />
        {migrating && <p className="text-sm text-muted-foreground">Переносим ваши данные...</p>}
      </div>
    );
  }

  if (!onboarded) {
    return <Onboarding onComplete={() => setOnboarded(true)} />;
  }

  if (showUpgrade) {
    return <ProUpgrade onClose={() => setShowUpgrade(false)} />;
  }

  const pro = isPro();

  const renderTab = () => {
    switch (tab) {
      case 'dashboard': return <Dashboard key={refreshKey} />;
      case 'food': return <FoodDiary />;
      case 'workouts': return <WorkoutPrograms />;
      case 'chat': return <AIChat onNavigateToFood={() => setTab('food')} />;
      case 'weekly':
        return canAccess('weeklyReview')
          ? <WeeklyReview />
          : <ProGate feature="Еженедельный обзор" onUpgrade={() => setShowUpgrade(true)} />;
      case 'charts': return <Charts />;
      case 'profile': return <Profile />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b px-4 py-3 flex items-center justify-between">
        <h1 className="text-base font-bold tracking-tight">AI Health Operator</h1>
        <button onClick={() => setShowUpgrade(true)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium active:scale-95 transition-all
            ${pro ? 'bg-foreground text-background' : 'bg-status-yellow/15 text-status-yellow'}`}>
          <Crown size={12} />
          {pro ? 'Pro' : 'Upgrade'}
        </button>
      </header>

      <main className="max-w-lg mx-auto px-4 py-5 pb-24">
        {renderTab()}
      </main>

      <nav className="fixed bottom-0 inset-x-0 bg-card/80 backdrop-blur-lg border-t z-10">
        <div className="max-w-lg mx-auto flex overflow-x-auto scrollbar-none">
          {tabs.map(t => {
            const isLocked = 'proFeature' in t && t.proFeature && !canAccess(t.proFeature);
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-colors active:scale-95 relative
                  ${tab === t.id ? 'text-foreground' : 'text-muted-foreground'}`}>
                <t.icon size={18} strokeWidth={tab === t.id ? 2.5 : 1.5} />
                <span className="text-[10px] font-medium">{t.label}</span>
                {isLocked && (
                  <div className="absolute top-1.5 right-1/2 translate-x-4">
                    <Crown size={8} className="text-status-yellow" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
