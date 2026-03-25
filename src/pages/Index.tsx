import { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, BarChart3, Dumbbell, User, CalendarDays, Crown, MessageCircle, Loader2, BookOpen, Sparkles } from 'lucide-react';
import { getProfile } from '@/lib/storage';
import { canAccess, isPro } from '@/lib/premium';
import { useAuth } from '@/contexts/AuthContext';
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

function checkOnboarded(): boolean {
  try {
    const p = getProfile();
    return p.name.trim().length > 0;
  } catch {
    return false;
  }
}

export default function Index() {
  const { user, loading } = useAuth();
  const [tab, setTab] = useState<Tab>('dashboard');
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [onboarded, setOnboarded] = useState(() => checkOnboarded());
  const [refreshKey, setRefreshKey] = useState(0);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-16 h-16 rounded-3xl gradient-accent flex items-center justify-center animate-scale-up shadow-xl shadow-[hsl(250_90%_60%/0.3)]">
          <Sparkles size={28} className="text-white" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  if (!onboarded) {
    return <Onboarding onComplete={() => setOnboarded(true)} />;
  }

  if (showUpgrade) {
    return <ProUpgrade onClose={() => setShowUpgrade(false)} />;
  }

  const pro = isPro();

  const [animating, setAnimating] = useState(false);
  const [displayTab, setDisplayTab] = useState<Tab>(tab);

  useEffect(() => {
    if (tab !== displayTab) {
      setAnimating(true);
      const t = setTimeout(() => {
        setDisplayTab(tab);
        setAnimating(false);
      }, 150);
      return () => clearTimeout(t);
    }
  }, [tab, displayTab]);

  const renderTab = () => {
    switch (displayTab) {
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
      <header className="sticky top-0 z-10 bg-background/60 backdrop-blur-xl border-b border-border/50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl gradient-accent flex items-center justify-center shadow-md shadow-[hsl(250_90%_60%/0.2)]">
            <Sparkles size={16} className="text-white" />
          </div>
          <h1 className="text-sm font-bold tracking-tight gradient-text">AI Health Operator</h1>
        </div>
        <button onClick={() => setShowUpgrade(true)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold active:scale-95 transition-all
            ${pro ? 'gradient-accent text-white shadow-md shadow-[hsl(250_90%_60%/0.2)]' : 'glass-card text-[hsl(250_90%_60%)] hover:border-[hsl(250_90%_60%/0.3)]'}`}>
          <Crown size={12} />
          {pro ? 'Pro' : 'Upgrade'}
        </button>
      </header>

      <main className="max-w-lg mx-auto px-4 py-5 pb-24">
        <div
          className={`transition-all duration-150 ease-out ${animating ? 'opacity-0 translate-y-2 scale-[0.98]' : 'opacity-100 translate-y-0 scale-100'}`}
        >
          {renderTab()}
        </div>
      </main>

      <nav className="fixed bottom-0 inset-x-0 bg-background/60 backdrop-blur-xl border-t border-border/50 z-10">
        <div className="max-w-lg mx-auto flex overflow-x-auto scrollbar-none">
          {tabs.map(t => {
            const isLocked = 'proFeature' in t && t.proFeature && !canAccess(t.proFeature);
            const isActive = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-all active:scale-95 relative
                  ${isActive ? 'text-[hsl(250_90%_60%)]' : 'text-muted-foreground'}`}>
                <t.icon size={18} strokeWidth={isActive ? 2.5 : 1.5} />
                <span className={`text-[10px] font-medium ${isActive ? 'font-semibold' : ''}`}>{t.label}</span>
                {isActive && (
                  <div className="absolute -top-px left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full gradient-accent" />
                )}
                {isLocked && (
                  <div className="absolute top-1.5 right-1/2 translate-x-4">
                    <Crown size={8} className="text-[hsl(250_90%_60%)]" />
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
