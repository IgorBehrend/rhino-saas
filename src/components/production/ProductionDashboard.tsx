'use client';

import { Production, ProductionStatus } from '@/types';
import { PRODUCTION_STATUS_CONFIG, formatDate } from '@/lib/utils';
import { CheckCircle, AlertTriangle, Clock, Activity, Calendar, ChevronRight } from 'lucide-react';

interface ProductionDashboardProps {
  records: (Production & { machine?: { id: string; code: string; name: string; machine_type: string | null } })[];
}

const STATUS_ORDER: ProductionStatus[] = [
  'pending', 'mechanical', 'electrical', 'checklist', 'packaging', 'ready', 'shipped'
];

const STAGE_COLORS: Record<ProductionStatus, string> = {
  pending:    '#94a3b8',
  mechanical: '#3b82f6',
  electrical: '#8b5cf6',
  checklist:  '#f59e0b',
  packaging:  '#f97316',
  ready:      '#008434',
  shipped:    '#059669',
};

export default function ProductionDashboard({ records }: ProductionDashboardProps) {
  const active   = records.filter(r => r.status !== 'shipped');
  const ready    = records.filter(r => r.status === 'ready');
  const delayed  = records.filter(r => (r.delay_days ?? 0) > 0);
  const onTime   = active.filter(r => (r.delay_days ?? 0) <= 0 && r.status !== 'ready');

  // Sort delayed by most overdue
  const delayedSorted = [...delayed].sort((a, b) => (b.delay_days ?? 0) - (a.delay_days ?? 0));

  // Next deliveries (planned but not yet shipped, sorted by date)
  const upcoming = records
    .filter(r => r.planned_delivery_date && r.status !== 'shipped')
    .sort((a, b) => new Date(a.planned_delivery_date!).getTime() - new Date(b.planned_delivery_date!).getTime())
    .slice(0, 5);

  // Max count for bar chart scaling
  const maxCount = Math.max(...STATUS_ORDER.map(s => records.filter(r => r.status === s).length), 1);

  return (
    <div className="space-y-4">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Ordens Ativas',      value: active.length,   color: 'text-slate-800' },
          { label: 'Prontas p/ Entrega', value: ready.length,    color: 'text-emerald-600' },
          { label: 'Em Atraso',          value: delayed.length,  color: 'text-red-600' },
          { label: 'No Prazo',           value: onTime.length,   color: 'text-blue-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
            <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Kanban + delayed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Kanban */}
        <div className="card lg:col-span-2">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
            <Activity className="w-4 h-4" style={{ color: '#008434' }} />
            <h2 className="font-semibold text-slate-800 text-sm">Kanban de Produção</h2>
          </div>
          <div className="p-4 overflow-x-auto">
            <div className="grid grid-cols-7 gap-2 min-w-[600px]">
              {STATUS_ORDER.map(status => {
                const col = records.filter(r => r.status === status);
                const cfg = PRODUCTION_STATUS_CONFIG[status];
                return (
                  <div key={status}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-slate-500 truncate" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {cfg.label}
                      </p>
                      <span className="text-xs font-bold text-slate-400 bg-slate-100 px-1 py-0.5 rounded-full" style={{ fontSize: '9px' }}>
                        {col.length}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {col.slice(0, 4).map(r => (
                        <div
                          key={r.id}
                          className="rounded-lg p-2 border border-slate-100"
                          style={{ backgroundColor: `${STAGE_COLORS[status]}10`, borderLeft: `3px solid ${STAGE_COLORS[status]}` }}
                        >
                          <p className="font-mono font-bold truncate" style={{ fontSize: '10px', color: STAGE_COLORS[status] }}>
                            {r.machine?.code ?? '—'}
                          </p>
                          <p className="truncate text-slate-500" style={{ fontSize: '9px', marginTop: '1px' }}>
                            {r.contract ?? r.machine?.name?.slice(0, 20) ?? '—'}
                          </p>
                          {r.delay_days && r.delay_days > 0 && (
                            <p className="text-red-500 font-bold" style={{ fontSize: '9px' }}>{r.delay_days}d atraso</p>
                          )}
                        </div>
                      ))}
                      {col.length === 0 && (
                        <div className="border border-dashed border-slate-200 rounded-lg p-2 text-center">
                          <p className="text-slate-400" style={{ fontSize: '9px' }}>Vazio</p>
                        </div>
                      )}
                      {col.length > 4 && (
                        <p className="text-center text-slate-400" style={{ fontSize: '9px' }}>+{col.length - 4} mais</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Delayed */}
        <div className="card">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <h2 className="font-semibold text-slate-800 text-sm">Em Atraso</h2>
            {delayed.length > 0 && (
              <span className="ml-auto text-xs font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{delayed.length}</span>
            )}
          </div>
          {delayedSorted.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-sm text-slate-500">Nenhum atraso! ✓</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {delayedSorted.slice(0, 6).map(r => (
                <div key={r.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="font-mono text-xs font-bold" style={{ color: '#008434' }}>{r.machine?.code ?? '—'}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {r.contract ?? '—'} · Prev: {formatDate(r.planned_delivery_date)}
                    </p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                    (r.delay_days ?? 0) > 5 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {r.delay_days}d
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Upcoming deliveries */}
        <div className="card">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
            <Calendar className="w-4 h-4 text-blue-500" />
            <h2 className="font-semibold text-slate-800 text-sm">Próximas Entregas</h2>
          </div>
          {upcoming.length === 0 ? (
            <p className="text-xs text-slate-400 px-5 py-4">Nenhuma entrega agendada.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {upcoming.map(r => {
                const days = r.planned_delivery_date
                  ? Math.ceil((new Date(r.planned_delivery_date).getTime() - Date.now()) / 86400000)
                  : null;
                return (
                  <div key={r.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="font-mono text-xs font-bold" style={{ color: '#008434' }}>{r.machine?.code ?? '—'}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{r.contract ?? '—'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-slate-700">{formatDate(r.planned_delivery_date)}</p>
                      {days !== null && (
                        <p className={`text-xs font-bold mt-0.5 ${days < 0 ? 'text-red-500' : days <= 3 ? 'text-amber-500' : 'text-emerald-600'}`}>
                          {days < 0 ? `${Math.abs(days)}d atraso` : days === 0 ? 'Hoje' : `${days}d`}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Machines per stage */}
        <div className="card">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
            <ChevronRight className="w-4 h-4" style={{ color: '#008434' }} />
            <h2 className="font-semibold text-slate-800 text-sm">Máquinas por Etapa</h2>
          </div>
          <div className="px-5 py-3 space-y-3">
            {STATUS_ORDER.map(status => {
              const count = records.filter(r => r.status === status).length;
              const pct   = maxCount > 0 ? (count / maxCount) * 100 : 0;
              return (
                <div key={status} className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 w-24 shrink-0">{PRODUCTION_STATUS_CONFIG[status].label}</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: STAGE_COLORS[status] }} />
                  </div>
                  <span className="text-xs font-bold text-slate-700 w-4 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Performance */}
        <div className="card">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
            <Clock className="w-4 h-4 text-purple-500" />
            <h2 className="font-semibold text-slate-800 text-sm">Resumo de Performance</h2>
          </div>
          <div className="px-5 py-4 space-y-4">
            {/* On-time rate */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-slate-500">Taxa no prazo</span>
                <span className="text-xs font-bold" style={{ color: '#008434' }}>
                  {active.length > 0 ? Math.round((onTime.length / active.length) * 100) : 0}%
                </span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{
                  width: active.length > 0 ? `${(onTime.length / active.length) * 100}%` : '0%',
                  backgroundColor: '#008434'
                }} />
              </div>
            </div>
            {/* Completion rate */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-slate-500">Prontas / Total</span>
                <span className="text-xs font-bold text-blue-600">
                  {records.length > 0 ? Math.round((ready.length / records.length) * 100) : 0}%
                </span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-blue-500" style={{
                  width: records.length > 0 ? `${(ready.length / records.length) * 100}%` : '0%'
                }} />
              </div>
            </div>
            {/* Summary */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              {[
                ['Total de ordens',     records.length,  'text-slate-700'],
                ['Ativas',             active.length,   'text-slate-700'],
                ['Despachadas',        records.filter(r => r.status === 'shipped').length, 'text-emerald-600'],
                ['Maior atraso',       `${delayedSorted[0]?.delay_days ?? 0}d`, 'text-red-500'],
              ].map(([label, value, color]) => (
                <div key={label as string} className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">{label}</span>
                  <span className={`text-xs font-bold ${color}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
