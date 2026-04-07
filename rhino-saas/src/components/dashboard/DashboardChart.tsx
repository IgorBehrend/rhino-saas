'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DashboardChartProps {
  stats: {
    available: number;
    production: number;
    sold: number;
    maintenance: number;
    scrapped: number;
  };
}

const CHART_DATA_FN = (s: DashboardChartProps['stats']) => [
  { name: 'Disponível',  value: s.available,   fill: '#10b981' },
  { name: 'Produção',    value: s.production,  fill: '#3b82f6' },
  { name: 'Vendida',     value: s.sold,        fill: '#94a3b8' },
  { name: 'Manutenção',  value: s.maintenance, fill: '#f59e0b' },
  { name: 'Sucateada',   value: s.scrapped,    fill: '#ef4444' },
];

export default function DashboardChart({ stats }: DashboardChartProps) {
  const data = CHART_DATA_FN(stats);

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} barSize={40} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
        <XAxis
          dataKey="name"
          tick={{ fontSize: 12, fill: '#64748b' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            background: '#0f172a',
            border: 'none',
            borderRadius: '8px',
            color: '#f8fafc',
            fontSize: '12px',
            padding: '8px 12px',
          }}
          cursor={{ fill: '#f1f5f9' }}
          formatter={(value) => [value, 'Modelos']}
        />
        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
