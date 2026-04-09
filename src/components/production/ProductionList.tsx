'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Production, Machine, ProductionStatus } from '@/types';
import { PRODUCTION_STATUS_CONFIG, formatDate } from '@/lib/utils';
import ProductionForm from './ProductionForm';
import ProductionTimeline from './ProductionTimeline';
import ConfirmDelete from '@/components/ui/ConfirmDelete';
import EmptyState from '@/components/ui/EmptyState';
import ExcelTools from '@/components/ui/ExcelTools';
import { deleteProduction, updateProductionStatus } from '@/lib/actions/production';
import { Plus, Factory, Pencil, Trash2, ChevronRight, ChevronDown, AlertCircle, Calendar, Search, X } from 'lucide-react';

interface ActiveImport {
  id: string;
  po_prosyst: string | null;
  supplier: string | null;
  estimated_arrival: string | null;
  items: { machine_code: string; machine_name?: string | null; quantity?: number }[];
  reservedCodes?: string[];
}

interface ProductionListProps {
  records: (Production & { machine?: Pick<Machine, 'id' | 'code' | 'name' | 'machine_type'> })[];
  machines: Pick<Machine, 'id' | 'code' | 'name' | 'qty_physical' | 'qty_system'>[];
  activeImports?: ActiveImport[];
}

const STATUS_ORDER: ProductionStatus[] = ['pending','mechanical','electrical','checklist','packaging','ready','shipped'];

