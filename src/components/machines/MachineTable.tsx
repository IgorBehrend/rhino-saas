'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Machine } from '@/types';
import { MACHINE_TYPES, MACHINE_STATUSES, STATUS_CONFIG, truncate } from '@/lib/utils';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmDelete from '@/components/ui/ConfirmDelete';
import MachineForm from './MachineForm';
import { deleteMachine } from '@/lib/actions/machines';
import { Search, Filter, Plus, Eye, Pencil, Trash2, Package, Ship } from 'lucide-react';

interface MachineTableProps {
  machines: Machine[];
  importCodes?: string[]; // codes that have active imports
}

export default function MachineTable({ machines, importCodes = [] }: MachineTableProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editMachine, setEditMachine] = useState<Machine | undefined>();

  const filtered = machines.filter(m => {
    const matchSearch = !search ||
      m.code.toLowerCase().includes(search.toLowerCase()) ||
      m.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || m.status === statusFilter;
    const matchType = typeFilter === 'all' || m.machine_type === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  async function handleDelete(id: string) {
    await deleteMachine(id);
    startTransition(() => router.refresh());
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
            placeholder="Buscar por código ou modelo..."
            className="input-base pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-base w-auto">
            <option value="all">Todos os status</option>
            {MACHINE_STATUSES.map(s => (
              <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
            ))}
          </select>
        </div>

        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="input-base w-auto">
          <option value="all">Todos os tipos</option>
          {MACHINE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        <button onClick={() => { setEditMachine(undefined); setShowForm(true); }} className="btn-primary shrink-0">
          <Plus className="w-4 h-4" />
          Nova máquina
        </button>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Nenhuma máquina encontrada"
          description="Tente ajustar os filtros ou criar uma nova máquina."
          action={
            <button onClick={() => setShowForm(true)} className="btn-primary">
              <Plus className="w-4 h-4" /> Nova máquina
            </button>
          }
        />
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Ações</th>
                <th>Código</th>
                <th>Modelo de Máquina</th>
                <th>Tipo</th>
                <th>Status</th>
                <th className="text-right">Qtd. Sistema</th>
                <th className="text-right">Qtd. Físico</th>
                <th>Importação</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(machine => {
                const hasImport = importCodes.includes(machine.code);
                return (
                  <tr key={machine.id}>
                    {/* Actions first for visibility */}
                    <td>
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/machines/${machine.id}`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                          title="Ver detalhes"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => { setEditMachine(machine); setShowForm(true); }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <ConfirmDelete
                          title="Excluir máquina"
                          description={`Remover "${machine.code}" permanentemente?`}
                          onConfirm={() => handleDelete(machine.id)}
                        >
                          <button className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Excluir">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </ConfirmDelete>
                      </div>
                    </td>
                    <td>
                      <Link href={`/machines/${machine.id}`} className="font-mono text-xs font-semibold hover:underline" style={{ color: '#008434' }}>
                        {machine.code}
                      </Link>
                    </td>
                    <td className="max-w-[280px]">
                      <span title={machine.name} className="text-slate-800 text-xs">
                        {truncate(machine.name, 60)}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs text-slate-500 font-medium">{machine.machine_type ?? '—'}</span>
                    </td>
                    <td>
                      <StatusBadge status={machine.status} />
                    </td>
                    <td className="text-right font-mono text-sm">{machine.qty_system}</td>
                    <td className="text-right font-mono text-sm">
                      <span className={machine.qty_physical !== machine.qty_system ? 'text-amber-600 font-semibold' : ''}>
                        {machine.qty_physical}
                      </span>
                    </td>
                    <td>
                      {hasImport ? (
                        <Link href="/imports" className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 transition-colors">
                          <Ship className="w-3 h-3" />
                          Em importação
                        </Link>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="px-4 py-3 border-t border-slate-100 text-xs text-slate-500">
            {filtered.length} de {machines.length} máquinas
          </div>
        </div>
      )}

      {showForm && (
        <MachineForm
          machine={editMachine}
          onClose={() => { setShowForm(false); setEditMachine(undefined); }}
          onSuccess={() => startTransition(() => router.refresh())}
        />
      )}
    </div>
  );
}
