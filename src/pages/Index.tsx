import { useState } from 'react';
import { LayoutDashboard, BarChart3, CheckSquare, Dumbbell } from 'lucide-react';
import Dashboard from './Dashboard';
import Charts from './Charts';
import Checklist from './Checklist';
import FoodDiary from './FoodDiary';

const tabs = [
  { id: 'dashboard', label: 'Сегодня', icon: LayoutDashboard },
  { id: 'food', label: 'Еда & Спорт', icon: Dumbbell },
  { id: 'charts', label: 'Графики', icon: BarChart3 },
  { id: 'checklist', label: 'Чеклист', icon: CheckSquare },
] as const;

type Tab = typeof tabs[number]['id'];

export default function Index() {
  const [tab, setTab] = useState<Tab>('dashboard');

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b px-4 py-4">
        <h1 className="text-lg font-bold tracking-tight">Metabolic Dashboard</h1>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 pb-24">
        {tab === 'dashboard' && <Dashboard />}
        {tab === 'food' && <FoodDiary />}
        {tab === 'charts' && <Charts />}
        {tab === 'checklist' && <Checklist />}
      </main>

      <nav className="fixed bottom-0 inset-x-0 bg-card/80 backdrop-blur-lg border-t z-10">
        <div className="max-w-lg mx-auto flex">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors active:scale-95
                ${tab === t.id ? 'text-foreground' : 'text-muted-foreground'}`}
            >
              <t.icon size={20} strokeWidth={tab === t.id ? 2.5 : 1.5} />
              <span className="text-[11px] font-medium">{t.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
