import { getLast7Days } from '@/lib/storage';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Charts() {
  const data = getLast7Days().map(e => ({
    date: e.date.slice(5), // MM-DD
    weight: e.weight,
    hunger: e.hunger || null,
    energy: e.energy || null,
  }));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <ChartCard title="Вес" dataKey="weight" data={data} color="hsl(220, 20%, 16%)" unit=" кг" />
      <ChartCard title="Голод" dataKey="hunger" data={data} color="hsl(0, 72%, 51%)" domain={[1, 5]} />
      <ChartCard title="Энергия" dataKey="energy" data={data} color="hsl(152, 60%, 42%)" domain={[1, 5]} />
    </div>
  );
}

function ChartCard({ title, dataKey, data, color, unit = '', domain }: {
  title: string; dataKey: string; data: any[]; color: string; unit?: string; domain?: [number, number];
}) {
  return (
    <div className="rounded-2xl bg-card border p-5 shadow-sm">
      <h3 className="font-semibold mb-4">{title}</h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 18%, 89%)" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(215, 12%, 50%)" />
            <YAxis domain={domain || ['auto', 'auto']} tick={{ fontSize: 12 }} stroke="hsl(215, 12%, 50%)" width={40} />
            <Tooltip
              formatter={(v: number) => [`${v}${unit}`, title]}
              contentStyle={{ borderRadius: 12, border: '1px solid hsl(214, 18%, 89%)', fontSize: 13 }}
            />
            <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2.5} dot={{ r: 4, fill: color }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
