'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Plus, Trash2 } from 'lucide-react';
import { createImport, updateImport } from '@/lib/actions/imports';
import { upsertImportItems } from '@/lib/actions/reservations';

interface ImportItem {
  machine_code: string;
  machine_name: string;
  quantity: number;
  reference: string;
  description: string;
}

interface ImportRecord {
  id?: string;
  order_date?: string | null;
  po_prosyst?: string | null;
  po_rhino?: string | null;
  supplier?: string | null;
  po_date?: string | null;
  estimated_shipment?: string | null;
  estimated_arrival?: string | null;
  status?: string;
  notes?: string | null;
  code?: string | null;
  description?: string | null;
  quantity?: number | null;
  reference?: string | null;
  items?: ImportItem[];
}

interface ImportFormProps {
  record?: ImportRecord;
  machines: { code: string; name: string }[];
  onClose: () => void;
  onSuccess?: () => void;
}

const STATUS_OPTIONS = [
  { value: 'pending',  label: 'Pendente' },
  { value: 'ordered',  label: 'Pedido Realizado' },
  { value: 'shipped',  label: 'Embarcado' },
  { value: 'port',     label: 'No Porto' },
  { value: 'customs',  label: 'Em Desembaraço' },
  { value: 'received', label: 'Recebido' },
];

function buildInitialItems(record?: ImportRecord): ImportItem[] {
  // If record has items array (from import_items table), use that
  if (record?.items && record.items.length > 0) {
    return record.items;
  }
  // Fallback: use legacy code/description/quantity/reference from imports table
  if (record?.code) {
    return [{
      machine_code: record.code,
      machine_name: record.description ?? record.code,
      quantity: record.quantity ?? 1,
      reference: record.reference ?? '',
      description: record.description ?? '',
    }];
  }
  // New record: start with one empty item
  return [{ machine_code: '', machine_name: '', quantity: 1, reference: '', description: '' }];
}

