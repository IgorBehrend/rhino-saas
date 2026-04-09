'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteImport } from '@/lib/actions/imports';
import { formatDate, truncate } from '@/lib/utils';
import ImportForm from './ImportForm';
import ConfirmDelete from '@/components/ui/ConfirmDelete';
import EmptyState from '@/components/ui/EmptyState';
import ExcelTools from '@/components/ui/ExcelTools';
import { Plus, Search, Pencil, Trash2, Ship, Filter, ChevronDown, ChevronRight, Lock } from 'lucide-react';

type ImportStatus = 'pending'|'ordered'|'shipped'|'port'|'customs'|'received';

interface Reservation {
  machine_code: string;
  machine_name: string | null;
  contract: string;
}

interface ImportItem {
  machine_code: string;
  machine_name: string | null;
  quantity: number;
}

interface ImportRecord {
  id: string;
  order_date: string | null;
  po_prosyst: string | null;
  po_rhino: string | null;
  supplier: string | null;
  po_date: string | null;
  code: string | null;
  quantity: number | null;
  description: string | null;
  reference: string | null;
  estimated_shipment: string | null;
  estimated_arrival: string | null;
  status: ImportStatus;
  notes: string | null;
  reservations?: Reservation[];
  import_items?: ImportItem[];
  items?: any[];
}

interface ImportListProps {
  records: ImportRecord[];
  machines: { code: string; name: string }[];
}

