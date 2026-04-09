'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Package, Ship, AlertTriangle, ShoppingCart, Info } from 'lucide-react';
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
  items: ImportMachineItem[];        // available (not reserved)
  allItems?: ImportMachineItem[];    // all items
  reservedCodes?: string[];          // already reserved
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
  // activeImports already filtered to only those with available machines
  const hasImport         = activeImports.length > 0;
  const noStockNoImport   = !hasStock && !hasImport;
  const selectedImportObj = activeImports.find(i => i.id === importId);

  useEffect(() => {
    setSource(''); setImportId(''); setImportMachine('');
  }, [machineId]);

  // Auto-set purchase when no options
  useEffect(() => {
    if (machineId && noStockNoImport) setSource('purchase');
  }, [machineId, noStockNoImport]);

  useEffect(() => {
    if (importId && selectedImportObj) {
      if (selectedImportObj.items.length === 1) setImportMachine(selectedImportObj.items[0].machine_code);
      else {
        const match = selectedImportObj.items.find(i => i.machine_code === selectedMachine?.code);
        setImportMachine(match ? match.machine_code : '');
      }
    }
  }, [importId]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!machineId) { setError('Selecione um equipamento.'); return; }

    const isPurchase = noStockNoImport || source === 'purchase';
    const isImport   = source === 'import' && !!importId;
    const isStock    = source === 'stock';

    if (!production && !isPurchase && !isImport && !isStock) {
      setError('Selecione a origem da maquina.'); return;
    }
    if (isImport && !importId) { setError('Selecione a P.O. de importacao.'); return; }

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
        machine_source:         isImport ? 'import' : 'stock',
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
        generate_purchase_need: isPurchase,
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
    if (noStockNoImport || source === 'purchase') return 'Criar + Solicitar Compra';
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

          {/* Source selection */}
          {!production && machineId && (
            <div className="space-y-3">
              <label className={lbl}>Origem da maquina *</label>

              {/* No stock and no available import */}
              {noStockNoImport ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
                  <div className="flex items-start gap-3">
                    <ShoppingCart className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-amber-800">Sem estoque e sem importacao disponivel</p>
                      <p className="text-xs text-amber-700 mt-1">
                        Todas as maquinas em importacao ja estao reservadas ou nao ha importacao ativa.
                        Uma <strong>solicitacao de compra urgente</strong> sera gerada para o contrato <strong>{contract || '—'}</strong>.
                      </p>
                    </div>
                  </div>
                  <div className="bg-white border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                    <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700">
                      A solicitacao aparecera na aba <strong>Compras</strong> onde voce pode criar uma nova importacao ou marcar como atendida.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {/* Stock button */}
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

                  {/* Import button */}
                  <button type="button"
                    onClick={() => hasImport ? setSource('import') : undefined}
                    disabled={!hasImport}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      source === 'import' ? 'border-blue-500 bg-blue-50' :
                      hasImport ? 'border-slate-200 hover:border-slate-300' :
                      'border-slate-100 bg-slate-50 opacity-60 cursor-not-allowed'
                    }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Ship className={`w-4 h-4 ${source === 'import' ? 'text-blue-600' : hasImport ? 'text-slate-400' : 'text-slate-300'}`} />
                      <span className={`text-sm font-semibold ${source === 'import' ? 'text-blue-700' : hasImport ? 'text-slate-700' : 'text-slate-400'}`}>Em Importacao</span>
                    </div>
                    <p className={`text-xs ${hasImport ? 'text-blue-600' : 'text-slate-400'}`}>
                      {hasImport ? `${activeImports.length} P.O. disponivel` : 'Todas reservadas'}
                    </p>
                  </button>
                </div>
              )}

              {/* Stock confirmation */}
              {source === 'stock' && !noStockNoImport && (
                <div className={`p-3 rounded-lg border text-xs ${hasStock ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-600'}`}>
                  {hasStock
                    ? `✓ ${selectedMachine?.qty_physical} unidade(s) disponivel. Uma reserva sera criada para o contrato ${contract || '—'}.`
                    : <span className="flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5 shrink-0" />Sem estoque! Uma solicitacao de compra sera gerada.</span>
                  }
                </div>
              )}

              {/* Import flow */}
              {source === 'import' && !noStockNoImport && (
                <div className="space-y-3 border border-blue-100 rounded-xl p-4 bg-blue-50/30">
                  <div>
                    <label className={lbl}>
                      <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-white text-xs mr-1.5 font-bold" style={{ backgroundColor: '#2563eb' }}>1</span>
                      Selecionar P.O. de Importacao
                    </label>
                    <select value={importId} onChange={e => { setImportId(e.target.value); setImportMachine(''); }} className={inp}>
                      <option value="">Escolher P.O....</option>
                      {activeImports.map(imp => (
                        <option key={imp.id} value={imp.id}>
                          {imp.po_prosyst ?? 'Sem P.O.'} — {imp.supplier ?? '—'}
                          {imp.estimated_arrival ? ` · Porto: ${new Date(imp.estimated_arrival).toLocaleDateString('pt-BR')}` : ''}
                          {` · ${imp.items.length} maquina(s) disponivel`}
                        </option>
                      ))}
                    </select>
                  </div>

                  {importId && selectedImportObj && selectedImportObj.items.length > 0 && (
                    <div>
                      <label className={lbl}>
                        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-white text-xs mr-1.5 font-bold" style={{ backgroundColor: '#2563eb' }}>2</span>
                        Equipamento disponivel nesta P.O.
                      </label>
                      <select value={importMachine} onChange={e => setImportMachine(e.target.value)} className={inp}>
                        <option value="">Selecionar equipamento...</option>
                        {selectedImportObj.items.map(item => (
                          <option key={item.machine_code} value={item.machine_code}>
                            {item.machine_code}{item.machine_name ? ` — ${item.machine_name.slice(0, 45)}` : ''}
                            {item.quantity && item.quantity > 1 ? ` (Qtd: ${item.quantity})` : ''}
                          </option>
                        ))}
                      </select>

                      {/* Show reserved machines as info */}
                      {selectedImportObj.reservedCodes && selectedImportObj.reservedCodes.length > 0 && (
                        <div className="mt-2 p-2 bg-slate-50 border border-slate-200 rounded-lg">
                          <p className="text-xs text-slate-500">
                            Ja reservadas nesta P.O.: {selectedImportObj.reservedCodes.join(', ')}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {importId && (
                    <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
                      ✓ Maquina reservada para contrato <strong>{contract || '—'}</strong> vinculada a P.O. <strong>{selectedImportObj?.po_prosyst ?? '—'}</strong>
                    </div>
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
