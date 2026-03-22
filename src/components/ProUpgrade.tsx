import { useState } from 'react';
import { isPro, activatePro, deactivatePro, startTrial, getPremiumState, getFeatureList } from '@/lib/premium';
import { Check, Crown, Lock, Sparkles, X } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export default function ProUpgrade({ onClose }: Props) {
  const [pro, setPro] = useState(isPro);
  const state = getPremiumState();
  const features = getFeatureList();

  const handleActivate = () => {
    // TODO: Replace with Stripe checkout
    activatePro();
    setPro(true);
  };

  const handleTrial = () => {
    startTrial(7);
    setPro(true);
  };

  const handleDeactivate = () => {
    deactivatePro();
    setPro(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Тарифы</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center active:scale-95">
            <X size={16} />
          </button>
        </div>

        {/* Current plan */}
        {pro && (
          <div className="rounded-2xl bg-foreground text-background p-5 mb-5">
            <div className="flex items-center gap-2 mb-1">
              <Crown size={18} />
              <span className="font-semibold">Pro активен</span>
            </div>
            {state.expiresAt && (
              <p className="text-xs opacity-70 mt-1">
                Пробный период до {new Date(state.expiresAt).toLocaleDateString('ru-RU')}
              </p>
            )}
          </div>
        )}

        {/* Plans comparison */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {/* Free */}
          <div className={`rounded-2xl border p-4 ${!pro ? 'border-foreground/20 bg-card' : 'bg-card border'}`}>
            <p className="font-semibold text-sm mb-1">Free</p>
            <p className="text-2xl font-bold">0 ₽</p>
            <p className="text-[10px] text-muted-foreground">навсегда</p>
          </div>
          {/* Pro */}
          <div className={`rounded-2xl border p-4 ${pro ? 'border-foreground bg-card shadow-md' : 'bg-card border'}`}>
            <div className="flex items-center gap-1.5">
              <p className="font-semibold text-sm">Pro</p>
              <Sparkles size={12} className="text-status-yellow" />
            </div>
            <p className="text-2xl font-bold">299 ₽</p>
            <p className="text-[10px] text-muted-foreground">в месяц</p>
          </div>
        </div>

        {/* Feature list */}
        <div className="rounded-2xl bg-card border p-5 shadow-sm mb-6">
          <h3 className="font-semibold text-sm mb-4">Возможности</h3>
          <ul className="space-y-3">
            {features.map(f => (
              <li key={f.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {f.free ? (
                    <div className="w-5 h-5 rounded-md bg-status-green/15 flex items-center justify-center">
                      <Check size={12} className="text-status-green" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-md bg-status-yellow/15 flex items-center justify-center">
                      <Crown size={10} className="text-status-yellow" />
                    </div>
                  )}
                  <span className="text-sm">{f.label}</span>
                </div>
                <div className="flex gap-6">
                  <span className="text-xs w-10 text-center">
                    {f.free ? <Check size={14} className="text-status-green mx-auto" /> : <X size={14} className="text-muted-foreground/30 mx-auto" />}
                  </span>
                  <span className="text-xs w-10 text-center">
                    <Check size={14} className="text-status-green mx-auto" />
                  </span>
                </div>
              </li>
            ))}
          </ul>
          <div className="flex gap-6 justify-end mt-2 pr-0">
            <span className="text-[10px] text-muted-foreground w-10 text-center">Free</span>
            <span className="text-[10px] text-muted-foreground w-10 text-center">Pro</span>
          </div>
        </div>

        {/* Actions */}
        {!pro ? (
          <div className="space-y-3">
            <button onClick={handleActivate}
              className="w-full py-3.5 rounded-2xl bg-foreground text-background font-medium text-sm flex items-center justify-center gap-2 active:scale-[0.97] transition-all">
              <Crown size={16} /> Подключить Pro — 299 ₽/мес
            </button>
            <button onClick={handleTrial}
              className="w-full py-3 rounded-2xl bg-secondary text-secondary-foreground font-medium text-sm active:scale-[0.97] transition-all">
              Попробовать 7 дней бесплатно
            </button>
          </div>
        ) : (
          <button onClick={handleDeactivate}
            className="w-full py-3 rounded-2xl bg-secondary text-secondary-foreground font-medium text-sm active:scale-[0.97] transition-all">
            Отключить Pro
          </button>
        )}

        <p className="text-[11px] text-muted-foreground text-center mt-4 leading-relaxed">
          Оплата будет подключена через Stripe. Сейчас активация — демо-режим.
        </p>
      </div>
    </div>
  );
}

/** Small lock badge for gated features */
export function ProBadge({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-status-yellow/15 text-status-yellow text-[10px] font-semibold ${className}`}>
      <Crown size={10} /> PRO
    </span>
  );
}

/** Overlay shown when user tries to access a Pro feature */
export function ProGate({ feature, onUpgrade }: { feature: string; onUpgrade: () => void }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-status-yellow/30 p-8 flex flex-col items-center gap-4 animate-in fade-in duration-300">
      <div className="w-12 h-12 rounded-2xl bg-status-yellow/15 flex items-center justify-center">
        <Lock size={20} className="text-status-yellow" />
      </div>
      <div className="text-center">
        <p className="font-semibold text-sm">{feature}</p>
        <p className="text-xs text-muted-foreground mt-1">Доступно в Pro версии</p>
      </div>
      <button onClick={onUpgrade}
        className="px-6 py-2.5 rounded-xl bg-foreground text-background text-sm font-medium flex items-center gap-2 active:scale-95 transition-all">
        <Crown size={14} /> Подключить Pro
      </button>
    </div>
  );
}