const STATUS_CONFIG: Record<ImportStatus, { label: string; color: string; bg: string; dot: string }> = {
  pending:  { label: 'Pendente',       color: 'text-slate-600',   bg: 'bg-slate-100 border-slate-200',    dot: 'bg-slate-400' },
  ordered:  { label: 'Pedido Realiz.', color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-200',       dot: 'bg-blue-500' },
  shipped:  { label: 'Embarcado',      color: 'text-indigo-700',  bg: 'bg-indigo-50 border-indigo-200',   dot: 'bg-indigo-500' },
  port:     { label: 'No Porto',       color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200',     dot: 'bg-amber-500' },
  customs:  { label: 'Desembaraco',    color: 'text-orange-700',  bg: 'bg-orange-50 border-orange-200',   dot: 'bg-orange-500' },
  received: { label: 'Recebido',       color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500' },
};

export default function ImportList({ records, machines }: ImportListProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [showForm, setShowForm]         = useState(false);
  const [editRecord, setEditRecord]     = useState<ImportRecord | undefined>();
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedId, setExpandedId]     = useState<string | null>(null);

  const filtered = records.filter(r => {
    const matchSearch = !search || [r.po_prosyst, r.po_rhino, r.code, r.description, r.supplier]
      .some(v => v?.toLowerCase().includes(search.toLowerCase()));
    return matchSearch && (statusFilter === 'all' || r.status === statusFilter);
  });

  async function handleDelete(id: string) {
    await deleteImport(id);
    startTransition(() => router.refresh());
  }

  function handleEdit(record: ImportRecord) {
    const items = record.import_items && record.import_items.length > 0
      ? record.import_items.map(i => ({ machine_code: i.machine_code, machine_name: i.machine_name ?? '', quantity: i.quantity, reference: '', description: i.machine_name ?? '' }))
      : record.code
        ? [{ machine_code: record.code, machine_name: record.description ?? record.code, quantity: record.quantity ?? 1, reference: record.reference ?? '', description: record.description ?? '' }]
        : [];
    setEditRecord({ ...record, items });
    setShowForm(true);
  }

  function daysUntil(dateStr: string | null): number | null {
    if (!dateStr) return null;
    return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
  }

  const exportConfig = {
    filename: 'importacoes_rhino', sheetName: 'Importacoes',
    headers: ['Data Pedido','P.O. Prosyst','P.O. Rhino','Fornecedor','Codigo','Qtd','Descricao','Prev. Embarque','Prev. Porto','Status','Reservadas'],
    rows: records.map(r => [
      formatDate(r.order_date), r.po_prosyst ?? '', r.po_rhino ?? '',
      r.supplier ?? '', r.code ?? '', r.quantity ?? '', r.description ?? '',
      formatDate(r.estimated_shipment), formatDate(r.estimated_arrival),
      STATUS_CONFIG[r.status].label,
      (r.reservations ?? []).map(res => `${res.machine_code}→${res.contract}`).join('; '),
    ]),
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por P.O., codigo, fornecedor..." className="input-base pl-9" />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-base w-auto">
            <option value="all">Todos os status</option>
            {Object.entries(STATUS_CONFIG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
          </select>
        </div>
        <ExcelTools showExport exportConfig={exportConfig} />
        <button onClick={() => { setEditRecord(undefined); setShowForm(true); }} className="btn-primary shrink-0">
          <Plus className="w-4 h-4" /> Nova importacao
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-2 mb-5">
        {Object.entries(STATUS_CONFIG).map(([status, cfg]) => (
          <button key={status} onClick={() => setStatusFilter(statusFilter === status ? 'all' : status)}
            className={`card p-3 text-center transition-all hover:shadow-md ${statusFilter === status ? 'ring-2 ring-green-600' : ''}`}>
            <p className="text-2xl font-bold text-slate-800">{records.filter(r => r.status === status).length}</p>
            <p className="text-xs text-slate-500 mt-0.5">{cfg.label}</p>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Ship} title="Nenhuma importacao" description="Crie uma nova importacao."
          action={<button onClick={() => setShowForm(true)} className="btn-primary"><Plus className="w-4 h-4" /> Nova importacao</button>}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map(r => {
            const cfg      = STATUS_CONFIG[r.status];
            const days     = daysUntil(r.estimated_arrival);
            const reserved = r.reservations ?? [];
            const items    = r.import_items ?? [];
            const isExpanded = expandedId === r.id;

            return (
              <div key={r.id} className="card overflow-hidden">
                {/* Main row */}
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : r.id)}
                >
                  {isExpanded
                    ? <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    : <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  }

                  <div className="flex-1 min-w-0 grid grid-cols-2 lg:grid-cols-5 gap-3 items-center">
                    {/* PO info */}
                    <div>
                      <p className="font-mono text-xs font-bold" style={{ color: '#008434' }}>{r.po_prosyst ?? '—'}</p>
                      <p className="text-xs text-slate-500">{r.supplier ?? '—'}</p>
                    </div>
                    {/* Code */}
                    <div>
                      <p className="font-mono text-xs font-semibold text-slate-700">{r.code ?? (items[0]?.machine_code ?? '—')}</p>
                      <p className="text-xs text-slate-400 truncate">{truncate(r.description ?? items[0]?.machine_name ?? '', 30)}</p>
                    </div>
                    {/* Dates */}
                    <div className="hidden lg:block">
                      <p className="text-xs text-slate-500">Embarque: <span className="font-medium text-slate-700">{formatDate(r.estimated_shipment)}</span></p>
                      <p className="text-xs text-slate-500">Porto: <span className={`font-medium ${days !== null && days < 0 ? 'text-red-600' : days !== null && days <= 7 ? 'text-amber-600' : 'text-slate-700'}`}>{formatDate(r.estimated_arrival)}{days !== null && r.status !== 'received' ? ` (${days < 0 ? `${Math.abs(days)}d atraso` : `${days}d`})` : ''}</span></p>
                    </div>
                    {/* Reservations badge */}
                    <div className="hidden lg:flex items-center gap-1 flex-wrap">
                      {reserved.length === 0 ? (
                        <span className="text-xs text-slate-400">Sem reservas</span>
                      ) : (
                        reserved.map((res, i) => (
                          <span key={i} className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                            <Lock className="w-2.5 h-2.5" />
                            {res.machine_code} → {res.contract}
                          </span>
                        ))
                      )}
                    </div>
                    {/* Status */}
                    <div className="flex items-center justify-end gap-2">
                      <span className={`badge ${cfg.bg} ${cfg.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />{cfg.label}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                    <button onClick={() => handleEdit(r)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <ConfirmDelete title="Excluir importacao" description="Remover esta importacao?" onConfirm={() => handleDelete(r.id)}>
                      <button className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </ConfirmDelete>
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50 px-5 py-4 space-y-4">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                      <div><span className="text-slate-400 block">P.O. Rhino</span><span className="font-medium text-slate-700">{r.po_rhino ?? '—'}</span></div>
                      <div><span className="text-slate-400 block">Data Pedido</span><span className="font-medium text-slate-700">{formatDate(r.order_date)}</span></div>
                      <div><span className="text-slate-400 block">Data PO</span><span className="font-medium text-slate-700">{formatDate(r.po_date)}</span></div>
                      <div><span className="text-slate-400 block">Quantidade</span><span className="font-medium text-slate-700">{r.quantity ?? '—'}</span></div>
                    </div>

                    {/* Items */}
                    {items.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Equipamentos desta P.O.</p>
                        <div className="space-y-1">
                          {items.map((item, i) => {
                            const isReserved = reserved.some(res => res.machine_code === item.machine_code);
                            return (
                              <div key={i} className="flex items-center gap-3 bg-white rounded-lg border border-slate-200 px-3 py-2">
                                <span className="font-mono text-xs font-bold" style={{ color: '#008434' }}>{item.machine_code}</span>
                                <span className="text-xs text-slate-600 flex-1 truncate">{item.machine_name ?? '—'}</span>
                                <span className="text-xs text-slate-500">Qtd: {item.quantity}</span>
                                {isReserved ? (
                                  <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                                    <Lock className="w-2.5 h-2.5" />
                                    Reservada — {reserved.find(res => res.machine_code === item.machine_code)?.contract}
                                  </span>
                                ) : (
                                  <span className="text-xs text-emerald-600 font-medium bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">Livre</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Reservations */}
                    {reserved.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Maquinas Reservadas</p>
                        <div className="space-y-1">
                          {reserved.map((res, i) => (
                            <div key={i} className="flex items-center gap-3 bg-purple-50 rounded-lg border border-purple-200 px-3 py-2">
                              <Lock className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                              <span className="font-mono text-xs font-bold text-purple-700">{res.machine_code}</span>
                              <span className="text-xs text-purple-600 flex-1 truncate">{res.machine_name ?? '—'}</span>
                              <span className="text-xs font-semibold text-purple-700 bg-purple-100 border border-purple-300 px-2 py-0.5 rounded-full">
                                Reservada — {res.contract}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {r.notes && (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Observacoes</p>
                        <p className="text-xs text-slate-600">{r.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <ImportForm
          record={editRecord}
          machines={machines}
          onClose={() => { setShowForm(false); setEditRecord(undefined); }}
          onSuccess={() => startTransition(() => router.refresh())}
        />
      )}
    </div>
  );
}