export default function ProductionList({ records, machines, activeImports = [] }: ProductionListProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [showForm, setShowForm]         = useState(false);
  const [editRecord, setEditRecord]     = useState<Production | undefined>();
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedId, setExpandedId]     = useState<string | null>(null);
  const [view, setView]                 = useState<'table' | 'board'>('table');
  const [search, setSearch]             = useState('');

  // Apply search + status filter
  const filtered = records.filter(r => {
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    const q = search.toLowerCase();
    const matchSearch = !search || [
      r.machine?.code,
      r.machine?.name,
      r.contract,
      r.responsible_mechanical,
      r.responsible_electrical,
      PRODUCTION_STATUS_CONFIG[r.status]?.label,
    ].some(v => v?.toLowerCase().includes(q));
    return matchStatus && matchSearch;
  });

  async function handleDelete(id: string, machineId: string) {
    await deleteProduction(id, machineId);
    startTransition(() => router.refresh());
  }

  async function handleAdvance(record: Production) {
    const idx = STATUS_ORDER.indexOf(record.status);
    const next = STATUS_ORDER[idx + 1];
    if (!next) return;
    const extra: Record<string, string> = {};
    const now = new Date().toISOString();
    if (record.status === 'mechanical') extra.dt_mechanical = now;
    if (record.status === 'electrical') extra.dt_electrical = now;
    if (record.status === 'checklist')  extra.dt_checklist  = now;
    if (record.status === 'packaging')  extra.dt_packaging  = now;
    await updateProductionStatus(record.id, next, extra as never);
    startTransition(() => router.refresh());
  }

  const exportConfig = {
    filename: 'producao_rhino', sheetName: 'Producao',
    headers: ['Maquina (Cod)', 'Maquina (Modelo)', 'Contrato', 'Status', 'Resp. Mecanica', 'Resp. Eletrica', 'Prev. Entrega', 'Atraso (dias)'],
    rows: records.map(r => [
      r.machine?.code ?? '', r.machine?.name ?? '', r.contract ?? '',
      PRODUCTION_STATUS_CONFIG[r.status].label,
      r.responsible_mechanical ?? '', r.responsible_electrical ?? '',
      formatDate(r.planned_delivery_date), r.delay_days ?? '',
    ]),
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por maquina, contrato, responsavel..."
            className="input-base pl-9 pr-8"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Status filter */}
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-base w-auto">
          <option value="all">Todos os status</option>
          {STATUS_ORDER.map(s => (
            <option key={s} value={s}>{PRODUCTION_STATUS_CONFIG[s].label}</option>
          ))}
        </select>

        {/* View toggle */}
        <div className="flex rounded-lg border border-slate-200 overflow-hidden">
          {(['table', 'board'] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${view === v ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>
              {v === 'table' ? 'Lista' : 'Board'}
            </button>
          ))}
        </div>

        <div className="flex-1 hidden lg:block" />
        <ExcelTools showExport exportConfig={exportConfig} />
        <button onClick={() => { setEditRecord(undefined); setShowForm(true); }} className="btn-primary">
          <Plus className="w-4 h-4" /> Nova ordem
        </button>
      </div>

      {/* Search result count */}
      {search && (
        <p className="text-xs text-slate-500 mb-3">
          {filtered.length} resultado{filtered.length !== 1 ? 's' : ''} para "<span className="font-medium text-slate-700">{search}</span>"
        </p>
      )}

      {filtered.length === 0 ? (
        <EmptyState icon={Factory}
          title={search ? 'Nenhum resultado encontrado' : 'Nenhuma ordem de producao'}
          description={search ? `Nenhuma ordem corresponde a "${search}". Tente outro termo.` : 'Crie uma nova ordem de producao.'}
          action={!search ? <button onClick={() => setShowForm(true)} className="btn-primary"><Plus className="w-4 h-4" /> Nova ordem</button> : undefined}
        />
      ) : view === 'table' ? (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th></th>
                <th>Maquina</th>
                <th>Contrato</th>
                <th>Status</th>
                <th>Resp. Mecanica</th>
                <th>Prev. Entrega</th>
                <th>Atraso</th>
                <th className="text-right">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(record => (
                <>
                  <tr key={record.id} className="cursor-pointer" onClick={() => setExpandedId(expandedId === record.id ? null : record.id)}>
                    <td className="w-8">
                      {expandedId === record.id
                        ? <ChevronDown className="w-4 h-4 text-slate-400" />
                        : <ChevronRight className="w-4 h-4 text-slate-400" />}
                    </td>
                    <td>
                      <p className="font-mono text-xs font-semibold" style={{ color: '#008434' }}>{record.machine?.code ?? '—'}</p>
                      <p className="text-xs text-slate-500 truncate max-w-[180px]">{record.machine?.name?.slice(0, 35) ?? ''}</p>
                    </td>
                    <td className="text-sm font-medium">{record.contract ?? '—'}</td>
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
                        : <span className="text-xs text-slate-400">—</span>}
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        {record.status !== 'shipped' && (
                          <button onClick={() => handleAdvance(record)} className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors" title="Avancar etapa">
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => { setEditRecord(record); setShowForm(true); }} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <ConfirmDelete title="Excluir ordem" description="Remover esta ordem permanentemente?" onConfirm={() => handleDelete(record.id, record.machine_id)}>
                          <button className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </ConfirmDelete>
                      </div>
                    </td>
                  </tr>

                  {expandedId === record.id && (
                    <tr key={`${record.id}-exp`}>
                      <td colSpan={8} className="bg-slate-50 px-6 py-4 border-b border-slate-100">
                        <ProductionTimeline production={record} />
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4 text-xs">
                          {[
                            ['Mont. Mecanica',  record.responsible_mechanical, record.dt_mechanical],
                            ['Inst. Eletrica',  record.responsible_electrical, record.dt_electrical],
                            ['Check-List',      record.responsible_checklist,  record.dt_checklist],
                            ['Embalagem',       record.responsible_packaging,  record.dt_packaging],
                          ].map(([label, resp, dt]) => (
                            <div key={label as string} className="bg-white rounded-lg border border-slate-200 p-3">
                              <p className="font-semibold text-slate-500 mb-1">{label}</p>
                              <p className="text-slate-800">{resp ?? '—'}</p>
                              {dt && <p className="text-slate-400 mt-0.5 flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(dt as string)}</p>}
                            </div>
                          ))}
                        </div>
                        {record.notes && (
                          <div className="mt-3 p-3 bg-white rounded-lg border border-slate-200">
                            <p className="text-xs font-semibold text-slate-500 mb-1">Observacoes</p>
                            <p className="text-xs text-slate-700">{record.notes}</p>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-slate-100 text-xs text-slate-500">
            {filtered.length} de {records.length} ordem{records.length !== 1 ? 's' : ''}
            {search && <span className="ml-1 text-blue-600">(filtrado)</span>}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3 overflow-x-auto pb-4">
          {STATUS_ORDER.map(statusCol => {
            const col = filtered.filter(r => r.status === statusCol);
            return (
              <div key={statusCol} className="min-w-[140px]">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{PRODUCTION_STATUS_CONFIG[statusCol].label}</h3>
                  <span className="text-xs font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">{col.length}</span>
                </div>
                <div className="space-y-2">
                  {col.map(r => (
                    <div key={r.id} className="card p-3 text-xs space-y-1.5 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => { setEditRecord(r); setShowForm(true); }}>
                      <p className="font-mono font-bold" style={{ color: '#008434' }}>{r.machine?.code}</p>
                      <p className="text-slate-500 truncate">{r.contract ?? 'Sem contrato'}</p>
                      {r.planned_delivery_date && (
                        <p className="text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />{formatDate(r.planned_delivery_date)}
                        </p>
                      )}
                      {r.delay_days && r.delay_days > 0 && (
                        <span className="text-red-600 font-bold flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />{r.delay_days}d atraso
                        </span>
                      )}
                    </div>
                  ))}
                  {col.length === 0 && (
                    <div className="border-2 border-dashed border-slate-200 rounded-lg p-3 text-center text-xs text-slate-400">Vazio</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <ProductionForm
          production={editRecord}
          machines={machines}
          activeImports={activeImports}
          onClose={() => { setShowForm(false); setEditRecord(undefined); }}
          onSuccess={() => startTransition(() => router.refresh())}
        />
      )}
    </div>
  );
}
