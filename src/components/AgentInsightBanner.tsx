import { useState, useEffect, useCallback } from 'react';
import { Brain, Salad, Dumbbell, Shield, ClipboardList, ChevronDown, ChevronUp, MessageCircle, X } from 'lucide-react';
import { getTodayEntry, assessDay } from '@/lib/storage';

type AgentRole = 'coach' | 'nutrition' | 'training' | 'risk' | 'reminder';

interface Insight {
  agent: AgentRole;
  emoji: string;
  label: string;
  message: string;
  severity: 'info' | 'warning' | 'success';
  followUp?: string; // feedback loop: what to check next
}

const AGENT_COLORS: Record<string, string> = {
  coach: 'text-blue-500',
  nutrition: 'text-emerald-500',
  training: 'text-orange-500',
  risk: 'text-red-500',
  reminder: 'text-violet-500',
};

const SEVERITY_BG: Record<string, string> = {
  info: 'bg-card border',
  warning: 'bg-status-yellow-bg border-status-yellow/30 border',
  success: 'bg-status-green-bg border-status-green/30 border',
};

export function generateInsights(_tab: string): Insight[] {
  const assessment = assessDay(getTodayEntry());
  return [{ agent: 'coach', emoji: '📝', label: 'Наблюдения дневника',
    message: assessment.message, severity: assessment.status === 'red' ? 'warning' : 'info' },
    ...assessment.actions.slice(0, 2).map(message => ({ agent: 'coach' as const, emoji: '💡',
      label: 'Совет по записи', message, severity: 'info' as const }))];
}

interface Props {
  tab: string;
}

export default function AgentInsightBanner({ tab }: Props) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());
  const [expanded, setExpanded] = useState(true);

  // Refresh insights when tab changes or every 30s
  useEffect(() => {
    const refresh = () => {
      setInsights(generateInsights(tab));
      setDismissed(new Set());
    };
    refresh();
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, [tab]);

  const visible = insights.filter((_, i) => !dismissed.has(i));
  if (visible.length === 0) return null;

  return (
    <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground active:scale-95 transition-all"
      >
        <MessageCircle size={12} />
        Наблюдения ({visible.length})
        {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      {expanded && visible.map((insight, vi) => {
        const realIdx = insights.indexOf(insight);
        return (
          <div
            key={`${insight.agent}-${realIdx}`}
            className={`rounded-xl p-3.5 ${SEVERITY_BG[insight.severity]} relative animate-in fade-in slide-in-from-top-1 duration-200`}
            style={{ animationDelay: `${vi * 60}ms` }}
          >
            <button
              onClick={() => setDismissed(prev => new Set([...prev, realIdx]))}
              className="absolute top-2 right-2 text-muted-foreground/40 hover:text-muted-foreground transition-colors p-0.5"
            >
              <X size={12} />
            </button>
            <div className="flex items-start gap-2.5 pr-5">
              <span className="text-base flex-shrink-0 mt-0.5">{insight.emoji}</span>
              <div className="min-w-0">
                <span className={`text-[10px] font-semibold ${AGENT_COLORS[insight.agent]} uppercase tracking-wide`}>
                  {insight.label}
                </span>
                <p className="text-xs leading-relaxed mt-0.5">{insight.message}</p>
                {insight.followUp && (
                  <p className="text-[10px] text-muted-foreground mt-1.5 italic flex items-center gap-1">
                    🔄 {insight.followUp}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
