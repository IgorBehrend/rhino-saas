'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Package, Ship, AlertTriangle, ShoppingCart } from 'lucide-react';
import { createProduction, updateProductionStatus } from '@/lib/actions/production';
import { Production, Machine } from '@/types';
import { PRODUCTION_STATUS_CONFIG } from '@/lib/utils';

interface ImportMachineItem {
  machine_code: string;
  machine_name?: string | null;
  quantity?: number;
}

interface ActiveImport {
  id: string;
  po_prosyst: string | null;
  supplier: string | null;
  estimated_arrival: string | null;
  items: ImportMachineItem[];
}

interface ProductionFormProps {
  production?: Production;
  machines: Pick<Machine, 'id' | 'code' | 'name' | 'qty_physical' | 'qty_system'>[];
  activeImports?: ActiveImport[];
  onClose: () => void;
  onSuccess?: () => void;
}

const STATUS_ORDER = ['pending','mechanical','electrical','checklist','packaging','ready','shipped'] as const;

export default function ProductionForm({ production, machines, activeImports = [], onClose, onSuccess }: ProductionFormProps) {
  const [machineId,     setMachineId]     = useState(production?.machine_id ?? '');
  const [contract,      setContract]      = useState(production?.contract ?? '');
  const [status,        setStatus]        = useState(production?.status ?? 'pending');
  const [source,        setSource]        = useState<'stock'|'import'|'purchase'|''>('');
  const [importId,      setImportId]      = useState('');
  const [importMachine, setImportMachine] = useState('');
  const [respMech,      setRespMech]      = useState(production?.responsible_mechanical ?? '');
  const [respElec,      setRespElec]      = useState(production?.responsible_electrical ?? '');
  const [respCheck,     setRespCheck]     = useState(production?.responsible_checklist ?? '');
  const [respPack,      setRespPack]      = useState(production?.responsible_packaging ?? '');
  const [planFab,       setPlanFab]       = useState(production?.planned_factory_date ?? '');
  const [planDel,       setPlanDel]       = useState(production?.planned_delivery_date ?? '');
  const [notes,         setNotes]         = useState(production?.notes ?? '');
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState<string | null>(null);

  const selectedMachine   = machines.find(m => m.id === machineId);
  const hasStock          = (selectedMachine?.qty_physical ?? 0) > 0;
  const hasImport         = activeImports.length > 0;
  const noStockNoImport   = !hasStock && !hasImport;

  const selectedImportObj = activeImports.find(i => i.id === importId);

  // When machine changes, reset source
  useEffect(() => {
    setSource('');
    setImportId('');
    setImportMachine('');
  }, [machineId]);

  // Auto-set source when no stock and no import
  useEffect(() => {
    if (machineId && noStockNoImport) {
      setSource('purchase');
    }
  }, [machineId, noStockNoImport]);

  // Auto-select machine inside import when only one option
  useEffect(() => {
    if (importId && selectedImportObj) {
      if (selectedImportObj.items.length === 1) {
        setImportMachine(selectedImportObj.items[0].machine_code);
      } else {
        const match = selectedImportObj.items.find(i => i.machine_code === selectedMachine?.code);
        if (match) setImportMachine(match.machine_code);
        else setImportMachine('');
      }
    }
  }, [importId]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!machineId) { setError('Selecione um equipamento.'); return; }

    // Determine final source
    let finalSource: 'stock' | 'import' | '' = '';
    if (source === 'stock') finalSource = 'stock';
    else if (source === 'import') {
      if (!importId) { setError('Selecione a P.O. de importacao.'); return; }
      finalSource = 'import';
    } else if (source === 'purchase' || noStockNoImport) {
      // Will generate purchase need - send empty source
      finalSource = '';
    } else if (!production) {
      setError('Selecione a origem da maquina.');
      return;
    }

    setLoading(true); setError(null);

    if (production) {
      const result = await updateProductionStatus(production.id, status, {
        responsible_mechanical: respMech || null,
        responsible_electrical: respElec || null,
        responsible_checklist:  respCheck || null,
        responsible_packaging:  respPack || null,
        planned_factory_date:   planFab || null,
        planned_delivery_date:  planDel || null,
        notes:                  notes || null,
        contract:               contract || null,
      });
      if (result?.error) { setError(result.error); setLoading(false); return; }
    } else {
      const result = await createProduction({
        machine_id:             machineId,
        contract:               contract || null,
        machine_source:         (finalSource || 'stock') as 'stock' | 'import',
        import_id:              importId || null,
        import_po_prosyst:      selectedImportObj?.po_prosyst ?? null,
        responsible_mechanical: respMech || null,
        responsible_electrical: respElec || null,
        responsible_checklist:  respCheck || null,
        responsible_packaging:  respPack || null,
        planned_factory_date:   planFab || null,
        planned_delivery_date:  planDel || null,
        notes:                  notes || null,
        machine_code:           selectedMachine?.code ?? '',
        machine_name:           selectedMachine?.name,
        qty_physical:           selectedMachine?.qty_physical,
        // Signal to action that no stock and no import = purchase need
        generate_purchase_need: noStockNoImport || source === 'purchase',
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
    if (source === 'import' && importId) return 'Criar + Reservar na Importacao';
    if (source === 'stock' && hasStock) return 'Criar + Reservar Estoque';
    if (noStockNoImport || source === 'purchase') return 'Criar + Gerar Necessidade de Compra';
    return 'Criar ordem';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">{production ? 'Editar Ordem' : 'Nova Ordem de Producao'}</h2>
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

          {/* Source selection — only for new orders */}
          {!production && machineId && (
            <div className="space-y-3">
              <label className={lbl}>Origem da maquina *</label>

              {/* No stock, no import — auto generate purchase need */}
              {noStockNoImport ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                  <ShoppingCart className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-700">Sem estoque e sem importacao ativa</p>
                    <p className="text-xs text-red-600 mt-1">Uma <strong>necessidade de compra urgente</strong> sera gerada automaticamente para o contrato <strong>{contract || '—'}</strong>.</p>
                    <p className="text-xs text-red-500 mt-1">Voce podera acompanha-la na aba Compras.</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {/* Stock */}
                  <button type="button" onClick={() => { setSource('stock'); setImportId(''); setImportMachine(''); }}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${source === 'stock' ? 'border-green-500 bg-green-50' : 'border-slate-200 hover:border-slate-300'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Package className={`w-4 h-4 ${source === 'stock' ? 'text-green-600' : 'text-slate-400'}`} />
                      <span className={`text-sm font-semibold ${source === 'stock' ? 'text-green-700' : 'text-slate-700'}`}>Em Estoque</span>
                    </div>
                    <p className={`text-xs ${hasStock ? 'text-green-600' : 'text-red-500'}`}>
                      {hasStock ? `${selectedMachine?.qty_physical} unidade(s) disponivel` : '0 unidades'}
                    </p>
                  </button>

                  {/* Import */}
                  <button type="button" onClick={() => setSource('import')}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${source === 'import' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Ship className={`w-4 h-4 ${source === 'import' ? 'text-blue-600' : 'text-slate-400'}`} />
                      <span className={`text-sm font-semibold ${source === 'import' ? 'text-blue-700' : 'text-slate-700'}`}>Em Importacao</span>
                    </div>
                    <p className={`text-xs ${hasImport ? 'text-blue-600' : 'text-slate-400'}`}>
                      {hasImport ? `${activeImports.length} P.O. ativa(s)` : 'Nenhuma P.O. ativa'}
                    </p>
                  </button>
                </div>
              )}

              {/* Stock confirmation */}
              {source === 'stock' && !noStockNoImport && (
                <div className={`p-3 rounded-lg border text-xs ${hasStock ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-600'}`}>
                  {hasStock
                    ? `✓ ${selectedMachine?.qty_physical} unidade(s) disponivel. Uma reserva sera criada para o contrato ${contract || '—'}.`
                    : <span className="flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Sem estoque! Uma necessidade de compra sera gerada automaticamente.</span>
                  }
                </div>
              )}

              {/* Import flow */}
              {source === 'import' && !noStockNoImport && (
                <div className="space-y-3 border border-blue-100 rounded-xl p-4 bg-blue-50/30">
                  {activeImports.length === 0 ? (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                      Nenhuma importacao ativa. <a href="/imports" className="underline font-medium">Criar importacao</a>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className={lbl}>
                          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-white text-xs mr-1" style={{ backgroundColor: '#2563eb' }}>1</span>
                          Selecionar P.O. de Importacao
                        </label>
                        <select value={importId} onChange={e => { setImportId(e.target.value); setImportMachine(''); }} className={inp}>
                          <option value="">Escolher P.O....</option>
                          {activeImports.map(imp => (
                            <option key={imp.id} value={imp.id}>
                              {imp.po_prosyst ?? 'Sem P.O.'} — {imp.supplier ?? '—'}{imp.estimated_arrival ? ` · Porto: ${new Date(imp.estimated_arrival).toLocaleDateString('pt-BR')}` : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      {importId && selectedImportObj && selectedImportObj.items.length > 0 && (
                        <div>
                          <label className={lbl}>
                            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-white text-xs mr-1" style={{ backgroundColor: '#2563eb' }}>2</span>
                            Equipamento desta P.O.
                          </label>
                          <select value={importMachine} onChange={e => setImportMachine(e.target.value)} className={inp}>
                            <option value="">Selecionar equipamento da P.O....</option>
                            {selectedImportObj.items.map(item => (
                              <option key={item.machine_code} value={item.machine_code}>
                                {item.machine_code}{item.machine_name ? ` — ${item.machine_name.slice(0, 45)}` : ''}
                                {item.quantity && item.quantity > 1 ? ` (Qtd: ${item.quantity})` : ''}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {importId && (
                        <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
                          ✓ Maquina reservada para contrato <strong>{contract || '—'}</strong> vinculada a P.O. <strong>{selectedImportObj?.po_prosyst ?? '—'}</strong>
                        </div>
                      )}
                    </>
                  )}
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
                    className={`px-2 py-2 rounded-lg text-xs font-medium border transition-all ${status === s ? 'text-white border-transparent' : 'bg-white text-slate-600 border-slate-200'}`}
                    style={status === s ? { backgroundColor: '#008434' } : {}}>
                    {PRODUCTION_STATUS_CONFIG[s].label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Responsibles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className={lbl}>Resp. Mont. Mecanica</label><input value={respMech} onChange={e => setRespMech(e.target.value)} placeholder="Nome" className={inp} /></div>
            <div><label className={lbl}>Resp. Inst. Eletrica</label><input value={respElec} onChange={e => setRespElec(e.target.value)} placeholder="Nome" className={inp} /></div>
            <div><label className={lbl}>Resp. Check-List</label><input value={respCheck} onChange={e => setRespCheck(e.target.value)} placeholder="Nome" className={inp} /></div>
            <div><label className={lbl}>Resp. Embalagem</label><input value={respPack} onChange={e => setRespPack(e.target.value)} placeholder="Nome" className={inp} /></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className={lbl}>Prev. Rec. Fabrica</label><input type="date" value={planFab} onChange={e => setPlanFab(e.target.value)} className={inp} /></div>
            <div><label className={lbl}>Prev. Entrega Contrato</label><input type="date" value={planDel} onChange={e => setPlanDel(e.target.value)} className={inp} /></div>
          </div>

          <div>
            <label className={lbl}>Observacoes</label>
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
