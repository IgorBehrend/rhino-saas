'use client';

import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { createMachine, updateMachine } from '@/lib/actions/machines';
import { Machine } from '@/types';
import { MACHINE_TYPES } from '@/lib/utils';

interface MachineFormProps {
  machine?: Machine;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function MachineForm({ machine, onClose, onSuccess }: MachineFormProps) {
  const [code, setCode]               = useState(machine?.code ?? '');
  const [name, setName]               = useState(machine?.name ?? '');
  const [type, setType]               = useState(machine?.machine_type ?? '');
  const [qtySystem, setQtySystem]     = useState(machine?.qty_system ?? 0);
  const [qtyPhysical, setQtyPhysical] = useState(machine?.qty_physical ?? 0);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code || !name) { setError('Código e modelo são obrigatórios.'); return; }
    setLoading(true); setError(null);

    const payload = {
      code, name,
      machine_type: type || null,
      status: 'available' as const,
      qty_system: Number(qtySystem),
      qty_physical: Number(qtyPhysical),
      contract: machine?.contract ?? null,
      invoice_in: machine?.invoice_in ?? null,
      invoice_out: machine?.invoice_out ?? null,
      notes: machine?.notes ?? null,
      image_url: machine?.image_url ?? null,
    };

    const result = machine ? await updateMachine(machine.id, payload) : await createMachine(payload);
    if (result?.error) { setError(result.error); }
    else { onSuccess?.(); onClose(); }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="font-semibold text-slate-900">{machine ? 'Editar Equipamento' : 'Cadastrar Equipamento'}</h2>
            <p className="text-xs text-slate-500 mt-0.5">Cadastro de máquinas e equipamentos</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label-base">Código *</label>
            <input required value={code} onChange={e => setCode(e.target.value)} placeholder="ex: 4931-T" className="input-base font-mono" />
          </div>
          <div>
            <label className="label-base">Modelo de Máquina *</label>
            <input required value={name} onChange={e => setName(e.target.value)} placeholder="ex: CNC LASER RMF 1530 METAL - 3000 W" className="input-base" />
          </div>
          <div>
            <label className="label-base">Tipo</label>
            <select value={type} onChange={e => setType(e.target.value)} className="input-base">
              <option value="">Selecionar tipo...</option>
              {MACHINE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-base">Qtd. Estoque Sistema</label>
              <input type="number" min={0} value={qtySystem} onChange={e => setQtySystem(+e.target.value)} className="input-base" />
            </div>
            <div>
              <label className="label-base">Qtd. Estoque Físico</label>
              <input type="number" min={0} value={qtyPhysical} onChange={e => setQtyPhysical(+e.target.value)} className="input-base" />
            </div>
          </div>
          {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {machine ? 'Salvar alterações' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
