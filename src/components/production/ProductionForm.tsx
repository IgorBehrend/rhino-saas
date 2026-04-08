'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Package, Ship, AlertTriangle } from 'lucide-react';
import { createProduction, updateProductionStatus } from '@/lib/actions/production';
import { Production, Machine } from '@/types';
import { PRODUCTION_STATUS_CONFIG } from '@/lib/utils';

interface ActiveImport {
  id: string;
  po_prosyst: string | null;
  supplier: string | null;
  estimated_arrival: string | null;
  items?: { machine_code: string }[];
  hasNoItems?: boolean;
}

interface ProductionFormProps {
  production?: Production;
  machines: Pick<Machine, 'id' | 'code' | 'name' | 'qty_physical' | 'qty_system'>[];
  activeImports?: ActiveImport[];
  onClose: () => void;
  onSuccess?: () => void;
}

const STATUS_ORDER = ['pending','mechanical','electrical','checklist','packaging','ready','shipped'] as const;

export default function ProductionForm({
  production, machines, activeImports = [], onClose, onSuccess
}: ProductionFormProps) {
  const [machineId,  setMachineId]  = useState(production?.machine_id ?? '');
  const [contract,   setContract]   = useState(production?.contract ?? '');
  const [status,     setStatus]     = useState(production?.status ?? 'pending');
  const [source,     setSource]     = useState<'stock'|'import'|''>('');
  const [importId,   setImportId]   = useState('');
  const [respMech,   setRespMech]   = useState(production?.responsible_mechanical ?? '');
  const [respElec,   setRespElec]   = useState(production?.responsible_electrical ?? '');
  const [respCheck,  setRespCheck]  = useState(production?.responsible_checklist ?? '');
  const [respPack,   setRespPack]   = useState(production?.responsible_packaging ?? '');
  const [planFab,    setPlanFab]    = useState(production?.planned_factory_date ?? '');
  const [planDel,    setPlanDel]    = useState(production?.planned_delivery_date ?? '');
  const [notes,      setNotes]      = useState(production?.notes ?? '');
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  const selectedMachine = machines.find(m => m.id === machineId);
  const hasStock = (selectedMachine?.qty_physical ?? 0) > 0;

  // Match imports: show if hasNoItems (legacy) OR if machine code is in items
  const relevantImports = activeImports.filter(imp =>
    imp.hasNoItems ||
    !imp.items ||
    imp.items.length === 0 ||
    imp.items.some(item => item.machine_code === selectedMachine?.code)
  );
  const hasImport = relevantImports.length > 0;

  useEffect(() => { setSource(''); setImportId(''); }, [machineId]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Auto-select import if only one available
  useEffect(() => {
    if (source === 'import' && relevantImports.length === 1 && !importId) {
      setImportId(relevantImports[0].id);
    }
  }, [source, relevantImports]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!machineId) { setError('Selecione um equipamento.'); return; }
    if (!production && !source) { setError('Selecione a origem da máquina.'); return; }
    if (source === 'import' && !importId) { setError('Selecione a P.O. de importação.'); return; }

    setLoading(true); setError(null);

    const selectedImport = activeImports.find(i => i.id === importId);

    if (production) {
      const result = await updateProductionStatus(production.id, status, {
        responsible_mechanical: respMech || null,
        responsible_electrical: respElec || null,
        responsible_checklist:  respCheck || null,
        responsible_packaging:  respPack || null,
        planned_factory_date:   planFab || null,
        planned_delivery_date:  planDel || null,
        notes: notes || null,
        contract: contract || null,
      });
      if (result?.error) { setError(result.error); setLoading(false); return; }
    } else {
      const result = await createProduction({
        machine_id: machineId,
        contract: contract || null,
        machine_source: source as 'stock' | 'import',
        import_id: importId || null,
        import_po_prosyst: selectedImport?.po_prosyst ?? null,
        responsible_mechanical: respMech || null,
        responsible_electrical: respElec || null,
        responsible_checklist:  respCheck || null,
        responsible_packaging:  respPack || null,
        planned_factory_date:   planFab || null,
        planned_delivery_date:  planDel || null,
        notes: notes || null,
        machine_code: selectedMachine?.code ?? '',
        machine_name: selectedMachine?.name,
        qty_physical: selectedMachine?.qty_physical,
      });
      if (result?.error) { setError(result.error); setLoading(false); return; }
    }

    onSuccess?.(); onClose();
    setLoading(false);
  }

  const inp = 'input-base';
  const lbl = 'label-base';

  const submitLabel = () => {
    if (production) return 'Salvar';
    if (source === 'import') return 'Criar + Reservar';
    if (!hasStock && !hasImport) return 'Criar + Gerar Necessidade de Compra';
    return 'Criar ordem';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">{production ? 'Editar Ordem' : 'Nova Ordem de Produção'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Machine + Contract */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Equipamento *</label>
              <select value={machineId} onChange={e => setMachineId(e.target.value)} className={inp} required disabled={!!production}>
                <option value="">Selecionar equipamento...</option>
                {machines.map(m => (
                  <option key={m.id} value={m.id}>{m.code} — {m.name.slice(0, 45)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={lbl}>Contrato / BL</label>
              <input value={contract} onChange={e => setContract(e.target.value)} placeholder="BL-2025-001" className={inp} />
            </div>
          </div>

          {/* Source selection */}
          {!production && machineId && (
            <div>
              <label className={lbl}>Origem da máquina *</label>
              <div className="grid grid-cols-2 gap-3 mt-1">
                <button type="button" onClick={() => { setSource('stock'); setImportId(''); }}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${source === 'stock' ? 'border-green-500 bg-green-50' : 'border-slate-200 hover:border-slate-300'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Package className={`w-4 h-4 ${source === 'stock' ? 'text-green-600' : 'text-slate-400'}`} />
                    <span className={`text-sm font-semibold ${source === 'stock' ? 'text-green-700' : 'text-slate-700'}`}>Em Estoque</span>
                  </div>
                  <p className={`text-xs ${hasStock ? 'text-green-600' : 'text-red-500'}`}>
                    {hasStock ? `${selectedMachine?.qty_physical} unidade(s) disponível` : '0 unidades disponíveis'}
                  </p>
                </button>

                <button type="button" onClick={() => setSource('import')}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${source === 'import' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Ship className={`w-4 h-4 ${source === 'import' ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span className={`text-sm font-semibold ${source === 'import' ? 'text-blue-700' : 'text-slate-700'}`}>Em Importação</span>
                  </div>
                  <p className={`text-xs ${hasImport ? 'text-blue-600' : 'text-slate-400'}`}>
                    {hasImport ? `${relevantImports.length} P.O. disponível` : 'Nenhuma P.O. ativa'}
                  </p>
                </button>
              </div>

              {/* Stock info */}
              {source === 'stock' && (
                <div className={`mt-3 p-3 rounded-lg border text-xs ${hasStock ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-600'}`}>
                  {hasStock
                    ? `✓ ${selectedMachine?.qty_physical} unidade(s) disponível. Será criada uma reserva para o contrato ${contract || '—'}.`
                    : '⚠ Sem estoque! Uma necessidade de compra será gerada automaticamente.'
                  }
                </div>
              )}

              {/* Import PO selector */}
              {source === 'import' && (
                <div className="mt-3 space-y-2">
                  <label className={lbl}>P.O. Prosyst vinculada *</label>
                  {relevantImports.length === 0 ? (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                      Nenhuma importação ativa encontrada.{' '}
                      <a href="/imports" className="underline font-medium">Criar importação</a>
                    </div>
                  ) : (
                    <>
                      <select value={importId} onChange={e => setImportId(e.target.value)} className={inp} required>
                        <option value="">Selecionar P.O....</option>
                        {relevantImports.map(imp => (
                          <option key={imp.id} value={imp.id}>
                            {imp.po_prosyst ?? 'Sem P.O.'} · {imp.supplier ?? '—'} · Porto: {imp.estimated_arrival ? new Date(imp.estimated_arrival).toLocaleDateString('pt-BR') : '—'}
                          </option>
                        ))}
                      </select>
                      {importId && (
                        <p className="text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                          ✓ Esta máquina ficará reservada para o contrato <strong>{contract || '—'}</strong> vinculada à P.O. selecionada.
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* No stock no import alert */}
              {!hasStock && !hasImport && source === '' && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>Sem estoque e sem importação ativa. Ao criar a ordem, uma <strong>necessidade de compra</strong> será gerada automaticamente.</span>
                </div>
              )}
            </div>
          )}

          {/* Status (edit only) */}
          {production && (
            <div>
              <label className={lbl}>Status</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {STATUS_ORDER.map(s => (
                  <button key={s} type="button" onClick={() => setStatus(s)}
                    className={`px-2 py-2 rounded-lg text-xs font-medium border transition-all ${status === s ? 'text-white border-transparent' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
                    style={status === s ? { backgroundColor: '#008434' } : {}}>
                    {PRODUCTION_STATUS_CONFIG[s].label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Responsibles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className={lbl}>Resp. Mont. Mecânica</label><input value={respMech} onChange={e => setRespMech(e.target.value)} placeholder="Nome" className={inp} /></div>
            <div><label className={lbl}>Resp. Inst. Elétrica</label><input value={respElec} onChange={e => setRespElec(e.target.value)} placeholder="Nome" className={inp} /></div>
            <div><label className={lbl}>Resp. Check-List</label><input value={respCheck} onChange={e => setRespCheck(e.target.value)} placeholder="Nome" className={inp} /></div>
            <div><label className={lbl}>Resp. Embalagem</label><input value={respPack} onChange={e => setRespPack(e.target.value)} placeholder="Nome" className={inp} /></div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className={lbl}>Prev. Rec. Fábrica</label><input type="date" value={planFab} onChange={e => setPlanFab(e.target.value)} className={inp} /></div>
            <div><label className={lbl}>Prev. Entrega Contrato</label><input type="date" value={planDel} onChange={e => setPlanDel(e.target.value)} className={inp} /></div>
          </div>

          <div>
            <label className={lbl}>Observações</label>
            <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} className={`${inp} resize-none`} />
          </div>

          {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitLabel()}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
