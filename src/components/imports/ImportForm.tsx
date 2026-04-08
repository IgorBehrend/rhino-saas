'use client';

import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { createImport, updateImport } from '@/lib/actions/imports';
import { Import, ImportStatus } from '@/types/imports';

interface ImportFormProps {
  record?: Import;
  onClose: () => void;
  onSuccess?: () => void;
}

const STATUS_OPTIONS: { value: ImportStatus; label: string }[] = [
  { value: 'pending',  label: 'Pendente' },
  { value: 'ordered',  label: 'Pedido Realizado' },
  { value: 'shipped',  label: 'Embarcado' },
  { value: 'port',     label: 'No Porto' },
  { value: 'customs',  label: 'Em Desembaraço' },
  { value: 'received', label: 'Recebido' },
];

const EMPTY: Omit<Import, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  order_date: null, po_prosyst: null, po_rhino: null, supplier: null,
  po_date: null, code: null, quantity: null, description: null,
  reference: null, estimated_shipment: null, estimated_arrival: null,
  status: 'pending', notes: null,
};

export default function ImportForm({ record, onClose, onSuccess }: ImportFormProps) {
  const [form, setForm] = useState(record ? {
    order_date: record.order_date, po_prosyst: record.po_prosyst,
    po_rhino: record.po_rhino, supplier: record.supplier,
    po_date: record.po_date, code: record.code,
    quantity: record.quantity, description: record.description,
    reference: record.reference, estimated_shipment: record.estimated_shipment,
    estimated_arrival: record.estimated_arrival, status: record.status,
    notes: record.notes,
  } : EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(key: string, value: unknown) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      ...form,
      quantity: form.quantity ? Number(form.quantity) : null,
    };

    const result = record
      ? await updateImport(record.id, payload)
      : await createImport(payload);

    if (result?.error) { setError(result.error); }
    else { onSuccess?.(); onClose(); }
    setLoading(false);
  }

  const inp = 'input-base';
  const lbl = 'label-base';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">
            {record ? 'Editar Importação' : 'Nova Importação'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          {/* Seção: Pedido */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Dados do Pedido</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Data Realizada do Pedido</label>
                <input type="date" value={form.order_date ?? ''} onChange={e => set('order_date', e.target.value || null)} className={inp} />
              </div>
              <div>
                <label className={lbl}>Status</label>
                <select value={form.status} onChange={e => set('status', e.target.value)} className={inp}>
                  {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>P.O. Prosyst</label>
                <input value={form.po_prosyst ?? ''} onChange={e => set('po_prosyst', e.target.value || null)} placeholder="Nº P.O. Prosyst" className={inp} />
              </div>
              <div>
                <label className={lbl}>P.O. Rhino</label>
                <input value={form.po_rhino ?? ''} onChange={e => set('po_rhino', e.target.value || null)} placeholder="Nº P.O. Rhino" className={inp} />
              </div>
              <div>
                <label className={lbl}>Fornecedor</label>
                <input value={form.supplier ?? ''} onChange={e => set('supplier', e.target.value || null)} placeholder="Nome do fornecedor" className={inp} />
              </div>
              <div>
                <label className={lbl}>Data PO</label>
                <input type="date" value={form.po_date ?? ''} onChange={e => set('po_date', e.target.value || null)} className={inp} />
              </div>
            </div>
          </div>

          {/* Seção: Item */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Dados do Item</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Código</label>
                <input value={form.code ?? ''} onChange={e => set('code', e.target.value || null)} placeholder="Código do item" className={inp} />
              </div>
              <div>
                <label className={lbl}>Quantidade</label>
                <input type="number" min={0} step="0.01" value={form.quantity ?? ''} onChange={e => set('quantity', e.target.value || null)} placeholder="0" className={inp} />
              </div>
              <div className="col-span-2">
                <label className={lbl}>Descrição</label>
                <input value={form.description ?? ''} onChange={e => set('description', e.target.value || null)} placeholder="Descrição do item" className={inp} />
              </div>
              <div className="col-span-2">
                <label className={lbl}>Referência</label>
                <input value={form.reference ?? ''} onChange={e => set('reference', e.target.value || null)} placeholder="Referência do item" className={inp} />
              </div>
            </div>
          </div>

          {/* Seção: Logística */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Logística</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Previsão de Embarque</label>
                <input type="date" value={form.estimated_shipment ?? ''} onChange={e => set('estimated_shipment', e.target.value || null)} className={inp} />
              </div>
              <div>
                <label className={lbl}>Previsão de Chegada no Porto</label>
                <input type="date" value={form.estimated_arrival ?? ''} onChange={e => set('estimated_arrival', e.target.value || null)} className={inp} />
              </div>
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className={lbl}>Observações</label>
            <textarea
              rows={3}
              value={form.notes ?? ''}
              onChange={e => set('notes', e.target.value || null)}
              placeholder="Observações gerais sobre esta importação..."
              className={`${inp} resize-none`}
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {record ? 'Salvar alterações' : 'Criar importação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
