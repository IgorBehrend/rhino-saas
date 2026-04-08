'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Import, ImportStatus } from '@/types/imports';
import { deleteImport } from '@/lib/actions/imports';
import { formatDate, truncate } from '@/lib/utils';
import ImportForm from './ImportForm';
import ConfirmDelete from '@/components/ui/ConfirmDelete';
import EmptyState from '@/components/ui/EmptyState';
import { Plus, Search, Pencil, Trash2, Ship, Package, Filter } from 'lucide-react';

interface ImportListProps {
  records: Import[];
}

const STATUS_CONFIG: Record<ImportStatus, { label: string; color: string; bg: string; dot: string }> = {
  pending:  { label: 'Pendente',        color: 'text-slate-600',   bg: 'bg-slate-100 border-slate-200',    dot: 'bg-slate-400' },
  ordered:  { label: 'Pedido Realiz.', color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-200',       dot: 'bg-blue-500' },
  shipped:  { label: 'Embarcado',       color: 'text-indigo-700',  bg: 'bg-indigo-50 border-indigo-200',   dot: 'bg-indigo-500' },
  port:     { label: 'No Porto',        color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200',     dot: 'bg-amber-500' },
  customs:  { label: 'Desembaraço',     color: 'text-orange-700',  bg: 'bg-orange-50 border-orange-200',   dot: 'bg-orange-500' },
  received: { label: 'Recebido',        color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500' },
};

export default function ImportList({ records }: ImportListProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [editRecord, setEditRecord] = useState<Import | undefined>();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = records.filter(r => {
    const matchSearch = !search || [r.po_prosyst, r.po_rhino, r.code, r.description, r.supplier]
      .some(v => v?.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  async function handleDelete(id: string) {
    await deleteImport(id);
    startTransition(() => router.refresh());
  }

  // Days until arrival
  function daysUntil(dateStr: string | null): number | null {
    if (!dateStr) return null;
    const diff = new Date(dateStr).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por P.O., código, fornecedor..."
            className="input-base pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-base w-auto">
            <option value="all">Todos os status</option>
            {Object.entries(STATUS_CONFIG).map(([v, c]) => (
              <option key={v} value={v}>{c.label}</option>
            ))}
          </select>
        </div>
        <button onClick={() => { setEditRecord(undefined); setShowForm(true); }} className="btn-primary shrink-0">
          <Plus className="w-4 h-4" />
          Nova importação
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
        {Object.entries(STATUS_CONFIG).map(([status, cfg]) => {
          const count = records.filter(r => r.status === status).length;
          return (
            <button
              key={status}
              onClick={() => setStatusFilter(statusFilter === status ? 'all' : status)}
              className={`card p-3 text-center transition-all hover:shadow-md ${statusFilter === status ? 'ring-2 ring-green-500' : ''}`}
            >
              <p className="text-2xl font-bold text-slate-800">{count}</p>
              <p className="text-xs text-slate-500 mt-0.5">{cfg.label}</p>
            </button>
          );
        })}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Ship}
          title="Nenhuma importação encontrada"
          description="Crie uma nova importação para começar o rastreamento."
          action={
            <button onClick={() => setShowForm(true)} className="btn-primary">
              <Plus className="w-4 h-4" /> Nova importação
            </button>
          }
        />
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Data Pedido</th>
                <th>P.O. Prosyst</th>
                <th>P.O. Rhino</th>
                <th>Fornecedor</th>
                <th>Código</th>
                <th>Qtd</th>
                <th>Descrição</th>
                <th>Referência</th>
                <th>Prev. Embarque</th>
                <th>Prev. Porto</th>
                <th>Status</th>
                <th>Observações</th>
                <th className="text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => {
                const cfg = STATUS_CONFIG[r.status];
                const days = daysUntil(r.estimated_arrival);
                return (
                  <tr key={r.id}>
                    <td className="text-xs">{formatDate(r.order_date)}</td>
                    <td className="font-mono text-xs font-semibold text-slate-700">{r.po_prosyst ?? '—'}</td>
                    <td className="font-mono text-xs font-semibold" style={{ color: '#008434' }}>{r.po_rhino ?? '—'}</td>
                    <td className="text-xs">{r.supplier ?? '—'}</td>
                    <td className="font-mono text-xs">{r.code ?? '—'}</td>
                    <td className="text-xs text-right font-medium">{r.quantity ?? '—'}</td>
                    <td className="text-xs max-w-[160px]">
                      <span title={r.description ?? ''}>{truncate(r.description ?? '', 35)}</span>
                    </td>
                    <td className="text-xs">{r.reference ?? '—'}</td>
                    <td className="text-xs">{formatDate(r.estimated_shipment)}</td>
                    <td className="text-xs">
                      <div>
                        <span>{formatDate(r.estimated_arrival)}</span>
                        {days !== null && r.status !== 'received' && (
                          <span className={`block text-xs font-semibold mt-0.5 ${days < 0 ? 'text-red-600' : days <= 7 ? 'text-amber-600' : 'text-slate-400'}`}>
                            {days < 0 ? `${Math.abs(days)}d atraso` : `${days}d`}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${cfg.bg} ${cfg.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="text-xs max-w-[120px]">
                      <span title={r.notes ?? ''}>{truncate(r.notes ?? '', 30)}</span>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => { setEditRecord(r); setShowForm(true); }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <ConfirmDelete
                          title="Excluir importação"
                          description="Remover esta importação permanentemente?"
                          onConfirm={() => handleDelete(r.id)}
                        >
                          <button className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Excluir">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </ConfirmDelete>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-slate-100 text-xs text-slate-500">
            {filtered.length} de {records.length} importações
          </div>
        </div>
      )}

      {showForm && (
        <ImportForm
          record={editRecord}
          onClose={() => { setShowForm(false); setEditRecord(undefined); }}
          onSuccess={() => startTransition(() => router.refresh())}
        />
      )}
    </div>
  );
}
