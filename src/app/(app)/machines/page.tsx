import { getMachines } from '@/lib/actions/machines';
import { createClient } from '@/lib/supabase/server';
import Header from '@/components/layout/Header';
import MachineTable from '@/components/machines/MachineTable';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Máquinas' };

export default async function MachinesPage() {
  const supabase = await createClient();

  const [machines, importsResult] = await Promise.all([
    getMachines(),
    // Busca importações ativas (não recebidas) para vincular ao código da máquina
    supabase
      .from('imports')
      .select('code')
      .not('status', 'eq', 'received')
      .not('code', 'is', null),
  ]);

  // Lista de códigos que têm importações ativas
  const importCodes = (importsResult.data ?? [])
    .map((r: { code: string }) => r.code)
    .filter(Boolean);

  return (
    <div className="animate-slide-up">
      <Header
        title="Máquinas"
        description={`${machines.length} modelos cadastrados`}
      />
      <MachineTable machines={machines} importCodes={importCodes} />
    </div>
  );
}
