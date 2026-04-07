import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  color?: 'orange' | 'blue' | 'emerald' | 'amber' | 'slate' | 'red';
  description?: string;
}

const COLOR_MAP = {
  orange:  { icon: 'text-orange-600',  bg: 'bg-orange-100',  border: 'border-orange-200' },
  blue:    { icon: 'text-blue-600',    bg: 'bg-blue-100',    border: 'border-blue-200' },
  emerald: { icon: 'text-emerald-600', bg: 'bg-emerald-100', border: 'border-emerald-200' },
  amber:   { icon: 'text-amber-600',   bg: 'bg-amber-100',   border: 'border-amber-200' },
  slate:   { icon: 'text-slate-600',   bg: 'bg-slate-100',   border: 'border-slate-200' },
  red:     { icon: 'text-red-600',     bg: 'bg-red-100',     border: 'border-red-200' },
};

export default function StatCard({ title, value, icon: Icon, color = 'orange', description }: StatCardProps) {
  const colors = COLOR_MAP[color];

  return (
    <div className="card p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
          <p className="text-3xl font-bold text-slate-900 mt-1.5">{value}</p>
          {description && (
            <p className="text-xs text-slate-500 mt-1">{description}</p>
          )}
        </div>
        <div className={cn('p-2.5 rounded-xl border', colors.bg, colors.border)}>
          <Icon className={cn('w-5 h-5', colors.icon)} />
        </div>
      </div>
    </div>
  );
}