export default function ImportForm({ record, machines, onClose, onSuccess }: ImportFormProps) {
  const [orderDate,   setOrderDate]   = useState(record?.order_date ?? '');
  const [poProsyst,   setPoProsyst]   = useState(record?.po_prosyst ?? '');
  const [poRhino,     setPoRhino]     = useState(record?.po_rhino ?? '');
  const [supplier,    setSupplier]    = useState(record?.supplier ?? '');
  const [poDate,      setPoDate]      = useState(record?.po_date ?? '');
  const [estShipment, setEstShipment] = useState(record?.estimated_shipment ?? '');
  const [estArrival,  setEstArrival]  = useState(record?.estimated_arrival ?? '');
  const [status,      setStatus]      = useState(record?.status ?? 'pending');
  const [notes,       setNotes]       = useState(record?.notes ?? '');
  const [items,       setItems]       = useState<ImportItem[]>(() => buildInitialItems(record));
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  function updateItem(idx: number, field: keyof ImportItem, value: string | number) {
    setItems(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      if (field === 'machine_code' && value) {
        const found = machines.find(m => m.code === String(value));
        if (found) {
          next[idx].machine_name = found.name;
          if (!next[idx].description) next[idx].description = found.name;
        }
      }
      return next;
    });
  }

  function addItem() {
    setItems(prev => [...prev, { machine_code: '', machine_name: '', quantity: 1, reference: '', description: '' }]);
  }

  function removeItem(idx: number) {
    setItems(prev => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validItems = items.filter(i => i.machine_code);
    if (validItems.length === 0) { setError('Adicione pelo menos um equipamento.'); return; }

    setLoading(true); setError(null);

    const firstItem = validItems[0];
    const payload = {
      order_date:         orderDate || null,
      po_prosyst:         poProsyst || null,
      po_rhino:           poRhino || null,
      supplier:           supplier || null,
      po_date:            poDate || null,
      code:               firstItem.machine_code || null,
      quantity:           firstItem.quantity || null,
      description:        firstItem.description || null,
      reference:          firstItem.reference || null,
      estimated_shipment: estShipment || null,
      estimated_arrival:  estArrival || null,
      status:             status as any,
      notes:              notes || null,
    };

    let importId = record?.id;
    let result: any;

    if (record?.id) {
      result = await updateImport(record.id, payload);
    } else {
      result = await createImport(payload);
      if (result?.data) importId = result.data.id;
    }

    if (result?.error) { setError(result.error); setLoading(false); return; }

    // Save all items to import_items table
    if (importId) {
      await upsertImportItems(importId, validItems.map(i => ({
        machine_code: i.machine_code,
        machine_name: i.machine_name || undefined,
        quantity: Number(i.quantity) || 1,
        reference: i.reference || undefined,
        description: i.description || undefined,
      })));
    }

    onSuccess?.(); onClose();
    setLoading(false);
  }

  const inp = 'input-base';
  const lbl = 'label-base';
  const validCount = items.filter(i => i.machine_code).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <h2 className="font-semibold text-slate-900">{record?.id ? 'Editar Importação' : 'Nova Importação'}</h2>
            <p className="text-xs text-slate-500 mt-0.5">Adicione todos os equipamentos da mesma P.O.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* PO Header */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Dados da P.O.</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div><label className={lbl}>Data do Pedido</label><input type="date" value={orderDate} onChange={e => setOrderDate(e.target.value)} className={inp} /></div>
              <div>
                <label className={lbl}>Status</label>
                <select value={status} onChange={e => setStatus(e.target.value)} className={inp}>
                  {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div><label className={lbl}>P.O. Prosyst</label><input value={poProsyst} onChange={e => setPoProsyst(e.target.value)} placeholder="PO-2025-001" className={inp} /></div>
              <div><label className={lbl}>P.O. Rhino</label><input value={poRhino} onChange={e => setPoRhino(e.target.value)} placeholder="RH-65" className={inp} /></div>
              <div><label className={lbl}>Fornecedor</label><input value={supplier} onChange={e => setSupplier(e.target.value)} placeholder="Nome do fornecedor" className={inp} /></div>
              <div><label className={lbl}>Data PO</label><input type="date" value={poDate} onChange={e => setPoDate(e.target.value)} className={inp} /></div>
              <div><label className={lbl}>Prev. Embarque</label><input type="date" value={estShipment} onChange={e => setEstShipment(e.target.value)} className={inp} /></div>
              <div><label className={lbl}>Prev. Porto</label><input type="date" value={estArrival} onChange={e => setEstArrival(e.target.value)} className={inp} /></div>
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Equipamentos ({validCount})
              </h3>
              <button type="button" onClick={addItem} className="btn-secondary text-xs py-1.5 px-3">
                <Plus className="w-3.5 h-3.5" /> Adicionar equipamento
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={idx} className="border border-slate-200 rounded-xl p-4 relative">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-slate-500">Equipamento #{idx + 1}</span>
                    {items.length > 1 && (
                      <button type="button" onClick={() => removeItem(idx)} className="text-slate-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-2">
                      <label className={lbl}>Equipamento</label>
                      <select value={item.machine_code} onChange={e => updateItem(idx, 'machine_code', e.target.value)} className={inp}>
                        <option value="">Selecionar...</option>
                        {machines.map(m => (
                          <option key={m.code} value={m.code}>{m.code} — {m.name.slice(0, 40)}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={lbl}>Quantidade</label>
                      <input type="number" min={1} value={item.quantity} onChange={e => updateItem(idx, 'quantity', +e.target.value)} className={inp} />
                    </div>
                    <div>
                      <label className={lbl}>Referência</label>
                      <input value={item.reference} onChange={e => updateItem(idx, 'reference', e.target.value)} placeholder="Ref." className={inp} />
                    </div>
                    <div className="sm:col-span-4">
                      <label className={lbl}>Descrição</label>
                      <input value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} placeholder="Descrição do item" className={inp} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className={lbl}>Observações gerais</label>
            <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} className={`${inp} resize-none`} />
          </div>

          {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {record?.id ? 'Salvar alterações' : `Criar importação (${validCount} item${validCount !== 1 ? 's' : ''})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
