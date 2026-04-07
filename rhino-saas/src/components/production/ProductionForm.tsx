'use client';

import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { createProduction, updateProductionStatus } from '@/lib/actions/production';
import { Production, ProductionStatus, Machine } from '@/types';
import { PRODUCTION_STATUS_CONFIG } from '@/lib/utils';

interface ProductionFormProps {
  production?: Production;
  machines: Pick<Machine, 'id' | 'code' | 'name'>[];
  defaultMachineId?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ProductionForm({
  production, machines, defaultMachineId, onClose, onSuccess
}: ProductionFormProps) {
  const [machineId, setMachineId]   = useState(production?.machine_id ?? defaultMachineId ?? '');
  const [contract, setContract]     = useState(production?.contract ?? '');
  const [status, setStatus]         = useState<ProductionStatus>(production?.status ?? 'pending');
  const [respMech, setRespMech]     = useState(production?.responsible_mechanical ?? '');
  const [respElec, setRespElec]     = useState(production?.responsible_electrical ?? '');
  const [respCheck, setRespCheck]   = useState(production?.responsible_checklist ?? '');
  const [respPack, setRespPack]     = useState(production?.responsible_packaging ?? '');
  const [planFab, setPlanFab]       = useState(production?.planned_factory_date ?? '');
  const [planDel, setPlanDel]       = useState(production?.planned_delivery_date ?? '');
  const [notes, setNotes]           = useState(production?.notes ?? '');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!machineId) { setError('Selecione uma máquina.'); return; }
    setLoading(true);
    setError(null);

    const payload = {
      machine_id: machineId,
      contract: contract || null,
      status,
      responsible_mechanical: respMech || null,
      responsible_electrical: respElec || null,
      responsible_checklist:  respCheck || null,
      responsible_packaging:  respPack || null,
      planned_factory_date:   planFab || null,
      actual_factory_date:    null,
      planned_delivery_date:  planDel || null,
      actual_delivery_date:   null,
      notes: notes || null,
    };

    let result;
    if (production) {
      result = await updateProductionStatus(production.id, status, payload);
    } else {
      result = await createProduction(payload);
    }

    if (result?.error) { setError(result.error); }
    else { onSuccess?.(); onClose(); }
    setLoading(false);
  }

  const inputCls = 'input-base';
  const labelCls = 'label-base';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">
            {production ? 'Editar Produção' : 'Nova Ordem de Produção'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Machine + Contract */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Máquina *</label>
              <select value={machineId} onChange={e => setMachineId(e.target.value)} className={inputCls} required>
                <option value="">Selecionar...</option>
                {machines.map(m => (
                  <option key={m.id} value={m.id}>{m.code} — {m.name.slice(0, 40)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Contrato / BL</label>
              <input value={contract} onChange={e => setContract(e.target.value)} placeholder="BL1010" className={inputCls} />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className={labelCls}>Status da produção</label>
            <div className="grid grid-cols-4 gap-2">
              {(Object.entries(PRODUCTION_STATUS_CONFIG) as [ProductionStatus, { label: string; step: number }][]).map(([s, cfg]) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                    status === s
                      ? 'bg-orange-600 text-white border-orange-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-orange-400'
                  }`}
                >
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>

          {/* Responsible persons */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Resp. Montagem Mecânica</label>
              <input value={respMech} onChange={e => setRespMech(e.target.value)} placeholder="Nome do responsável" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Resp. Instalação Elétrica</label>
              <input value={respElec} onChange={e => setRespElec(e.target.value)} placeholder="Nome do responsável" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Resp. Check-List</label>
              <input value={respCheck} onChange={e => setRespCheck(e.target.value)} placeholder="Nome do responsável" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Resp. Embalagem</label>
              <input value={respPack} onChange={e => setRespPack(e.target.value)} placeholder="Nome do responsável" className={inputCls} />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Prev. Recebimento Fábrica</label>
              <input type="date" value={planFab} onChange={e => setPlanFab(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Prev. Entrega Contrato</label>
              <input type="date" value={planDel} onChange={e => setPlanDel(e.target.value)} className={inputCls} />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className={labelCls}>Observações</label>
            <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Observações da ordem de produção..." className={`${inputCls} resize-none`} />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {production ? 'Salvar alterações' : 'Criar ordem'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
