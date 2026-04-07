'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Machine, MachineNote } from '@/types';
import MachineForm from './MachineForm';
import { addMachineNote } from '@/lib/actions/machines';
import { Pencil, Send, Loader2, MessageSquare } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

interface MachineDetailClientProps {
  machine: Machine & { machine_notes?: (MachineNote & { profile?: { full_name: string | null } })[] };
  view?: 'actions' | 'notes';
}

export default function MachineDetailClient({ machine, view = 'actions' }: MachineDetailClientProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [showEdit, setShowEdit] = useState(false);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim()) return;
    setSaving(true);
    await addMachineNote(machine.id, note.trim());
    setNote('');
    setSaving(false);
    startTransition(() => router.refresh());
  }

  // Render the edit button + modal
  if (view === 'actions') {
    return (
      <>
        <button
          onClick={() => setShowEdit(true)}
          className="btn-secondary"
        >
          <Pencil className="w-4 h-4" />
          Editar
        </button>

        {showEdit && (
          <MachineForm
            machine={machine}
            onClose={() => setShowEdit(false)}
            onSuccess={() => startTransition(() => router.refresh())}
          />
        )}
      </>
    );
  }

  // Render notes panel
  return (
    <div className="flex flex-col gap-4">
      {/* Note input */}
      <form onSubmit={handleAddNote} className="flex gap-2">
        <input
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Adicionar observação..."
          className="input-base flex-1 text-xs"
        />
        <button
          type="submit"
          disabled={saving || !note.trim()}
          className="btn-primary px-3"
          title="Enviar nota"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </form>

      {/* Notes list */}
      <div className="space-y-3">
        {!machine.machine_notes || machine.machine_notes.length === 0 ? (
          <div className="text-center py-6">
            <MessageSquare className="w-6 h-6 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-400">Nenhuma nota ainda.</p>
          </div>
        ) : (
          [...machine.machine_notes]
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .map(n => (
              <div key={n.id} className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                <p className="text-sm text-slate-700 leading-relaxed">{n.content}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-slate-400 font-medium">
                    {n.profile?.full_name ?? 'Usuário'}
                  </span>
                  <span className="text-xs text-slate-400">
                    {formatDateTime(n.created_at)}
                  </span>
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
}
