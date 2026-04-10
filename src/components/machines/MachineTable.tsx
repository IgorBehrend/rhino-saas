'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Machine } from '@/types';
import { MACHINE_TYPES, truncate } from '@/lib/utils';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmDelete from '@/components/ui/ConfirmDelete';
import MachineForm from './MachineForm';
import ExcelTools from '@/components/ui/ExcelTools';
import { deleteMachine, createMachine } from '@/lib/actions/machines';
import { Search, Filter, Plus, Pencil, Trash2, Package, Ship } from 'lucide-react';

interface MachineTableProps {
  machines: Machine[];
  importCodes?: string[];
}

const IMPORT_HEADERS = ['codigo', 'modelo', 'tipo', 'qtd_fisico'];
const IMPORT_SAMPLE  = [
  ['4931-T', 'CNC LASER RMF 1530 METAL - 3000 W', 'LASER', '2'],
  ['6269-T', 'MAQUINA ROUTER CNC RMC 3000 1S PLUS', 'ROUTER', '12'],
];

export default function MachineTable({ machines, importCodes = [] }: MachineTableProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [search, setSearch]           = useState('');
  const [typeFilter, setTypeFilter]   = useState('all');
  const [showForm, setShowForm]       = useState(false);
  const [editMachine, setEditMachine] = useState<Machine | undefined>();

  const filtered = machines.filter(m => {
    const matchSearch = !search ||
      m.code.toLowerCase().includes(search.toLowerCase()) ||
      m.name.toLowerCase().includes(search.toLowerCase());
    return matchSearch && (typeFilter === 'all' || m.machine_type === typeFilter);
  });

  async function handleDelete(id: string) {
    await deleteMachine(id);
    startTransition(() => router.refresh());
  }

  async function handleImport(rows: Record<string, string>[]) {
    let success = 0;
    const errors: string[] = [];
    for (let i = 0; i < rows.length; i++) {
      const row  = rows[i];
      const code = row['codigo']?.trim();
      const name = row['modelo']?.trim();
      if (!code || !name) { errors.push(`Linha ${i + 2}: codigo e modelo obrigatorios.`); continue; }
      const qty = parseInt(row['qtd_fisico'] ?? '0') || 0;
      const result = await createMachine({
        code, name,
        machine_type:  (row['tipo']?.trim() || null) as any,
        status:        'available',
        qty_system:    qty,
        qty_physical:  qty,
        contract: null, invoice_in: null, invoice_out: null, notes: null, image_url: null,
      });
      if (result?.error) { errors.push(`Linha ${i + 2} (${code}): ${result.error}`); }
      else { success++; }
    }
    startTransition(() => router.refresh());
    return { success, errors };
  }

  const exportConfig = {
    filename:  'equipamentos_rhino',
    sheetName: 'Equipamentos',
    headers:   ['Codigo', 'Modelo', 'Tipo', 'Qtd. Fisico', 'Em Importacao'],
    rows:      machines.map(m => [
      m.code, m.name, m.machine_type ?? '',
      m.qty_physical,
      importCodes.includes(m.code) ? 'Sim' : 'Nao',
    ]),
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por codigo ou modelo..." className="input-base pl-9" />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="input-base w-auto">
            <option value="all">Todos</option>
            {MACHINE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <ExcelTools showExport showImport exportConfig={exportConfig} onImport={handleImport}
          importTemplateHeaders={IMPORT_HEADERS} importTemplateSample={IMPORT_SAMPLE} />
        <button onClick={() => { setEditMachine(undefined); setShowForm(true); }} className="btn-primary shrink-0">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Cadastrar equipamento</span>
          <span className="sm:hidden">Novo</span>
        </button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Package} title="Nenhum equipamento encontrado" description="Cadastre ou importe via planilha Excel."
          action={<button onClick={() => setShowForm(true)} className="btn-primary"><Plus className="w-4 h-4" /> Cadastrar</button>}
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="table-container hidden lg:block">
            <table>
              <thead>
                <tr>
                  <th>Acoes</th>
                  <th>Codigo</th>
                  <th>Modelo de Maquina</th>
                  <th>Tipo</th>
                  <th className="text-right">Qtd. Estoque</th>
                  <th>Importacao Ativa</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(machine => {
                  const hasImport = importCodes.includes(machine.code);
                  return (
                    <tr key={machine.id}>
                      <td>
                        <div className="flex items-center gap-1">
                          <button onClick={() => { setEditMachine(machine); setShowForm(true); }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"><Pencil className="w-4 h-4" /></button>
                          <ConfirmDelete title="Excluir equipamento" description={`Remover "${machine.code}" permanentemente?`} onConfirm={() => handleDelete(machine.id)}>
                            <button className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 className="w-4 h-4" /></button>
                          </ConfirmDelete>
                        </div>
                      </td>
                      <td><span className="font-mono text-xs font-bold" style={{ color: '#008434' }}>{machine.code}</span></td>
                      <td className="max-w-[300px]"><span title={machine.name} className="text-slate-800 text-xs">{truncate(machine.name, 65)}</span></td>
                      <td><span className="text-xs text-slate-500 font-medium">{machine.machine_type ?? '—'}</span></td>
                      <td className="text-right">
                        <span className={`font-mono text-sm font-bold ${
                          machine.qty_physical === 0 ? 'text-red-500' : 'text-emerald-600'
                        }`}>
                          {machine.qty_physical}
                        </span>
                      </td>
                      <td>
                        {hasImport ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border bg-blue-50 text-blue-700 border-blue-200">
                            <Ship className="w-3 h-3" /> Em importacao
                          </span>
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
              {filtered.length} de {machines.length} equipamentos
            </div>
          </div>

          {/* Mobile cards */}
          <div className="lg:hidden space-y-2">
            {filtered.map(machine => {
              const hasImport = importCodes.includes(machine.code);
              return (
                <div key={machine.id} className="card p-4">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm font-bold" style={{ color: '#008434' }}>{machine.code}</span>
                        {machine.machine_type && <span className="text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{machine.machine_type}</span>}
                        {hasImport && <span className="inline-flex items-center gap-1 text-xs text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-full"><Ship className="w-3 h-3" /> Importacao</span>}
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-snug">{truncate(machine.name, 60)}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-slate-500">Estoque:
                          <strong className={`ml-1 ${machine.qty_physical === 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                            {machine.qty_physical} un
                          </strong>
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1 ml-2 shrink-0">
                      <button onClick={() => { setEditMachine(machine); setShowForm(true); }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"><Pencil className="w-4 h-4" /></button>
                      <ConfirmDelete title="Excluir equipamento" description={`Remover "${machine.code}"?`} onConfirm={() => handleDelete(machine.id)}>
                        <button className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </ConfirmDelete>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {showForm && (
        <MachineForm machine={editMachine}
          onClose={() => { setShowForm(false); setEditMachine(undefined); }}
          onSuccess={() => startTransition(() => router.refresh())}
        />
      )}
    </div>
  );
}
