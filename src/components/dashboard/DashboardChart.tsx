'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DashboardChartProps {
  stats: { inStock: number; outOfStock: number; inImport: number };
}

export default function DashboardChart({ stats }: DashboardChartProps) {
  const data = [
    { name: 'Com Estoque',   value: stats.inStock,    fill: '#008434' },
    { name: 'Sem Estoque',   value: stats.outOfStock, fill: '#ef4444' },
    { name: 'Em Importação', value: stats.inImport,   fill: '#3b82f6' },
  ];

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} barSize={60} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
        <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '8px', color: '#f8fafc', fontSize: '12px', padding: '8px 12px' }} cursor={{ fill: '#f1f5f9' }} formatter={(value) => [value, 'Modelos']} />
        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
          {data.map((entry, index) => <Cell key={index} fill={entry.fill} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
