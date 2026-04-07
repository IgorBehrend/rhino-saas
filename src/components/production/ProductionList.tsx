'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Production, Machine, ProductionStatus } from '@/types';
import { PRODUCTION_STATUS_CONFIG, formatDate } from '@/lib/utils';
import ProductionForm from './ProductionForm';
import ProductionTimeline from './ProductionTimeline';
import ConfirmDelete from '@/components/ui/ConfirmDelete';
import EmptyState from '@/components/ui/EmptyState';
import { deleteProduction, updateProductionStatus } from '@/lib/actions/production';
import {
  Plus, Factory, Pencil, Trash2, ChevronRight,
  ChevronDown, AlertCircle, Calendar
} from 'lucide-react';

interface ProductionListProps {
  records: (Production & { machine?: Pick<Machine, 'id' | 'code' | 'name' | 'machine_type'> })[];
  machines: Pick<Machine, 'id' | 'code' | 'name'>[];
}

const STATUS_ORDER: ProductionStatus[] = [
  'pending', 'mechanical', 'electrical', 'checklist', 'packaging', 'ready', 'shipped'
];

export default function ProductionList({ records, machines }: ProductionListProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [editRecord, setEditRecord] = useState<Production | undefined>();
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [view, setView] = useState<'table' | 'board'>('table');

  const filtered = records.filter(r =>
    statusFilter === 'all' || r.status === statusFilter
  );

  async function handleDelete(id: string, machineId: string) {
    await deleteProduction(id, machineId);
    startTransition(() => router.refresh());
  }

  async function handleAdvance(record: Production) {
    const currentIdx = STATUS_ORDER.indexOf(record.status);
    const next = STATUS_ORDER[currentIdx + 1];
    if (!next) return;

    // Set completion date field based on current stage
    const extra: Record<string, string> = {};
    const now = new Date().toISOString();
    if (record.status === 'mechanical') extra.dt_mechanical = now;
    if (record.status === 'electrical') extra.dt_electrical = now;
    if (record.status === 'checklist')  extra.dt_checklist  = now;
    if (record.status === 'packaging')  extra.dt_packaging  = now;

    await updateProductionStatus(record.id, next, extra as never);
    startTransition(() => router.refresh());
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="input-base w-auto"
        >
          <option value="all">Todos os status</option>
          {STATUS_ORDER.map(s => (
            <option key={s} value={s}>{PRODUCTION_STATUS_CONFIG[s].label}</option>
          ))}
        </select>

        {/* View toggle */}
        <div className="flex rounded-lg border border-slate-200 overflow-hidden">
          <button
            onClick={() => setView('table')}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              view === 'table' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            Lista
          </button>
          <button
            onClick={() => setView('board')}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              view === 'board' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            Board
          </button>
        </div>

        <div className="flex-1" />

        <button
          onClick={() => { setEditRecord(undefined); setShowForm(true); }}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" />
          Nova ordem
        </button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Factory}
          title="Nenhuma ordem de produção"
          description="Crie uma nova ordem para começar a rastrear o progresso."
          action={
            <button onClick={() => setShowForm(true)} className="btn-primary">
              <Plus className="w-4 h-4" /> Nova ordem
            </button>
          }
        />
      ) : view === 'table' ? (
        /* ── TABLE VIEW ──────────────────────────────────── */
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th></th>
                <th>Máquina</th>
                <th>Contrato</th>
                <th>Status</th>
                <th>Resp. Mecânica</th>
                <th>Prev. Entrega</th>
                <th>Atraso</th>
                <th className="text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(record => (
                <>
                  <tr key={record.id} className="cursor-pointer" onClick={() => setExpandedId(expandedId === record.id ? null : record.id)}>
                    <td className="w-8">
                      {expandedId === record.id
                        ? <ChevronDown className="w-4 h-4 text-slate-400" />
                        : <ChevronRight className="w-4 h-4 text-slate-400" />
                      }
                    </td>
                    <td>
                      <div>
                        <p className="font-mono text-xs font-semibold text-orange-600">{record.machine?.code ?? '—'}</p>
                        <p className="text-xs text-slate-500 truncate max-w-[200px]">{record.machine?.name?.slice(0, 40) ?? ''}</p>
                      </div>
                    </td>
                    <td className="text-sm">{record.contract ?? '—'}</td>
                    <td>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        {PRODUCTION_STATUS_CONFIG[record.status].label}
                      </span>
                    </td>
                    <td className="text-sm">{record.responsible_mechanical ?? '—'}</td>
                    <td className="text-sm">{formatDate(record.planned_delivery_date)}</td>
                    <td>
                      {record.delay_days && record.delay_days > 0
                        ? <span className="flex items-center gap-1 text-xs text-red-600 font-semibold"><AlertCircle className="w-3 h-3" />{record.delay_days}d</span>
                        : <span className="text-xs text-slate-400">—</span>
                      }
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        {/* Advance status */}
                        {record.status !== 'shipped' && (
                          <button
                            onClick={() => handleAdvance(record)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                            title="Avançar status"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => { setEditRecord(record); setShowForm(true); }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <ConfirmDelete
                          title="Excluir ordem"
                          description="Remover esta ordem de produção permanentemente?"
                          onConfirm={() => handleDelete(record.id, record.machine_id)}
                        >
                          <button className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Excluir">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </ConfirmDelete>
                      </div>
                    </td>
                  </tr>
                  {/* Expanded timeline row */}
                  {expandedId === record.id && (
                    <tr key={`${record.id}-expand`}>
                      <td colSpan={8} className="bg-slate-50 px-6 py-4 border-b border-slate-100">
                        <ProductionTimeline production={record} />
                        {/* Responsibles summary */}
                        <div className="grid grid-cols-4 gap-3 mt-4 text-xs">
                          {[
                            ['Montagem Mecânica', record.responsible_mechanical, record.dt_mechanical],
                            ['Inst. Elétrica',    record.responsible_electrical, record.dt_electrical],
                            ['Check-List',        record.responsible_checklist,  record.dt_checklist],
                            ['Embalagem',         record.responsible_packaging,  record.dt_packaging],
                          ].map(([label, resp, dt]) => (
                            <div key={label as string} className="bg-white rounded-lg border border-slate-200 p-3">
                              <p className="font-semibold text-slate-500 mb-1">{label}</p>
                              <p className="text-slate-800">{resp ?? '—'}</p>
                              {dt && (
                                <p className="text-slate-400 mt-0.5 flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {formatDate(dt as string)}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-slate-100 text-xs text-slate-500">
            {filtered.length} ordem{filtered.length !== 1 ? 's' : ''}
          </div>
        </div>
      ) : (
        /* ── BOARD VIEW ──────────────────────────────────── */
        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3 overflow-x-auto pb-4">
          {STATUS_ORDER.map(statusCol => {
            const colRecords = filtered.filter(r => r.status === statusCol);
            return (
              <div key={statusCol} className="min-w-[160px]">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    {PRODUCTION_STATUS_CONFIG[statusCol].label}
                  </h3>
                  <span className="text-xs font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
                    {colRecords.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {colRecords.map(r => (
                    <div key={r.id} className="card p-3 text-xs space-y-1.5 hover:shadow-md transition-shadow">
                      <p className="font-mono font-bold text-orange-600">{r.machine?.code}</p>
                      <p className="text-slate-500 truncate">{r.contract ?? 'Sem contrato'}</p>
                      {r.planned_delivery_date && (
                        <p className="text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(r.planned_delivery_date)}
                        </p>
                      )}
                      {r.delay_days && r.delay_days > 0 && (
                        <span className="text-red-600 font-bold flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />{r.delay_days}d atraso
                        </span>
                      )}
                    </div>
                  ))}
                  {colRecords.length === 0 && (
                    <div className="border-2 border-dashed border-slate-200 rounded-lg p-3 text-center text-xs text-slate-400">
                      Vazio
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <ProductionForm
          production={editRecord}
          machines={machines}
          onClose={() => { setShowForm(false); setEditRecord(undefined); }}
          onSuccess={() => startTransition(() => router.refresh())}
        />
      )}
    </div>
  );
}
