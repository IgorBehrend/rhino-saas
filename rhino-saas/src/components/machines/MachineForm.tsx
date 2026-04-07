'use client';

import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { createMachine, updateMachine } from '@/lib/actions/machines';
import { Machine, MachineStatus, MachineFormData } from '@/types';
import { MACHINE_TYPES, MACHINE_STATUSES, STATUS_CONFIG } from '@/lib/utils';

interface MachineFormProps {
  machine?: Machine;
  onClose: () => void;
  onSuccess?: () => void;
}

const DEFAULT: MachineFormData = {
  code: '', name: '', machine_type: null, status: 'available',
  qty_system: 0, qty_physical: 0, contract: null,
  invoice_in: null, invoice_out: null, notes: null, image_url: null,
};

export default function MachineForm({ machine, onClose, onSuccess }: MachineFormProps) {
  const [form, setForm] = useState<MachineFormData>(machine ? {
    code: machine.code, name: machine.name, machine_type: machine.machine_type,
    status: machine.status, qty_system: machine.qty_system, qty_physical: machine.qty_physical,
    contract: machine.contract, invoice_in: machine.invoice_in,
    invoice_out: machine.invoice_out, notes: machine.notes, image_url: machine.image_url,
  } : DEFAULT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(key: keyof MachineFormData, value: unknown) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = machine
      ? await updateMachine(machine.id, form)
      : await createMachine(form);

    if (result?.error) {
      setError(result.error);
    } else {
      onSuccess?.();
      onClose();
    }
    setLoading(false);
  }

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">
            {machine ? 'Editar Máquina' : 'Nova Máquina'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Code + Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-base">Código *</label>
              <input
                required
                value={form.code}
                onChange={e => set('code', e.target.value)}
                placeholder="ex: 4931-T"
                className="input-base"
              />
            </div>
            <div>
              <label className="label-base">Tipo</label>
              <select value={form.machine_type ?? ''} onChange={e => set('machine_type', e.target.value || null)} className="input-base">
                <option value="">Selecionar...</option>
                {MACHINE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="label-base">Descrição / Nome *</label>
            <input
              required
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="ex: CNC LASER RMF 1530 METAL - 3000 W - COMPLETA"
              className="input-base"
            />
          </div>

          {/* Status + Quantities */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label-base">Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value as MachineStatus)} className="input-base">
                {MACHINE_STATUSES.map(s => (
                  <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-base">Qtd. Sistema</label>
              <input type="number" min={0} value={form.qty_system} onChange={e => set('qty_system', +e.target.value)} className="input-base" />
            </div>
            <div>
              <label className="label-base">Qtd. Física</label>
              <input type="number" min={0} value={form.qty_physical} onChange={e => set('qty_physical', +e.target.value)} className="input-base" />
            </div>
          </div>

          {/* Contract + Invoices */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label-base">Contrato / BL</label>
              <input value={form.contract ?? ''} onChange={e => set('contract', e.target.value || null)} placeholder="BL1010" className="input-base" />
            </div>
            <div>
              <label className="label-base">NF Entrada</label>
              <input value={form.invoice_in ?? ''} onChange={e => set('invoice_in', e.target.value || null)} placeholder="Nº NF" className="input-base" />
            </div>
            <div>
              <label className="label-base">NF Saída</label>
              <input value={form.invoice_out ?? ''} onChange={e => set('invoice_out', e.target.value || null)} placeholder="Nº NF" className="input-base" />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="label-base">Observações</label>
            <textarea
              rows={3}
              value={form.notes ?? ''}
              onChange={e => set('notes', e.target.value || null)}
              placeholder="Observações gerais sobre esta máquina..."
              className="input-base resize-none"
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {machine ? 'Salvar alterações' : 'Criar máquina'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
