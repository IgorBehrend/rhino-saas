'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { PurchaseNeed } from '@/types/reservations';
import { updatePurchaseNeedStatus, deletePurchaseNeed } from '@/lib/actions/reservations';
import ConfirmDelete from '@/components/ui/ConfirmDelete';
import EmptyState from '@/components/ui/EmptyState';
import { ShoppingCart, AlertTriangle, CheckCircle, Trash2, Ship, Filter } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

interface Props { needs: PurchaseNeed[]; }

const URGENCY_CONFIG = {
  urgent: { label: 'Urgente', color: 'text-red-700',   bg: 'bg-red-50 border-red-200',   dot: 'bg-red-500' },
  normal: { label: 'Normal',  color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', dot: 'bg-amber-500' },
  low:    { label: 'Baixa',   color: 'text-slate-600', bg: 'bg-slate-100 border-slate-200', dot: 'bg-slate-400' },
};

const STATUS_CONFIG = {
  open:        { label: 'Em aberto',    color: 'text-red-700',     bg: 'bg-red-50 border-red-200' },
  in_progress: { label: 'Em andamento', color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200' },
  fulfilled:   { label: 'Atendida',     color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  cancelled:   { label: 'Cancelada',    color: 'text-slate-500',   bg: 'bg-slate-100 border-slate-200' },
};

export default function PurchaseNeedsList({ needs }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [statusFilter, setStatusFilter] = useState('open');

  const filtered = needs.filter(n => statusFilter === 'all' || n.status === statusFilter);

  async function handleStatus(id: string, status: string) {
    await updatePurchaseNeedStatus(id, status);
    startTransition(() => router.refresh());
  }

  async function handleDelete(id: string) {
    await deletePurchaseNeed(id);
    startTransition(() => router.refresh());
  }

  const counts = {
    open:        needs.filter(n => n.status === 'open').length,
    in_progress: needs.filter(n => n.status === 'in_progress').length,
    fulfilled:   needs.filter(n => n.status === 'fulfilled').length,
    cancelled:   needs.filter(n => n.status === 'cancelled').length,
  };

  return (
    <div>
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {Object.entries(STATUS_CONFIG).map(([status, cfg]) => (
          <button key={status} onClick={() => setStatusFilter(statusFilter === status ? 'all' : status)}
            className={`card p-3 text-left transition-all hover:shadow-md ${statusFilter === status ? 'ring-2 ring-green-600' : ''}`}>
            <p className={`text-2xl font-bold ${status === 'open' ? 'text-red-600' : status === 'in_progress' ? 'text-amber-600' : 'text-slate-700'}`}>
              {counts[status as keyof typeof counts]}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">{cfg.label}</p>
          </button>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3 mb-4">
        <Filter className="w-4 h-4 text-slate-400" />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-base w-auto">
          <option value="all">Todos os status</option>
          {Object.entries(STATUS_CONFIG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={ShoppingCart} title="Nenhuma necessidade encontrada"
          description="As necessidades são geradas automaticamente quando uma ordem de produção é criada sem estoque nem importação disponível." />
      ) : (
        <div className="space-y-2">
          {filtered.map(need => {
            const urgCfg = URGENCY_CONFIG[need.urgency];
            const stsCfg = STATUS_CONFIG[need.status];
            return (
              <div key={need.id} className="card p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${urgCfg.dot}`} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm font-bold" style={{ color: '#008434' }}>{need.machine_code}</span>
                        <span className={`badge ${urgCfg.bg} ${urgCfg.color}`}>{urgCfg.label}</span>
                        <span className={`badge ${stsCfg.bg} ${stsCfg.color}`}>{stsCfg.label}</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 truncate">{need.machine_name ?? '—'}</p>
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        <span className="text-xs text-slate-500">Contrato: <strong className="text-slate-700">{need.contract}</strong></span>
                        <span className="text-xs text-slate-500">Qtd: <strong className="text-slate-700">{need.quantity}</strong></span>
                        <span className="text-xs text-slate-400">{formatDate(need.created_at)}</span>
                      </div>
                      {need.notes && <p className="text-xs text-slate-400 mt-1">{need.notes}</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    {need.status === 'open' && (
                      <>
                        <Link href="/imports"
                          className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors">
                          <Ship className="w-3.5 h-3.5" /> Criar importação
                        </Link>
                        <button onClick={() => handleStatus(need.id, 'in_progress')}
                          className="text-xs font-medium px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors">
                          Em andamento
                        </button>
                        <button onClick={() => handleStatus(need.id, 'fulfilled')}
                          className="text-xs font-medium px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors">
                          <CheckCircle className="w-3.5 h-3.5 inline mr-1" />Atendida
                        </button>
                      </>
                    )}
                    {need.status === 'in_progress' && (
                      <button onClick={() => handleStatus(need.id, 'fulfilled')}
                        className="text-xs font-medium px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors">
                        <CheckCircle className="w-3.5 h-3.5 inline mr-1" />Marcar como atendida
                      </button>
                    )}
                    <ConfirmDelete title="Excluir necessidade" description="Remover esta necessidade de compra?" onConfirm={() => handleDelete(need.id)}>
                      <button className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </ConfirmDelete>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
