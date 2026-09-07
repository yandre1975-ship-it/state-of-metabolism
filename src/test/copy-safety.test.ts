import { expect, it } from 'vitest';
const sources = import.meta.glob(['/src/pages/*.tsx', '/src/components/AgentInsightBanner.tsx', '/supabase/functions/health-chat/index.ts'], { eager: true, query: '?raw', import: 'default' });
it('does not present diary scales as metabolic diagnoses', () => {
 for (const [file, text] of Object.entries(sources)) expect(String(text), file).not.toMatch(/жиросжигание активно|организм в стрессе|Недосып замедляет метаболизм|Корректирует калории для снижения стресса/i);
});
