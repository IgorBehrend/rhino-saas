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

// Stage dates map
const STAGE_DATE_FIELDS: Partial<Record<ProductionStatus, string>> = {
  mechanical: 'dt_mechanical',
  electrical: 'dt_electrical',
  checklist:  'dt_checklist',
  packaging:  'dt_packaging',
};

// Calculate delay in days from planned_delivery_date
function calcDelay(r: Production): number {
  if (!r.planned_delivery_date || r.status === 'shipped') return 0;
  const diff = Math.ceil((Date.now() - new Date(r.planned_delivery_date).getTime()) / 86400000);
  return diff > 0 ? diff : 0;
}

export default function ProductionDashboard({ records }: ProductionDashboardProps) {
  const active  = records.filter(r => r.status !== 'shipped');
  const ready   = records.filter(r => r.status === 'ready');

  // Calculate delays based on planned_delivery_date
  const delayed = active.filter(r => calcDelay(r) > 0);
  const onTime  = active.filter(r => calcDelay(r) === 0 && r.status !== 'ready');

  const delayedSorted = [...delayed].sort((a, b) => calcDelay(b) - calcDelay(a));

  const upcoming = records
    .filter(r => r.planned_delivery_date && r.status !== 'shipped')
    .sort((a, b) => new Date(a.planned_delivery_date!).getTime() - new Date(b.planned_delivery_date!).getTime())
    .slice(0, 5);

  const maxCount = Math.max(...STATUS_ORDER.map(s => records.filter(r => r.status === s).length), 1);

  return (
    <div className="space-y-4">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Ordens Ativas',      value: active.length,  color: 'text-slate-800' },
          { label: 'Prontas p/ Entrega', value: ready.length,   color: 'text-emerald-600' },
          { label: 'Em Atraso',          value: delayed.length, color: 'text-red-600' },
          { label: 'No Prazo',           value: onTime.length,  color: 'text-blue-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-3 lg:p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
            <p className={`text-2xl lg:text-3xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Kanban */}
      <div className="card">
        <div className="flex items-center gap-2 px-4 lg:px-5 py-3 lg:py-4 border-b border-slate-100">
          <Activity className="w-4 h-4 shrink-0" style={{ color: '#008434' }} />
          <h2 className="font-semibold text-slate-800 text-sm">Kanban de Producao</h2>
        </div>
        <div className="p-3 lg:p-4 overflow-x-auto">
          <div className="flex gap-2 lg:grid lg:grid-cols-7 min-w-max lg:min-w-0">
            {STATUS_ORDER.map(status => {
              const col = records.filter(r => r.status === status);
              const cfg = PRODUCTION_STATUS_CONFIG[status];
              const stageDateField = STAGE_DATE_FIELDS[status];
              return (
                <div key={status} className="w-32 lg:w-auto shrink-0 lg:shrink">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-slate-500 truncate" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                      {cfg.label}
                    </p>
                    <span className="text-slate-400 bg-slate-100 px-1 py-0.5 rounded-full ml-1 shrink-0" style={{ fontSize: '9px', fontWeight: 700 }}>
                      {col.length}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {col.slice(0, 3).map(r => {
                      const delay = calcDelay(r);
                      const stageDate = stageDateField ? (r as any)[stageDateField] : null;
                      return (
                        <div key={r.id} className="rounded-lg p-2 border border-slate-100"
                          style={{ backgroundColor: `${STAGE_COLORS[status]}10`, borderLeft: `3px solid ${STAGE_COLORS[status]}` }}>
                          <p className="font-mono font-bold truncate" style={{ fontSize: '10px', color: STAGE_COLORS[status] }}>
                            {r.machine?.code ?? '—'}
                          </p>
                          <p className="truncate text-slate-500" style={{ fontSize: '9px', marginTop: '1px' }}>
                            {r.contract ?? r.machine?.name?.slice(0, 18) ?? '—'}
                          </p>
                          {/* Stage change date */}
                          {stageDate && (
                            <p className="text-slate-400 flex items-center gap-0.5 mt-0.5" style={{ fontSize: '8px' }}>
                              <Calendar style={{ width: '8px', height: '8px' }} />
                              {new Date(stageDate).toLocaleDateString('pt-BR')}
                            </p>
                          )}
                          {delay > 0 && (
                            <p className="text-red-500 font-bold" style={{ fontSize: '9px' }}>{delay}d atraso</p>
                          )}
                        </div>
                      );
                    })}
                    {col.length === 0 && (
                      <div className="border border-dashed border-slate-200 rounded-lg p-2 text-center">
                        <p className="text-slate-400" style={{ fontSize: '9px' }}>Vazio</p>
                      </div>
                    )}
                    {col.length > 3 && (
                      <p className="text-center text-slate-400" style={{ fontSize: '9px' }}>+{col.length - 3} mais</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Delayed + Upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Delayed */}
        <div className="card">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
            <h2 className="font-semibold text-slate-800 text-sm">Em Atraso</h2>
            {delayed.length > 0 && (
              <span className="ml-auto text-xs font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{delayed.length}</span>
            )}
          </div>
          {delayedSorted.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <CheckCircle className="w-7 h-7 text-emerald-400 mx-auto mb-2" />
              <p className="text-sm text-slate-500">Nenhum atraso! ✓</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {delayedSorted.map(r => {
                const delay = calcDelay(r);
                return (
                  <div key={r.id} className="flex items-center justify-between px-4 py-3">
                    <div className="min-w-0 mr-2">
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-xs font-bold" style={{ color: '#008434' }}>{r.machine?.code ?? '—'}</p>
                        <span className="text-xs text-slate-400">{PRODUCTION_STATUS_CONFIG[r.status].label}</span>
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {r.contract ?? '—'} · Prev: {formatDate(r.planned_delivery_date)}
                      </p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full shrink-0 ${delay > 5 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                      {delay}d
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Upcoming */}
        <div className="card">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
            <Calendar className="w-4 h-4 text-blue-500 shrink-0" />
            <h2 className="font-semibold text-slate-800 text-sm">Proximas Entregas</h2>
          </div>
          {upcoming.length === 0 ? (
            <p className="text-xs text-slate-400 px-4 py-4">Nenhuma entrega agendada.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {upcoming.map(r => {
                const days = r.planned_delivery_date
                  ? Math.ceil((new Date(r.planned_delivery_date).getTime() - Date.now()) / 86400000)
                  : null;
                return (
                  <div key={r.id} className="flex items-center justify-between px-4 py-3">
                    <div className="min-w-0 mr-2">
                      <p className="font-mono text-xs font-bold" style={{ color: '#008434' }}>{r.machine?.code ?? '—'}</p>
                      <p className="text-xs text-slate-500 truncate">{r.contract ?? '—'}</p>
                    </div>
                    <div className="text-right shrink-0">
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
      </div>

      {/* Stage dates + Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Stage change timeline for active orders */}
        <div className="card">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
            <Clock className="w-4 h-4 text-purple-500 shrink-0" />
            <h2 className="font-semibold text-slate-800 text-sm">Historico de Etapas</h2>
          </div>
          <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
            {active.slice(0, 8).map(r => {
              const stages = [
                { label: 'Mec.',  date: (r as any).dt_mechanical, color: '#3b82f6' },
                { label: 'Ele.',  date: (r as any).dt_electrical, color: '#8b5cf6' },
                { label: 'Chk.', date: (r as any).dt_checklist,  color: '#f59e0b' },
                { label: 'Emb.', date: (r as any).dt_packaging,  color: '#f97316' },
              ].filter(s => s.date);

              return (
                <div key={r.id} className="px-4 py-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-mono text-xs font-bold" style={{ color: '#008434' }}>{r.machine?.code ?? '—'}</span>
                    <span className="text-xs text-slate-400">{r.contract ?? '—'}</span>
                    <span className="ml-auto text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: `${STAGE_COLORS[r.status]}20`, color: STAGE_COLORS[r.status], fontSize: '10px' }}>
                      {PRODUCTION_STATUS_CONFIG[r.status].label}
                    </span>
                  </div>
                  {stages.length > 0 ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      {stages.map((s, i) => (
                        <div key={i} className="flex items-center gap-1">
                          <span className="text-xs font-semibold" style={{ color: s.color, fontSize: '10px' }}>{s.label}</span>
                          <span className="text-slate-500" style={{ fontSize: '10px' }}>
                            {new Date(s.date).toLocaleDateString('pt-BR')}
                          </span>
                          {i < stages.length - 1 && <ChevronRight className="w-3 h-3 text-slate-300" />}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">Aguardando inicio</p>
                  )}
                </div>
              );
            })}
            {active.length === 0 && <p className="text-xs text-slate-400 px-4 py-4">Nenhuma ordem ativa.</p>}
          </div>
        </div>

        {/* Performance */}
        <div className="card">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
            <ChevronRight className="w-4 h-4 shrink-0" style={{ color: '#008434' }} />
            <h2 className="font-semibold text-slate-800 text-sm">Maquinas por Etapa</h2>
          </div>
          <div className="px-4 py-3 space-y-3">
            {STATUS_ORDER.map(status => {
              const count = records.filter(r => r.status === status).length;
              const pct   = maxCount > 0 ? (count / maxCount) * 100 : 0;
              return (
                <div key={status} className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 w-28 shrink-0">{PRODUCTION_STATUS_CONFIG[status].label}</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: STAGE_COLORS[status] }} />
                  </div>
                  <span className="text-xs font-bold text-slate-700 w-4 text-right shrink-0">{count}</span>
                </div>
              );
            })}
          </div>
          <div className="px-4 py-3 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between">
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
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-slate-500">Maior atraso</span>
              <span className="text-xs font-bold text-red-500">
                {delayedSorted[0] ? `${calcDelay(delayedSorted[0])}d` : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
