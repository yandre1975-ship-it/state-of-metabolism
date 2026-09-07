import { expect, it, vi } from 'vitest';
const api = vi.hoisted(() => ({ upsert: vi.fn().mockResolvedValue({ error: null }), rows: [{ date: '2026-09-07', weight: 0, hunger: 2, energy: 3, coffee: 0, protein: false, activity: 0 }] }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { auth: { getUser: async () => ({ data: { user: { id: 'test' } } }) }, from: () => ({ upsert: api.upsert, select: () => ({ order: async () => ({ data: api.rows }) }) }) } }));
import { getCloudEntries, saveCloudEntry } from '@/lib/cloudStorage';
import { emptyEntry } from '@/lib/storage';
it('preserves legacy cloud zeros without inventing sleep or water', async () => {
 expect((await getCloudEntries())[0]).toMatchObject({ weight: 0, water: null, sleepHours: null, sleepQuality: null, legacy: true });
});
it('writes explicit nulls, zeros and schema metadata to cloud', async () => {
 await saveCloudEntry({ ...emptyEntry('2026-09-07'), water: 0 });
 expect(api.upsert.mock.calls.at(-1)?.[0]).toMatchObject({ water: 0, sleep_hours: null, sleep_quality: null, schema_version: 2, legacy: false });
});
