'use client';

import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { createImport, updateImport } from '@/lib/actions/imports';
import { Import, ImportStatus } from '@/types/imports';

interface ImportFormProps {
  record?: Import;
  machines: { code: string; name: string }[]; // only registered machines
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

export default function ImportForm({ record, machines, onClose, onSuccess }: ImportFormProps) {
  const [orderDate,   setOrderDate]   = useState(record?.order_date ?? '');
  const [poProsyst,   setPoProsyst]   = useState(record?.po_prosyst ?? '');
  const [poRhino,     setPoRhino]     = useState(record?.po_rhino ?? '');
  const [supplier,    setSupplier]    = useState(record?.supplier ?? '');
  const [poDate,      setPoDate]      = useState(record?.po_date ?? '');
  const [code,        setCode]        = useState(record?.code ?? '');
  const [quantity,    setQuantity]    = useState<number | ''>(record?.quantity ?? '');
  const [description, setDescription] = useState(record?.description ?? '');
  const [reference,   setReference]   = useState(record?.reference ?? '');
  const [estShipment, setEstShipment] = useState(record?.estimated_shipment ?? '');
  const [estArrival,  setEstArrival]  = useState(record?.estimated_arrival ?? '');
  const [status,      setStatus]      = useState<ImportStatus>(record?.status ?? 'pending');
  const [notes,       setNotes]       = useState(record?.notes ?? '');
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  // Auto-fill description when code is selected
  useEffect(() => {
    if (code) {
      const found = machines.find(m => m.code === code);
      if (found && !description) setDescription(found.name);
    }
  }, [code]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);

    const payload = {
      order_date:         orderDate || null,
      po_prosyst:         poProsyst || null,
      po_rhino:           poRhino || null,
      supplier:           supplier || null,
      po_date:            poDate || null,
      code:               code || null,
      quantity:           quantity !== '' ? Number(quantity) : null,
      description:        description || null,
      reference:          reference || null,
      estimated_shipment: estShipment || null,
      estimated_arrival:  estArrival || null,
      status,
      notes:              notes || null,
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
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">{record ? 'Editar Importação' : 'Nova Importação'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Pedido */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Dados do Pedido</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Data Realizada do Pedido</label>
                <input type="date" value={orderDate} onChange={e => setOrderDate(e.target.value)} className={inp} />
              </div>
              <div>
                <label className={lbl}>Status</label>
                <select value={status} onChange={e => setStatus(e.target.value as ImportStatus)} className={inp}>
                  {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>P.O. Prosyst</label>
                <input value={poProsyst} onChange={e => setPoProsyst(e.target.value)} placeholder="Nº P.O. Prosyst" className={inp} />
              </div>
              <div>
                <label className={lbl}>P.O. Rhino</label>
                <input value={poRhino} onChange={e => setPoRhino(e.target.value)} placeholder="Nº P.O. Rhino" className={inp} />
              </div>
              <div>
                <label className={lbl}>Fornecedor</label>
                <input value={supplier} onChange={e => setSupplier(e.target.value)} placeholder="Nome do fornecedor" className={inp} />
              </div>
              <div>
                <label className={lbl}>Data PO</label>
                <input type="date" value={poDate} onChange={e => setPoDate(e.target.value)} className={inp} />
              </div>
            </div>
          </div>

          {/* Item */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Dados do Item</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className={lbl}>Código da Máquina</label>
                <select value={code} onChange={e => setCode(e.target.value)} className={inp}>
                  <option value="">Selecionar equipamento cadastrado...</option>
                  {machines.map(m => (
                    <option key={m.code} value={m.code}>
                      {m.code} — {m.name.slice(0, 60)}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-400 mt-1">Somente equipamentos cadastrados em Máquinas podem ser selecionados.</p>
              </div>
              <div>
                <label className={lbl}>Quantidade</label>
                <input type="number" min={0} step="0.01" value={quantity} onChange={e => setQuantity(e.target.value === '' ? '' : +e.target.value)} placeholder="0" className={inp} />
              </div>
              <div>
                <label className={lbl}>Referência</label>
                <input value={reference} onChange={e => setReference(e.target.value)} placeholder="Referência do item" className={inp} />
              </div>
              <div className="col-span-2">
                <label className={lbl}>Descrição</label>
                <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Descrição do item (preenchido automaticamente pelo código)" className={inp} />
              </div>
            </div>
          </div>

          {/* Logística */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Logística</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Previsão de Embarque</label>
                <input type="date" value={estShipment} onChange={e => setEstShipment(e.target.value)} className={inp} />
              </div>
              <div>
                <label className={lbl}>Previsão de Chegada no Porto</label>
                <input type="date" value={estArrival} onChange={e => setEstArrival(e.target.value)} className={inp} />
              </div>
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className={lbl}>Observações</label>
            <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Observações gerais..." className={`${inp} resize-none`} />
          </div>

          {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}

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
