import { useState } from 'react';
import { getChecklist, saveChecklist, type ChecklistItem } from '@/lib/storage';
import { Check } from 'lucide-react';

export default function Checklist() {
  const [items, setItems] = useState<ChecklistItem[]>(getChecklist);

  const toggle = (id: string) => {
    const next = items.map(i => i.id === id ? { ...i, checked: !i.checked } : i);
    setItems(next);
    saveChecklist(next);
  };

  const done = items.filter(i => i.checked).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="rounded-2xl bg-card border p-5 shadow-sm">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold">Ежедневный чеклист</h3>
          <span className="text-sm text-muted-foreground tabular-nums">{done}/{items.length}</span>
        </div>
        <div className="w-full bg-secondary rounded-full h-2 mb-5">
          <div
            className="bg-status-green h-2 rounded-full transition-all duration-300"
            style={{ width: `${(done / items.length) * 100}%` }}
          />
        </div>
        <ul className="space-y-2">
          {items.map(item => (
            <li key={item.id}>
              <button
                onClick={() => toggle(item.id)}
                className={`w-full flex items-center gap-3 p-4 rounded-xl transition-all duration-150 active:scale-[0.98] text-left
                  ${item.checked ? 'bg-status-green-bg' : 'bg-secondary hover:bg-secondary/70'}`}
              >
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors
                  ${item.checked ? 'bg-status-green text-white' : 'border-2 border-muted-foreground/30'}`}>
                  {item.checked && <Check size={14} strokeWidth={3} />}
                </div>
                <span className={`text-sm ${item.checked ? 'line-through text-muted-foreground' : ''}`}>
                  {item.label}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
